"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";

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

function PulsePaint({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [painted, setPainted] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) {
      setPainted(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setPainted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      data-painted={painted ? "true" : "false"}
    >
      {children}
    </div>
  );
}

export function PulsePlates() {
  const inkId = useId().replace(/:/g, "");
  const washId = useId().replace(/:/g, "");

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
          <filter
            id={`wash-${washId}`}
            x="-12%"
            y="-12%"
            width="124%"
            height="124%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              numOctaves="2"
              seed="3"
              result="edge"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="edge"
              scale="26"
              xChannelSelector="R"
              yChannelSelector="G"
              result="rough"
            />
            <feGaussianBlur in="rough" stdDeviation="1.1" result="soft" />
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.6"
              numOctaves="2"
              seed="7"
              result="tooth"
            />
            <feColorMatrix
              in="tooth"
              type="matrix"
              result="toothA"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.28"
            />
            <feComposite in="soft" in2="toothA" operator="out" />
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

      <PulsePaint className="root-pulse-paint">
        <figure className="root-pulse-figure">
          <div className="root-paper root-pulse-plate root-pulse-wash-plate">
            <svg
              viewBox="0 0 320 176"
              width="320"
              height="176"
              aria-hidden="true"
            >
              <g
                filter={`url(#wash-${washId})`}
                style={{ mixBlendMode: "multiply" }}
              >
                <ellipse
                  cx="118"
                  cy="92"
                  rx="92"
                  ry="58"
                  fill="var(--illust-moss-wash)"
                  opacity="0.72"
                />
                <ellipse
                  cx="118"
                  cy="92"
                  rx="70"
                  ry="42"
                  fill="var(--illust-moss)"
                  opacity="0.28"
                />
                <ellipse
                  cx="204"
                  cy="78"
                  rx="86"
                  ry="52"
                  fill="var(--illust-ember-wash)"
                  opacity="0.7"
                  transform="translate(2 1)"
                />
                <ellipse
                  cx="168"
                  cy="108"
                  rx="64"
                  ry="40"
                  fill="var(--illust-indigo-wash)"
                  opacity="0.62"
                  transform="translate(-1 2)"
                />
              </g>
            </svg>
          </div>
          <figcaption className="root-swatch-caption">
            Illustration wash. Same inks. Multiply. Paper shows through.
          </figcaption>
        </figure>
      </PulsePaint>
    </>
  );
}
