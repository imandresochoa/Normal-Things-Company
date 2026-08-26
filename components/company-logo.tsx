"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { logoFrenzySparks, logoSparks } from "@/lib/logo-sparks";
import { logoStrokes } from "@/lib/logo-strokes";

const HEAT_COOL_MS = 800;
const HEAT_OVERHEAT = 6;
/** Base overheat window plus one extra second of continuous sparks. */
const OVERHEAT_FRENZY_MS = 1800;
const SPARK_DURATION_MS = 240;
const SPARK_STAGGER_MS = 35;
const SPARK_BURST_MS =
  SPARK_DURATION_MS + (logoSparks.length - 1) * SPARK_STAGGER_MS;

type LogoColor = "orange" | "blue";
type LogoPhase = "idle" | "overheating";

type StrokeStyle = CSSProperties & {
  "--i": number;
};

type SparkStyle = CSSProperties & {
  "--i": number;
  "--spark-dx": string;
  "--spark-dy": string;
  "--spark-phase": string;
};

function strokeStyle(index: number): StrokeStyle {
  return { "--i": index };
}

function sparkStyle(
  index: number,
  spark: {
    dx: number;
    dy: number;
    phaseMs?: number;
  },
): SparkStyle {
  return {
    "--i": index,
    "--spark-dx": `${spark.dx}px`,
    "--spark-dy": `${spark.dy}px`,
    "--spark-phase": `${spark.phaseMs ?? 0}ms`,
  };
}

