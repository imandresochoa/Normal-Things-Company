"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  COPY_TOAST_SPARK_HEIGHT,
  COPY_TOAST_SPARK_PAD,
  COPY_TOAST_SPARK_WIDTH,
  copyToastSparks,
} from "@/lib/copy-toast-sparks";

const HOLD_MS = 1200;
const REDUCE_TOAST_MS = 160;
const SPARK_DURATION_MS = 240;
const SPARK_STAGGER_MS = 35;
const SPARK_BURST_MS =
  SPARK_DURATION_MS + (copyToastSparks.length - 1) * SPARK_STAGGER_MS;
const COPY_DEBOUNCE_MS = 100;
const VIEWPORT_PAD = 8;
const TOAST_GAP = 8;
const ESTIMATED_TOAST_HEIGHT = 32;
const ESTIMATED_TOAST_WIDTH = COPY_TOAST_SPARK_WIDTH;
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
      burstId: number;
    };

type AnchorStyle = CSSProperties & {
  "--copy-toast-y": string;
};

type SparkStyle = CSSProperties & {
  "--i": number;
  "--spark-dx": string;
  "--spark-dy": string;
};

function sparkStyle(index: number, dx: number, dy: number): SparkStyle {
  return {
    "--i": index,
    "--spark-dx": `${dx}px`,
    "--spark-dy": `${dy}px`,
  };
}

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

function toastAnchor(selection: Selection): { left: number; top: number; place: ToastPlace } {
  const rect = selection.getRangeAt(0).getBoundingClientRect();
  const halfWidth = ESTIMATED_TOAST_WIDTH / 2;
  const minLeft = VIEWPORT_PAD + halfWidth;
  const maxLeft = window.innerWidth - VIEWPORT_PAD - halfWidth;
  const left = Math.min(
    Math.max(rect.left + rect.width / 2, minLeft),
    Math.max(minLeft, maxLeft),
  );

  const placeAbove = rect.top >= ESTIMATED_TOAST_HEIGHT + TOAST_GAP + VIEWPORT_PAD;
  const place: ToastPlace = placeAbove ? "above" : "below";
  const top = place === "above" ? rect.top - TOAST_GAP : rect.bottom + TOAST_GAP;

  return { left, top, place };
}

export function CopyToast() {
  const [view, setView] = useState<ToastView>({ kind: "hidden" });
  const [sparkState, setSparkState] = useState<"idle" | "burst">("idle");
  const [reduceMotion, setReduceMotion] = useState(false);

  const viewRef = useRef<ToastView>(view);
  const lastCopiedText = useRef("");
  const lastCopiedAt = useRef(0);
  const holdTimer = useRef<number | null>(null);
  const exitTimer = useRef<number | null>(null);
  const burstTimer = useRef<number | null>(null);
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
      clearTimer(burstTimer);
      clearFrame();
    };
  }, []);

  const triggerBurst = useCallback(
    (nextBurstId: number) => {
      setSparkState("burst");
      clearTimer(burstTimer);
      const holdMs = reduceMotion ? REDUCE_TOAST_MS : SPARK_BURST_MS;
      burstTimer.current = window.setTimeout(() => {
        setSparkState("idle");
        burstTimer.current = null;
      }, holdMs);
      return nextBurstId;
    },
    [reduceMotion],
  );

  const hideToast = useCallback(() => {
    clearTimer(holdTimer);
    clearTimer(exitTimer);
    setView({ kind: "hidden" });
    setSparkState("idle");
  }, []);

  const scheduleExit = useCallback(() => {
    clearTimer(holdTimer);
    holdTimer.current = window.setTimeout(() => {
      const current = viewRef.current;
      if (current.kind !== "visible") {
        return;
      }

      const burstId = triggerBurst(current.burstId + 1);
      setView({ ...current, open: false, burstId });

      const exitMs = reduceMotion ? REDUCE_TOAST_MS : SPARK_BURST_MS;
      exitTimer.current = window.setTimeout(() => {
        hideToast();
      }, exitMs);
    }, HOLD_MS);
  }, [hideToast, reduceMotion, triggerBurst]);

  const showToast = useCallback(
    (anchor: { left: number; top: number; place: ToastPlace }) => {
      clearTimer(exitTimer);
      clearFrame();

      const current = viewRef.current;
      const burstId = triggerBurst(
        current.kind === "visible" ? current.burstId + 1 : 1,
      );

      if (current.kind === "visible" && current.open) {
        setView({
          kind: "visible",
          ...anchor,
          open: true,
          burstId,
        });
        scheduleExit();
        return;
      }

      setView({
        kind: "visible",
        ...anchor,
        open: false,
        burstId,
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
    [scheduleExit, triggerBurst],
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

  const pad = COPY_TOAST_SPARK_PAD;
  const sparkWidth = COPY_TOAST_SPARK_WIDTH + pad * 2;
  const sparkHeight = COPY_TOAST_SPARK_HEIGHT + pad * 2;
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
      <svg
        key={view.burstId}
        className="copy-toast-sparks pointer-events-none absolute inset-[-16px] size-[calc(100%+32px)] overflow-visible text-foreground"
        viewBox={`${-pad} ${-pad} ${sparkWidth} ${sparkHeight}`}
        fill="none"
        xmlns="http://www.w3.org/1999/svg"
        aria-hidden="true"
        preserveAspectRatio="none"
        overflow="visible"
        data-state={sparkState}
      >
        {copyToastSparks.map((spark, index) => (
          <line
            key={spark.id}
            x1={spark.x1}
            y1={spark.y1}
            x2={spark.x2}
            y2={spark.y2}
            data-spark=""
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            style={sparkStyle(index, spark.dx, spark.dy)}
          />
        ))}
      </svg>
    </div>
  );
}
