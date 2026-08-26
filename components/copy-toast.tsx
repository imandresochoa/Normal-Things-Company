"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const HOLD_MS = 1200;
const TOAST_FADE_MS = 200;
const REDUCE_TOAST_MS = 160;
const COPY_DEBOUNCE_MS = 100;
const VIEWPORT_PAD = 8;
const TOAST_GAP = 8;
const MOBILE_TOAST_GAP = 72;
const ESTIMATED_TOAST_HEIGHT = 32;
const ESTIMATED_TOAST_WIDTH = 145;
const SELECTION_KEYS = new Set([
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "End",
  "Home",
  "PageDown",
  "PageUp",
]);

type ToastPlace = "above" | "below";

type ToastView =
  | { kind: "hidden" }
  | {
      kind: "visible";
      left: number;
      top: number;
      place: ToastPlace;
      open: boolean;
    };

type AnchorStyle = CSSProperties & {
  "--copy-toast-y": string;
};

function selectionIsInEditable(selection: Selection): boolean {
  const node = selection.anchorNode;
  if (!node) {
    return true;
  }

  const element = node instanceof Element ? node : node.parentElement;
  if (!element) {
    return true;
  }

  return Boolean(
    element.closest(
      "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
    ),
  );
}

function finishedSelectionText(): string | null {
  const selection = window.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
    return null;
  }

  const text = selection.toString();
  if (!text.trim()) {
    return null;
  }

  if (selectionIsInEditable(selection)) {
    return null;
  }

  return text;
}

function toastGap(): number {
  return window.matchMedia("(pointer: coarse)").matches
    ? MOBILE_TOAST_GAP
    : TOAST_GAP;
}

function toastAnchor(
  selection: Selection,
): { left: number; top: number; place: ToastPlace } | null {
  if (selection.rangeCount === 0) {
    return null;
  }

  const rect = selection.getRangeAt(0).getBoundingClientRect();
  const halfWidth = ESTIMATED_TOAST_WIDTH / 2;
  const minLeft = VIEWPORT_PAD + halfWidth;
  const maxLeft = window.innerWidth - VIEWPORT_PAD - halfWidth;
  const left = Math.min(
    Math.max(rect.left + rect.width / 2, minLeft),
    Math.max(minLeft, maxLeft),
  );

  const gap = toastGap();
  const placeAbove = rect.top >= ESTIMATED_TOAST_HEIGHT + gap + VIEWPORT_PAD;
  const place: ToastPlace = placeAbove ? "above" : "below";
  const top = place === "above" ? rect.top - gap : rect.bottom + gap;

  return { left, top, place };
}

export function CopyToast() {
  const [view, setView] = useState<ToastView>({ kind: "hidden" });
  const [reduceMotion, setReduceMotion] = useState(false);

  const viewRef = useRef<ToastView>(view);
  const lastCopiedText = useRef("");
  const lastCopiedAt = useRef(0);
  const copyAttempt = useRef(0);
  const holdTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const openFrame = useRef<number | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      setReduceMotion(media.matches);
    };
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  const clearTimer = (ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  };

  const clearFrame = () => {
    if (openFrame.current !== null) {
      window.cancelAnimationFrame(openFrame.current);
      openFrame.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer(holdTimer);
      clearTimer(exitTimer);
      clearFrame();
    };
  }, []);

  const hideToast = useCallback(() => {
    clearTimer(holdTimer);
    clearTimer(exitTimer);
    setView({ kind: "hidden" });
  }, []);

  const scheduleExit = useCallback(() => {
    clearTimer(holdTimer);
    holdTimer.current = window.setTimeout(() => {
      const current = viewRef.current;
      if (current.kind !== "visible") {
        return;
      }

      setView({ ...current, open: false });

      const exitMs = reduceMotion ? REDUCE_TOAST_MS : TOAST_FADE_MS;
      exitTimer.current = window.setTimeout(() => {
        hideToast();
      }, exitMs);
    }, HOLD_MS);
  }, [hideToast, reduceMotion]);

  const showToast = useCallback(
    (anchor: { left: number; top: number; place: ToastPlace }) => {
      clearTimer(exitTimer);
      clearFrame();

      const current = viewRef.current;

      if (current.kind === "visible" && current.open) {
        setView({
          kind: "visible",
          ...anchor,
          open: true,
        });
        scheduleExit();
        return;
      }

      setView({
        kind: "visible",
        ...anchor,
        open: false,
      });

      openFrame.current = window.requestAnimationFrame(() => {
        openFrame.current = window.requestAnimationFrame(() => {
          openFrame.current = null;
          setView((next) =>
            next.kind === "visible" ? { ...next, open: true } : next,
          );
        });
      });

      scheduleExit();
    },
    [scheduleExit],
  );

  const tryCopy = useCallback(async () => {
    const text = finishedSelectionText();
    const selection = window.getSelection();
    if (!text || !selection) {
      return;
    }

    const now = Date.now();
    if (
      text === lastCopiedText.current &&
      now - lastCopiedAt.current < COPY_DEBOUNCE_MS
    ) {
      return;
    }

    if (!navigator.clipboard?.writeText) {
      return;
    }

    const anchor = toastAnchor(selection);
    if (!anchor) {
      return;
    }

    const attempt = ++copyAttempt.current;

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }

    if (attempt !== copyAttempt.current) {
      return;
    }

    lastCopiedText.current = text;
    lastCopiedAt.current = now;
    showToast(anchor);
  }, [showToast]);

  useEffect(() => {
    const onPointerUp = (event: PointerEvent) => {
      if (event.button !== 0) {
        return;
      }
      void tryCopy();
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (SELECTION_KEYS.has(event.key)) {
        void tryCopy();
        return;
      }

      if (
        event.key.toLowerCase() === "a" &&
        (event.metaKey || event.ctrlKey)
      ) {
        void tryCopy();
      }
    };

    document.addEventListener("pointerup", onPointerUp);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("pointerup", onPointerUp);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [tryCopy]);

  if (view.kind === "hidden") {
    return null;
  }

  const anchorStyle: AnchorStyle = {
    left: view.left,
    top: view.top,
    "--copy-toast-y": view.place === "above" ? "-100%" : "0%",
  };

  return (
    <div
      className="copy-toast-anchor pointer-events-none fixed z-50 select-none"
      style={anchorStyle}
    >
      <div
        className="copy-toast relative whitespace-nowrap rounded-[4px] bg-foreground px-2 py-1 font-[family-name:var(--font-letter)] text-[14px] leading-[1.4] text-background"
        data-open={view.open ? "" : undefined}
        role="status"
        aria-live="polite"
      >
        Copied to clipboard!
      </div>
    </div>
  );
}