export function CompanyLogo() {
  const [pressed, setPressed] = useState(false);
  const [popping, setPopping] = useState(false);
  const [phase, setPhase] = useState<LogoPhase>("idle");
  const [color, setColor] = useState<LogoColor>("orange");
  const [burstId, setBurstId] = useState(0);
  const [sparkState, setSparkState] = useState<"idle" | "burst" | "frenzy">(
    "idle",
  );
  const [reduceMotion, setReduceMotion] = useState(false);

  const heatRef = useRef(0);
  const coolTimer = useRef<number | null>(null);
  const popTimer = useRef<number | null>(null);
  const burstTimer = useRef<number | null>(null);
  const overheatTimer = useRef<number | null>(null);
  const activePointer = useRef<number | null>(null);
  const isPressed = useRef(false);
  const suppressClick = useRef(false);
  const phaseRef = useRef<LogoPhase>("idle");
  const colorRef = useRef<LogoColor>("orange");

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    colorRef.current = color;
  }, [color]);

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

  useEffect(() => {
    return () => {
      clearTimer(coolTimer);
      clearTimer(popTimer);
      clearTimer(burstTimer);
      clearTimer(overheatTimer);
    };
  }, []);

  const scheduleCool = useCallback(() => {
    clearTimer(coolTimer);
    coolTimer.current = window.setTimeout(() => {
      if (phaseRef.current === "overheating") {
        return;
      }
      heatRef.current = 0;
      coolTimer.current = null;
    }, HEAT_COOL_MS);
  }, []);

  const triggerBurst = useCallback(() => {
    setBurstId((id) => id + 1);
    setSparkState("burst");
    clearTimer(burstTimer);
    burstTimer.current = window.setTimeout(() => {
      if (phaseRef.current === "overheating") {
        return;
      }
      setSparkState("idle");
      burstTimer.current = null;
    }, reduceMotion ? 160 : SPARK_BURST_MS);
  }, [reduceMotion]);

  const finishOverheat = useCallback(() => {
    clearTimer(overheatTimer);
    clearTimer(burstTimer);
    setColor(colorRef.current === "orange" ? "blue" : "orange");
    heatRef.current = 0;
    setSparkState("idle");
    setPhase("idle");
    phaseRef.current = "idle";
  }, []);

  const startOverheat = useCallback(() => {
    clearTimer(coolTimer);
    clearTimer(burstTimer);
    setPhase("overheating");
    phaseRef.current = "overheating";
    setPressed(false);
    isPressed.current = false;
    setPopping(false);

    if (reduceMotion) {
      setSparkState("burst");
      setBurstId((id) => id + 1);
      overheatTimer.current = window.setTimeout(() => {
        finishOverheat();
      }, 200);
      return;
    }

    // Continuous looping frenzy — do not remount/restart a one-shot burst.
    setBurstId((id) => id + 1);
    setSparkState("frenzy");
    overheatTimer.current = window.setTimeout(() => {
      finishOverheat();
    }, OVERHEAT_FRENZY_MS);
  }, [finishOverheat, reduceMotion]);

  const registerPress = useCallback(() => {
    if (phaseRef.current === "overheating") {
      return;
    }

    const next = heatRef.current + 1;
    heatRef.current = next;

    if (next >= HEAT_OVERHEAT) {
      if (!reduceMotion) {
        setPopping(true);
        clearTimer(popTimer);
        popTimer.current = window.setTimeout(() => {
          setPopping(false);
          popTimer.current = null;
        }, 160);
      }
      startOverheat();
      return;
    }

    scheduleCool();
    triggerBurst();

    if (!reduceMotion) {
      setPopping(true);
      clearTimer(popTimer);
      popTimer.current = window.setTimeout(() => {
        setPopping(false);
        popTimer.current = null;
      }, 160);
    }
  }, [reduceMotion, scheduleCool, startOverheat, triggerBurst]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (phaseRef.current === "overheating") {
      return;
    }
    if (event.button !== 0 && event.pointerType === "mouse") {
      return;
    }
    activePointer.current = event.pointerId;
    isPressed.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    setPressed(true);
  };

  const endPress = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (activePointer.current !== event.pointerId) {
      return;
    }
    activePointer.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (!isPressed.current) {
      return;
    }
    isPressed.current = false;
    setPressed(false);
    if (phaseRef.current === "overheating") {
      return;
    }
    suppressClick.current = true;
    registerPress();
  };

  const onPointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (activePointer.current !== event.pointerId) {
      return;
    }
    activePointer.current = null;
    isPressed.current = false;
    setPressed(false);
  };

  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (phaseRef.current === "overheating") {
      return;
    }
    registerPress();
  };

  const locked = phase === "overheating";
  const activeSparks =
    sparkState === "frenzy" ? logoFrenzySparks : logoSparks;

  return (
    <button
      type="button"
      aria-label="Normal Things Company"
      aria-disabled={locked}
      disabled={locked}
      className="logo-press relative h-[94.596px] w-[200px] shrink-0 touch-manipulation overflow-visible border-0 bg-transparent p-0 disabled:pointer-events-none"
      data-pressed={pressed ? "" : undefined}
      data-pop={popping ? "" : undefined}
      data-heat={phase === "overheating" ? "overheating" : "cool"}
      data-color={color}
      onPointerDown={onPointerDown}
      onPointerUp={endPress}
      onPointerCancel={onPointerCancel}
      onClick={onClick}
    >
      <svg
        className="logo-mark pointer-events-none absolute inset-0 size-full"
        viewBox="0 0 200 95"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        data-state="animate"
      >
        {logoStrokes.map((stroke, index) => (
          <path
            key={stroke.id}
            d={stroke.d}
            data-logo-stroke=""
            pathLength={1}
            fill="none"
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={strokeStyle(index)}
          />
        ))}
      </svg>
      <svg
        key={burstId}
        className="logo-sparks pointer-events-none absolute inset-[-12px] size-[calc(100%+24px)] overflow-visible"
        viewBox="-12 -12 224 119"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        overflow="visible"
        data-state={sparkState}
      >
        {activeSparks.map((spark, index) => (
          <line
            key={spark.id}
            x1={spark.x1}
            y1={spark.y1}
            x2={spark.x2}
            y2={spark.y2}
            data-spark=""
            stroke="currentColor"
            strokeWidth="3.2"
            strokeLinecap="round"
            style={sparkStyle(index, spark)}
          />
        ))}
      </svg>
    </button>
  );
}
