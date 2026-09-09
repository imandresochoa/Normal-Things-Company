import {
  COLOR_FAMILIES,
  COLOR_STEPS,
  CONTRAST_PAIRS,
  SEMANTIC_GROUPS,
  STEP_ROLES,
  contrastPairLabel,
  contrastRatio,
  contrastRequirement,
  familySteps,
  primitiveStep,
  semanticResolved,
  type ColorMode,
  type PrimitiveFamily,
} from "@/lib/root-tokens";

const FAMILY_COPY: Record<
  PrimitiveFamily,
  { title: string; body: string }
> = {
  neutral: {
    title: "Neutral",
    body: "The paper and ink of the system. The seed is #FBFAF9. In light mode that hex sits at 100. In dark mode it sits at 1000. The paper becomes the ink.",
  },
  "blue-electric": {
    title: "Blue Electric",
    body: "The interactive color. The seed is #2A56F7 at 700 in both modes. Use Blue only for actions that the user can touch.",
  },
  "orange-electric": {
    title: "Orange Electric",
    body: "The moment color. The seed is #F7452A at 700 in both modes. Use Orange for emphasis, not for states.",
  },
  "neutral-alpha": {
    title: "Neutral Alpha",
    body: "The same Neutral ink with a transparent channel. Use it for hover, pressed, hairlines, and overlays that must work on any surface.",
  },
};

const SEED_SWATCHES: {
  family: PrimitiveFamily;
  step: "100" | "700";
  label: string;
  caption: string;
}[] = [
  {
    family: "neutral",
    step: "100",
    label: "Neutral",
    caption: "100 light / 1000 dark",
  },
  {
    family: "blue-electric",
    step: "700",
    label: "Blue Electric",
    caption: "700, both modes",
  },
  {
    family: "orange-electric",
    step: "700",
    label: "Orange Electric",
    caption: "700, both modes",
  },
];

const SEMANTIC_COPY: Record<string, string> = {
  Backgrounds: "Paper, chrome, fills, and tinted surfaces. Dark mode inverts Neutral. Blue and Orange fills keep the 700 seed.",
  "Text and icons": "Primary, secondary, and tertiary ink. Group titles use Neutral 500. Disabled controls use Neutral 400. Inverse ink on filled controls, and the two chromatic marks.",
  Borders: "Hairlines, control borders, and focus rings.",
};

function Chip({
  hex,
  alpha,
  title,
}: {
  hex: string;
  alpha?: boolean;
  title?: string;
}) {
  if (alpha) {
    return (
      <span className="root-chip root-chip-alpha" title={title ?? hex}>
        <span style={{ background: hex }} />
      </span>
    );
  }

  return (
    <span
      className="root-chip"
      style={{ background: hex }}
      title={title ?? hex}
    />
  );
}

