"use client";

import { useId, type CSSProperties } from "react";
import { PULSE_WASH_SCENE } from "@/lib/scenes/pulse-wash";
import { PulseField } from "./pulse-field";
import { PulsePaint } from "./pulse-paint";

const BAR_ROWS = [
  { label: "Mail", hours: 6.4, subject: false },
  { label: "Chat", hours: 8.1, subject: false },
  { label: "Calendar", hours: 14.2, subject: true },
  { label: "Docs", hours: 9.0, subject: false },
  { label: "Calls", hours: 5.2, subject: false },
];

const MAX_HOURS = 14.2;
const MAX_BAR = 160;
const SNAP = 16;

function snapSize(value: number) {
  return Math.max(SNAP, Math.round(value / SNAP) * SNAP);
}

export function PulsePlates() {
  const inkId = useId().replace(/:/g, "");

  return (
    <>
      <svg width="0" height="0" className="root-pulse-defs" aria-hidden="true">
        <defs>
          <filter
            id={`ink-${inkId}`}
            x="-6%"
            y="-6%"
            width="112%"
            height="112%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.62"
              numOctaves="3"
              seed="4"
              result="edge"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="edge"
              scale="2.2"
              xChannelSelector="R"
              yChannelSelector="G"
              result="rough"
            />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.9"
              numOctaves="2"
              seed="9"
              result="tooth"
            />
            <feColorMatrix
              in="tooth"
              type="matrix"
              result="toothA"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.62"
            />
            <feComposite in="rough" in2="toothA" operator="out" />
          </filter>
        </defs>
      </svg>

      <PulsePaint className="root-pulse-paint">
        <figure className="root-pulse-figure">
          <div
            className="root-paper root-pulse-plate"
            role="img"
            aria-label="Calendar leads at 14.2 hours"
          >
            <svg
              className="root-pulse-plot"
              viewBox="0 0 320 224"
              width="320"
              height="224"
            >
              <g filter={`url(#ink-${inkId})`}>
                {BAR_ROWS.map((row, index) => {
                  const height = snapSize((row.hours / MAX_HOURS) * MAX_BAR);
                  const x = 32 + index * 56;
                  const y = 192 - height;
                  return (
                    <rect
                      key={row.label}
                      x={x}
                      y={y}
                      width="32"
                      height={height}
                      fill={
                        row.subject
                          ? "var(--plot-subject)"
                          : "var(--plot-context)"
                      }
                    />
                  );
                })}
              </g>
              <line
                x1="16"
                y1="192"
                x2="304"
                y2="192"
                stroke="var(--plot-axis)"
                strokeWidth="1"
              />
            </svg>
            <ul className="root-pulse-bar-labels">
              {BAR_ROWS.map((row) => (
                <li
                  key={row.label}
                  style={
                    {
                      color: row.subject
                        ? "var(--plot-label)"
                        : "var(--plot-label-quiet)",
                    } as CSSProperties
                  }
                >
                  {row.label}
                </li>
              ))}
            </ul>
          </div>
          <figcaption className="root-swatch-caption">
            Emphasis bars. One series in Blue. The rest in Neutral.
          </figcaption>
          <table className="sr-only">
            <caption>Hours by surface</caption>
            <thead>
              <tr>
                <th>Surface</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {BAR_ROWS.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>{row.hours}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      </PulsePaint>

      <figure className="root-pulse-figure">
        <PulseField
          scene={PULSE_WASH_SCENE}
          label="Illustration wash in Pulse inks"
          className="root-pulse-field-demo"
        />
        <figcaption className="root-swatch-caption">
          Field wash. Same inks. Water under the pointer. Reload restores
          the dry plate.
        </figcaption>
      </figure>
    </>
  );
}
