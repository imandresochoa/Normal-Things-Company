"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

const HOLD_MS = 1200;
const TOAST_SPRING = { type: "spring", stiffness: 300, damping: 35 } as const;
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

function toastAnchor(selection: Selection): { left: number; top: number; place: ToastPlace } {
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

function closedFromPlace(place: ToastPlace) {
  return {
    opacity: 0,
    scale: 0,
    y: place === "above" ? 15 : -15,
  };
}

const OPEN_POSE = { opacity: 1, scale: 1, x: 0, y: 0 };
const HIDDEN_FLAT = { opacity: 0, scale: 1, x: 0, y: 0 };

export function CopyToast() {
  const [view, setView] = useState<ToastView>({ kind: "hidden" });
  const reduceMotion = useReducedMotion() === true;

  const viewRef = useRef<ToastView>(view);
  const lastCopiedText = useRef("");
  const lastCopiedAt = useRef(0);
  const holdTimer = useRef<number | null>(null);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const clearTimer = (ref: { current: number | null }) => {
    if (ref.current !== null) {
      window.clearTimeout(ref.current);
      ref.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer(holdTimer);
    };
  }, []);

  const hideToast = useCallback(() => {
    clearTimer(holdTimer);
    setView({ kind: "hidden" });
  }, []);

  const scheduleExit = useCallback(() => {
    clearTimer(holdTimer);
    holdTimer.current = window.setTimeout(() => {
      const current = viewRef.current;
      if (current.kind !== "visible") {
        return;
      }

      if (reduceMotion) {
        hideToast();
        return;
      }

      setView({ ...current, open: false });
    }, HOLD_MS);
  }, [hideToast, reduceMotion]);

  const showToast = useCallback(
    (anchor: { left: number; top: number; place: ToastPlace }) => {
      setView({
        kind: "visible",
        ...anchor,
        open: true,
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

    try {
      await navigator.clipboard.writeText(text);
    } catch {
      return;
    }

    lastCopiedText.current = text;
    lastCopiedAt.current = now;
    showToast(toastAnchor(selection));
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

  const closed = reduceMotion ? HIDDEN_FLAT : closedFromPlace(view.place);
  const rest = OPEN_POSE;

  return (
    <div
      className="copy-toast-anchor pointer-events-none fixed z-50 select-none"
      style={anchorStyle}
    >
      <motion.div
        className="copy-toast relative whitespace-nowrap rounded-[8px] bg-foreground px-2 py-1 font-[family-name:var(--font-letter)] text-[14px] leading-[1.4] text-background"
        initial={closed}
        animate={view.open ? rest : closed}
        transition={reduceMotion ? { duration: 0 } : TOAST_SPRING}
        onAnimationComplete={() => {
          const current = viewRef.current;
          if (current.kind === "visible" && !current.open) {
            hideToast();
          }
        }}
        data-open={view.open ? "" : undefined}
        role="status"
        aria-live="polite"
      >
        Copied to clipboard!
      </motion.div>
    </div>
  );
}