function Ramp({
  family,
  mode,
}: {
  family: PrimitiveFamily;
  mode: ColorMode;
}) {
  const steps = familySteps(family);
  const alpha = family === "neutral-alpha";

  return (
    <div className="root-ramp">
      <div className="root-ramp-head">
        <span>{mode === "light" ? "Light" : "Dark"}</span>
      </div>
      <div className="root-ramp-steps">
        {steps.map((step) => {
          const hex = step.value[mode];
          return (
            <div key={`${family}-${mode}-${step.step}`} className="root-ramp-step">
              <Chip hex={hex} alpha={alpha} title={hex} />
              <span className="root-ramp-step-num">
                {step.step}
                {step.seed ? " · seed" : ""}
              </span>
              <span className="root-ramp-hex">{hex}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ColorsPage() {
  return (
    <article className="root-doc">
      <header className="root-doc-header">
        <h1>Colors</h1>
        <p className="root-doc-lede">
          Color in Root is a small, locked set. Three seeds define the
          primitives. Semantic names sit on top of those primitives. Views
          must use the semantic names. They must not use a primitive step
          directly.
        </p>
        <p className="root-doc-lede">
          This site follows the system. It uses the matching aliases for the
          current system mode: paper canvas and primary ink in light, inverted
          paper and ink in dark. The ramps below still show both modes.
        </p>
      </header>

      <section className="root-doc-section">
        <h2>Seeds</h2>
        <p>
          Each family has one seed. The rest of the ramp comes from that seed
          in OKLCH. Do not pick a new hex for a product screen.
        </p>
        <div className="root-swatch-row">
          {SEED_SWATCHES.map((seed) => {
            const hex = primitiveStep(seed.family, seed.step).$value.light;
            return (
              <div key={seed.family} className="root-swatch">
                <Chip hex={hex} />
                <p className="root-swatch-label">{seed.label}</p>
                <p className="root-swatch-caption">
                  {hex} at {seed.caption}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="root-doc-section">
        <h2>Two layers</h2>
        <p>
          The primitive layer is the ramp. The semantic layer is the contract
          with the interface. If a view needs a color, it asks for a role
          such as <code>text-primary</code> or <code>bg-accent</code>. It does
          not ask for <code>neutral-900</code>.
        </p>
        <ol className="root-doc-list">
          <li>
            <strong>Primitives.</strong> Neutral, Blue Electric, Orange
            Electric, and Neutral Alpha. These keep the ramp consistent. They
            are not for layout code.
          </li>
          <li>
            <strong>Semantics.</strong> Backgrounds, text, icons, and borders.
            These names stay stable when a seed changes.
          </li>
        </ol>
        <p>
          There is no third layer of component tokens. If a screen needs a
          one-off role, add a semantic alias. Do not add a new layer.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Step roles</h2>
        <p>
          Every family uses the same ten steps. The role of a step does not
          change from family to family. The numbers are positions on the ramp,
          not lightness values. Step 1000 is always primary text, in both
          modes.
        </p>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Step</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {COLOR_STEPS.map((step) => (
                <tr key={step}>
                  <td>
                    <code>{step}</code>
                  </td>
                  <td>{STEP_ROLES[step]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          The jump from 400 to 500 is large on purpose. 400 is a decorative
          hairline. 500 is an accessible control border. If you need a divider
          that people can see, use 500.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Families</h2>
        {COLOR_FAMILIES.map((family) => {
          const copy = FAMILY_COPY[family.id];
          return (
            <div key={family.id} className="root-family">
              <h3>{copy.title}</h3>
              <p>{copy.body}</p>
              <Ramp family={family.id} mode="light" />
              <Ramp family={family.id} mode="dark" />
            </div>
          );
        })}
      </section>

      <section className="root-doc-section">
        <h2>Semantic aliases</h2>
        <p>
          These names are the public API of color in Root. Use them in views.
          Do not invent a new alias for a one-off screen.
        </p>
        {SEMANTIC_GROUPS.map((group) => (
          <div key={group.title} className="root-alias-group">
            <h3>{group.title}</h3>
            <p>{SEMANTIC_COPY[group.title]}</p>
            <div className="root-alias-list">
              {group.tokens.map((name) => {
                const light = semanticResolved(name, "light");
                const dark = semanticResolved(name, "dark");
                return (
                  <div key={name} className="root-alias">
                    <div className="root-alias-pair">
                      <Chip hex={light.hex} title={`Light ${light.hex}`} />
                      <Chip hex={dark.hex} title={`Dark ${dark.hex}`} />
                    </div>
                    <div className="root-alias-meta">
                      <code>{name}</code>
                      <span>
                        Light {light.primitive} · Dark {dark.primitive}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        <p>
          <code>bg-sunken</code> does not sink in dark mode. In light it is
          Neutral 300. In dark it points at the canvas. Surfaces in dark mode
          rise by getting lighter. There is nothing below the canvas.
        </p>
        <p>
          <code>text-on-accent</code> does not invert. <code>bg-accent</code>
          keeps the same Blue 700 in both modes, so the text on it stays
          paper hex <code>#FBFAF9</code>.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Text rank</h2>
        <p>
          Ink rank is primary, then secondary, then tertiary, then Neutral
          500, then Neutral 400. Group titles use Neutral 500. Body uses
          Neutral 900. Disabled controls use Neutral 400. Active ink stays{" "}
          <code>text-primary</code> or <code>text-secondary</code>.
        </p>
        <ul className="root-doc-list">
          <li>
            Group titles recede with Neutral 500. They stay above
            disabled rows.
          </li>
          <li>
            Disabled controls are inactive UI. Neutral 400 is quieter
            than the title. Do not use Neutral 400 for live chrome.
          </li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Usage rules</h2>
        <ul className="root-doc-list">
          <li>
            Blue marks what the user can touch and nothing else. A filled
            control, a link, a focus ring, and a selected state all resolve
            to Blue.
          </li>
          <li>
            Orange is for a moment. Use it on a launch mark, a rare highlight,
            or a product accent. Do not use Orange as success, warning, or
            error.
          </li>
          <li>
            Orange 700 is the seed. It is not a small-text color. Small text
            on Orange must use step 800, through{" "}
            <code>bg-expressive-strong</code>.
          </li>
          <li>
            Use Neutral Alpha for hover and pressed. A solid hover on a tinted
            card looks wrong.
          </li>
          <li>
            Do not mix a primitive step with a semantic alias in the same
            view. Pick the semantic name.
          </li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Contrast pairs</h2>
        <p>
          The pairs below are the intended combinations. A pair that fails its
          bar is marked. Orange 700 with small text fails. Use Orange 800
          instead.
        </p>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Pair</th>
                <th>Sample</th>
                <th>Ratio</th>
                <th>Bar</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {CONTRAST_PAIRS.map((pair) => {
                const ratio = contrastRatio(pair.fg, pair.bg);
                const requirement = contrastRequirement(pair);
                const pass =
                  requirement.min === null || ratio + 1e-6 >= requirement.min;
                return (
                  <tr key={pair.id}>
                    <td>{contrastPairLabel(pair.id)}</td>
                    <td>
                      <span
                        className="root-contrast-sample"
                        style={{ background: pair.bg, color: pair.fg }}
                      >
                        Ag
                      </span>
                    </td>
                    <td>{ratio.toFixed(2)}</td>
                    <td>{requirement.label}</td>
                    <td>{requirement.min === null ? "—" : pass ? "Pass" : "Fail"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="root-doc-section">
        <h2>Open questions</h2>
        <ul className="root-doc-list">
          <li>
            There is no error red yet. Do not use Orange for destructive
            actions until that decision is closed.
          </li>
          <li>
            There is no success green and no warning yellow. First apps should
            use copy and icons for that feedback.
          </li>
          <li>
            High Contrast is not defined. Hairline and tertiary text are the
            first steps that would need it.
          </li>
          <li>
            Three families are not a chart palette. Wait for the first data
            app before you add more hues.
          </li>
        </ul>
        <p className="root-doc-note">
          Source of truth: <code>foundations/tokens.json</code>. The scripts
          <code>build_palette.py</code> and <code>emit.py</code> rebuild that
          file. Do not edit a hex by hand if you plan to run the scripts.
        </p>
      </section>
    </article>
  );
}
