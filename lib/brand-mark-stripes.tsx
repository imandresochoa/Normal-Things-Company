/** Seed and Neutral bands from the Root mark. Matches `app/icon.svg`. */
export const SEED_MARK_COLORS = {
  canvas: "#FBFAF9",
  accent: "#2A56F7",
  expressive: "#F7452A",
  ink: "#0D0D0D",
} as const;

export function BrandMarkStripes() {
  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
      }}
    >
      <div
        style={{ width: "50%", height: "100%", background: SEED_MARK_COLORS.canvas }}
      />
      <div
        style={{
          width: "16.6667%",
          height: "100%",
          background: SEED_MARK_COLORS.accent,
        }}
      />
      <div
        style={{
          width: "16.6667%",
          height: "100%",
          background: SEED_MARK_COLORS.expressive,
        }}
      />
      <div
        style={{
          width: "16.6667%",
          height: "100%",
          background: SEED_MARK_COLORS.ink,
        }}
      />
    </div>
  );
}
