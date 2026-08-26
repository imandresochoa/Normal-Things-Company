"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { logoSparks } from "@/lib/logo-sparks";
import { logoStrokes } from "@/lib/logo-strokes";

const HEAT_COOL_MS = 800;
const HEAT_TREMBLE = 4;
const HEAT_COLOR = 6;
const SPARK_DURATION_MS = 240;
const SPARK_STAGGER_MS = 35;
const SPARK_BURST_MS =
  SPARK_DURATION_MS + (logoSparks.length - 1) * SPARK_STAGGER_MS;

type LogoColor = "orange" | "blue";
type HeatMode = "cool" | "tremble" | "hot";

type StrokeStyle = CSSProperties & {
  "--i": number;
};

type SparkStyle = CSSProperties & {
  "--i": number;
  "--spark-dx": string;
  "--spark-dy": string;
};

function strokeStyle(index: number): StrokeStyle {
  return { "--i": index };
}

function sparkStyle(index: number, dx: number, dy: number): SparkStyle {
  return {
    "--i": index,
    "--spark-dx": `${dx}px`,
    "--spark-dy": `${dy}px`,
  };
}

function heatMode(heat: number): HeatMode {
  if (heat >= HEAT_COLOR) {
    return "hot";
  }
  if (heat >= HEAT_TREMBLE) {
    return "tremble";
  }
  return "cool";
}

export function CompanyLogo() {
  const [pressed, setPressed] = useState(false);
  const [popping, setPopping] = useState(false);
  const [heat, setHeat] = useState(0);
  const [color, setColor] = useState<LogoColor>("orange");
  const [burstId, setBurstId] = useState(0);
  const [bursting, setBursting] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const coolTimer = useRef<number | null>(null);
  const popTimer = useRef<number | null>(null);
  const burstTimer = useRef<number | null>(null);
  const activePointer = useRef<number | null>(null);
  const isPressed = useRef(false);
  const suppressClick = useRef(false);

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

  useEffect(() => {
    return () => {
      if (coolTimer.current !== null) {
        window.clearTimeout(coolTimer.current);
      }
      if (popTimer.current !== null) {
        window.clearTimeout(popTimer.current);
      }
      if (burstTimer.current !== null) {
        window.clearTimeout(burstTimer.current);
      }
    };
  }, []);

  const scheduleCool = useCallback(() => {
    if (coolTimer.current !== null) {
      window.clearTimeout(coolTimer.current);
    }
    coolTimer.current = window.setTimeout(() => {
      setHeat(0);
      setColor("orange");
      coolTimer.current = null;
    }, HEAT_COOL_MS);
  }, []);

  const triggerBurst = useCallback(() => {
    setBurstId((id) => id + 1);
    setBursting(true);
    if (burstTimer.current !== null) {
      window.clearTimeout(burstTimer.current);
    }
    burstTimer.current = window.setTimeout(() => {
      setBursting(false);
      burstTimer.current = null;
    }, reduceMotion ? 160 : SPARK_BURST_MS);
  }, [reduceMotion]);

  const registerPress = useCallback(() => {
    setHeat((prev) => {
      const next = prev + 1;
      if (next >= HEAT_COLOR) {
        setColor((c) => (c === "orange" ? "blue" : "orange"));
      }
      return next;
    });
    triggerBurst();
    scheduleCool();

    if (!reduceMotion) {
      setPopping(true);
      if (popTimer.current !== null) {
        window.clearTimeout(popTimer.current);
      }
      popTimer.current = window.setTimeout(() => {
        setPopping(false);
        popTimer.current = null;
      }, 160);
    }
  }, [reduceMotion, scheduleCool, triggerBurst]);

  const onPointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
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
    registerPress();
  };

  const mode = heatMode(heat);

  return (
    <button
      type="button"
      aria-label="Normal Things Company"
      className="logo-press relative h-[94.596px] w-[200px] shrink-0 touch-manipulation overflow-visible border-0 bg-transparent p-0"
      data-pressed={pressed ? "" : undefined}
      data-pop={popping ? "" : undefined}
      data-heat={mode}
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
        data-state={bursting ? "burst" : "idle"}
      >
        {logoSparks.map((spark, index) => (
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
            style={sparkStyle(index, spark.dx, spark.dy)}
          />
        ))}
      </svg>
    </button>
  );
}
