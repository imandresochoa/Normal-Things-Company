import {
  CHART_FAMILIES,
  ILLUST_TOKEN_NAMES,
  PULSE_SEMANTIC_GROUPS,
  SERIES_TOKEN_NAMES,
  chartFamily700,
  chartFamilySteps,
  chartSemantic,
  pulseCssVars,
  type ChartFamily,
} from "@/lib/pulse-tokens";
import { PulsePlates } from "./pulse-plates";

const FAMILY_COPY: Record<ChartFamily, { title: string; body: string }> = {
  indigo: {
    title: "Indigo",
    body: "Series 1. Paper labels sit on the fill. Contrast on paper is 5.11:1. Luminance is 0.147.",
  },
  ember: {
    title: "Ember",
    body: "Series 2. No small text on Ember 700. If a label must sit on the fill, set it at 20px or larger, or move it outside. Contrast on paper is 3.89:1. Luminance is 0.209.",
  },
  teal: {
    title: "Teal",
    body: "Series 3. Labels on the fill use ink, not paper. Contrast on paper is 3.15:1. Luminance is 0.270.",
  },
  moss: {
    title: "Moss",
    body: "Series 4. Paper labels. Contrast on paper is 7.61:1. Luminance is 0.082.",
  },
};

const SERIES_ROWS: {
  family: ChartFamily;
  onPaper: string;
  label: string;
  luminance: string;
}[] = [
  { family: "indigo", onPaper: "5.11:1", label: "Paper", luminance: "0.147" },
  {
    family: "ember",
    onPaper: "3.89:1",
    label: "Large text only",
    luminance: "0.209",
  },
  { family: "teal", onPaper: "3.15:1", label: "Ink", luminance: "0.270" },
  { family: "moss", onPaper: "7.61:1", label: "Paper", luminance: "0.082" },
];

const PLOT_SUBSTRATE = [
  { name: "plot-paper", role: "Every plate" },
  { name: "plot-grid-minor", role: "Every 16px, decorative" },
  { name: "plot-grid-major", role: "Every 5 cells, 80px" },
  { name: "plot-axis", role: "The one line a reader measures against" },
] as const;

const DIVERGING = [
  "#9F1600",
  "#C91E00",
  "#F7452A",
  "#FF735B",
  "#FFC8BC",
  "#EAE7E5",
  "#C1D4FF",
  "#6490FF",
  "#2A56F7",
  "#1B3DE3",
  "#1531C5",
];

const FILTER_ROWS = [
  { id: "#ink", use: "Chart marks. The default.", displacement: "2.2", tooth: "0.9 / −0.62" },
  {
    id: "#ink-heavy",
    use: "Areas above about 80px square, which look plastic otherwise.",
    displacement: "3.4",
    tooth: "0.72 / −0.55",
  },
  {
    id: "#wash",
    use: "Illustration only. Never a chart.",
    displacement: "26 + blur 1.1",
    tooth: "0.6 / −0.28",
  },
];

const MOTION_ROWS = [
  {
    moment: "Paint in",
    duration: "220ms",
    easing: "var(--ease-out)",
    notes: "Opacity 0 to 1, scale 0.97 to 1. Nothing travels.",
  },
  {
    moment: "Stagger",
    duration: "18ms per mark",
    easing: "—",
    notes: "Cap total at 600ms. Past about 34 marks, stagger by group.",
  },
  {
    moment: "Data change",
    duration: "260ms",
    easing: "cubic-bezier(.4,0,.2,1)",
    notes: "The mark moves to its new value.",
  },
  {
    moment: "Control",
    duration: "260ms",
    easing: "cubic-bezier(.4,0,.2,1)",
    notes: "Matches the Root control transition.",
  },
];

function Chip({ hex, title }: { hex: string; title?: string }) {
  return (
    <span
      className="root-chip"
      style={{ background: hex }}
      title={title ?? hex}
    />
  );
}

function ChartRamp({ family }: { family: ChartFamily }) {
  const steps = chartFamilySteps(family);

  return (
    <div className="root-ramp">
      <div className="root-ramp-head">
        <span>Paper plate</span>
      </div>
      <div className="root-ramp-steps">
        {steps.map((step) => {
          const hex = step.value.light;
          return (
            <div key={`${family}-${step.step}`} className="root-ramp-step">
              <Chip hex={hex} title={hex} />
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

export function PulsePage() {
  const cssVars = pulseCssVars();

  return (
    <article className="root-doc root-pulse" style={cssVars}>
      <header className="root-doc-header">
        <h1>Pulse</h1>
        <p className="root-doc-lede">
          Every chart, illustration, and icon in Root is printed. There is
          paper, there is ink, and the ink is laid down one plate at a time.
          That is why charts, graphs, and pictures belong to one universe.
        </p>
        <p className="root-doc-lede">
          Pulse inks are not UI color. Do not put them on a button, an
          input, or the nav. Colors stays the chrome. Pulse stays the plate.
        </p>
      </header>

      <section className="root-doc-section">
        <h2>Why printing</h2>
        <p>
          Blue Electric and Orange Electric are not screen colors that happen
          to be bright. At <code>#2A56F7</code> and <code>#F7452A</code> on{" "}
          <code>#FBFAF9</code> paper they are risograph inks. A press pulls
          one color per pass. Everything about the result follows from that.
        </p>
        <ul className="root-doc-list">
          <li>The ink is flat. There are no gradients in a real print.</li>
          <li>The paper shows through. Coverage is never total.</li>
          <li>
            The second plate never lands exactly on the first. That offset is
            the signature.
          </li>
          <li>
            Where two inks overlap you get a third color without buying a
            third ink.
          </li>
        </ul>
        <p>
          Do not reach for a soft, dusty, watercolor look. It fights the
          seeds, and warm cream with a muted terracotta accent is the house
          style of every generated page on the internet right now. The seeds
          are loud. Let them be loud and let the process do the softening.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Two layers</h2>
        <p>
          Same contract as color and type. Primitives are the ramp. Semantics
          are what a view asks for.
        </p>
        <ol className="root-doc-list">
          <li>
            <strong>Primitives.</strong> The Chart family: four hues, ten
            steps, built in OKLCH by <code>build_chart_palette.py</code>. Not
            for layout code.
          </li>
          <li>
            <strong>Semantics.</strong> Plot, series, and illustration
            aliases. These are what a chart or a picture uses.
          </li>
        </ol>
        <p>
          There is no third layer. A plot asks for <code>plot-subject</code>.
          A picture asks for <code>illust-moss</code>. A control still asks
          for <code>bg-accent</code>.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Pulse palettes</h2>
        <p>
          Four hues, because four is what the paper pays for. Every fill has
          to clear 3:1 against Neutral 100. That caps relative luminance at
          0.286. Split it four ways and neighbouring series sit 0.061 apart,
          which survives greyscale. Split it six ways and they do not. Four
          is arithmetic, not taste.
        </p>
        <p>
          Chroma is about half the electric seeds. A data series must never
          be mistaken for a control. Ochre is out: below L 0.66 a yellow on
          warm paper is muddy.
        </p>
        <div className="root-swatch-row">
          {CHART_FAMILIES.map((family) => {
            const hex = chartFamily700(family.id);
            return (
              <div key={family.id} className="root-swatch">
                <Chip hex={hex} />
                <p className="root-swatch-label">{FAMILY_COPY[family.id].title}</p>
                <p className="root-swatch-caption">
                  {hex} at 700
                </p>
              </div>
            );
          })}
        </div>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Series</th>
                <th>Step 700</th>
                <th>On paper</th>
                <th>Label on the fill</th>
                <th>Luminance</th>
              </tr>
            </thead>
            <tbody>
              {SERIES_ROWS.map((row) => (
                <tr key={row.family}>
                  <td>{FAMILY_COPY[row.family].title}</td>
                  <td>
                    <code>{chartFamily700(row.family)}</code>
                  </td>
                  <td>{row.onPaper}</td>
                  <td>{row.label}</td>
                  <td>{row.luminance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Series order is Indigo, Ember, Teal, Moss. Two-series charts get
          the most separated pair first. Ember 900 can hold small paper text
          if the fill must carry a caption.
        </p>
        {CHART_FAMILIES.map((family) => {
          const copy = FAMILY_COPY[family.id];
          return (
            <div key={family.id} className="root-family">
              <h3>{copy.title}</h3>
              <p>{copy.body}</p>
              <ChartRamp family={family.id} />
            </div>
          );
        })}
        <p>
          These names are the public API of Pulse color. Views that draw a
          plate use them. Views that draw chrome do not.
        </p>
        {PULSE_SEMANTIC_GROUPS.map((group) => (
          <div key={group.title} className="root-alias-group">
            <h3>{group.title}</h3>
            <p>
              {group.title === "Plot"
                ? "What a chart asks for. Subject is still Blue. Moment is still Orange. Context is Neutral."
                : group.title === "Series"
                  ? "Unordered categories only. Never a state. Never a control."
                  : "What a picture asks for. Same inks as the series. Wash steps are Chart 400."}
            </p>
            <div className="root-alias-list">
              {group.tokens.map((name) => {
                const token = chartSemantic(name);
                return (
                  <div key={name} className="root-alias">
                    <div className="root-alias-pair">
                      <Chip hex={token.hex} title={token.hex} />
                    </div>
                    <div className="root-alias-meta">
                      <code>{name}</code>
                      <span>{token.hex}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </section>

      <section className="root-doc-section">
        <h2>Substrate</h2>
        <p>
          Paper is Neutral 100. Never white. The grid is CSS, not SVG. It is
          not data. It must not scale with the plot.
        </p>
        <div className="root-paper root-pulse-substrate" aria-hidden="true" />
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>Value</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {PLOT_SUBSTRATE.map((row) => {
                const token = chartSemantic(row.name);
                return (
                  <tr key={row.name}>
                    <td>
                      <code>{row.name}</code>
                    </td>
                    <td>{token.reference.replace("{color.primitive.", "").replace("}", "")}</td>
                    <td>{row.role}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p>
          The axis is Neutral 500, not 400. 400 is the decorative hairline
          and disappears at a glance. An axis is read, so it uses the
          accessible control border step. Marks snap to the 16px minor line.
          Snap the position and the size. Let the filter, not the
          coordinates, supply the wobble.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Ink</h2>
        <p>
          One filter on a group. Never one filter per mark.{" "}
          <code>feTurbulence</code> generates a noise field in user space, so
          a square at x=40 already samples different noise from a square at
          x=300.
        </p>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Filter</th>
                <th>Use</th>
                <th>Displacement</th>
                <th>Tooth</th>
              </tr>
            </thead>
            <tbody>
              {FILTER_ROWS.map((row) => (
                <tr key={row.id}>
                  <td>
                    <code>{row.id}</code>
                  </td>
                  <td>{row.use}</td>
                  <td>{row.displacement}</td>
                  <td>{row.tooth}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="root-doc-list">
          <li>
            Set <code>color-interpolation-filters=&quot;sRGB&quot;</code> on
            every filter. The default is linearRGB and it will wash the ink
            out.
          </li>
          <li>
            Seed every random value. An unseeded mark re-rolls its grain on
            resize and the chart shimmers.
          </li>
          <li>
            Do not exceed about 400 filtered marks in one view. Past that,
            pre-render the plate to a sprite and place copies.
          </li>
          <li>
            Do not animate a filter attribute. Animating{" "}
            <code>baseFrequency</code> or <code>seed</code> re-runs the whole
            filter every frame.
          </li>
          <li>
            Misregistration is 1 to 3px. Below 1px nobody sees it. Above 3px
            it stops reading as a press and starts reading as a bug.
          </li>
          <li>
            Overprint is <code>mix-blend-mode: multiply</code>. That is how
            the palette grows without new tokens.
          </li>
          <li>No drop shadows. Ink does not float.</li>
          <li>
            Do not rotate a mark to look casual. The press is straight. The
            grain does the work.
          </li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Colour in a plot</h2>
        <p>
          Most charts have one series that matters. Draw that series in Blue
          and everything else in Neutral. This is the first thing to reach
          for. It is almost always clearer than coloring every series
          differently. It is also why the Chart family needs so few hues.
        </p>
        <p>
          The rules from Colors still hold inside a plot. Blue still marks
          what the person can touch, which means the series in focus. Orange
          is still a moment, which means the single value being called out.
          Neither is a category. Categories use{" "}
          {SERIES_TOKEN_NAMES.map((name, index) => (
            <span key={name}>
              {index > 0 ? ", " : ""}
              <code>{name}</code>
            </span>
          ))}
          .
        </p>
        <ul className="root-doc-list">
          <li>
            <strong>Sequential.</strong> One family&apos;s ramp. Blue 200
            through Blue 1000 for intensity, or a Chart hue&apos;s own ramp.
            Never two hues for ordered data.
          </li>
          <li>
            <strong>Diverging.</strong> The two seeds sit far enough apart
            to read as two directions from a centre. Use it only when the
            data has a real zero.
          </li>
          <li>
            <strong>Overprint.</strong> Two inks multiplied give a third
            color. Use it for an intersection that genuinely is both things.
            Do not use it for a category that is neither.
          </li>
        </ul>
        <div className="root-swatch-row root-pulse-diverging">
          {DIVERGING.map((hex) => (
            <div key={hex} className="root-swatch">
              <Chip hex={hex} />
              <p className="root-swatch-caption">
                <code>{hex}</code>
              </p>
            </div>
          ))}
        </div>
        <p>
          A diverging ramp on data without a midpoint invents a midpoint.
        </p>
        <div className="root-pulse-overprint" aria-hidden="true">
          <span style={{ background: "var(--illust-moss)" }} />
          <span style={{ background: "var(--illust-ember)" }} />
          <span className="root-pulse-overprint-mix" />
        </div>
        <p className="root-swatch-caption">
          Moss over Ember. A warmer green without a new token.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Charts</h2>
        <PulsePlates />
        <ul className="root-doc-list">
          <li>
            <strong>Emphasis bars.</strong> The default. Everything Neutral,
            one bar Blue, the subject&apos;s label Neutral 1000 and the rest
            Neutral 900. Selecting a different bar moves the emphasis.
          </li>
          <li>
            <strong>Uncertainty fan.</strong> Solid where observed, dashed
            where modelled. Draw the break. Bands are one hue at three
            steps, never three hues.
          </li>
          <li>
            <strong>Waffle.</strong> For counts a person can actually count.
            Past about 200 units it is a bar with extra steps, so use a bar.
          </li>
          <li>
            <strong>Distribution.</strong> One row per question, one mark
            per response, jitter seeded so the cloud is identical between
            renders. A distribution shows the shape of disagreement, which a
            mean hides.
          </li>
          <li>
            <strong>Flow.</strong> Ribbons carry quantity as thickness. One
            split. A flow diagram with four stages is a diagram of the code,
            not of the thing.
          </li>
          <li>
            <strong>Field.</strong> Not a chart. A texture that carries a
            rate. For a hero or a section opener. Never label it.
          </li>
        </ul>
        <ul className="root-doc-list">
          <li>
            Label the mark directly. A legend makes the eye travel, and Root
            charts are small enough not to need one.
          </li>
          <li>
            Start a bar axis at zero. A fan or a line may be clipped, and
            should say so.
          </li>
          <li>No pie charts. A pie is a waffle that cannot be compared.</li>
          <li>No second y-axis. Two axes is two charts.</li>
          <li>No gradient fills, no 3D, no shadow on a mark.</li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Illustration</h2>
        <p>
          Same inks, same paper, <code>#wash</code> instead of{" "}
          <code>#ink</code>, and this is the only place a wash is allowed. A
          chart mark has a value and needs a readable edge. An illustration
          does not, so the ink can bleed, pool, and overlap.
        </p>
        <p>
          Build a wash the way you would build a real one. Broad shapes
          first, largest to smallest, each translucent and multiplying,
          letting the overlaps make the darker values. Do not paint a dark
          color directly. Three or four layers of the same ink is what
          makes it look wet. Use{" "}
          {ILLUST_TOKEN_NAMES.filter((name) => !name.endsWith("-wash")).map(
            (name, index) => (
              <span key={name}>
                {index > 0 ? ", " : ""}
                <code>{name}</code>
              </span>
            ),
          )}
          . First plates use the wash aliases.
        </p>
        <ul className="root-doc-list">
          <li>
            Let the paper show. Unpainted Neutral 100 is a color and usually
            the best one.
          </li>
          <li>
            Keep the horizon and any hard structure on the grid even when
            the wash is loose.
          </li>
          <li>Do not use the wash filter on anything that encodes a value.</li>
          <li>
            Do not add a color that is not in the palette. If the picture
            needs a warmer green, overprint Moss with Ember.
          </li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Iconography</h2>
        <p>
          Icons are the exception. They are chrome, not content. They sit
          beside labels, at 24px, often at the same optical weight as a
          line of text. Texture at that size reads as a rendering artefact.
          Icons use UI ink, not Chart fills.
        </p>
        <ul className="root-doc-list">
          <li>24 unit grid, 2 unit margin, 2 unit stroke, butt caps, miter joins.</li>
          <li>Never inked, never filled, never textured.</li>
          <li>
            Color with <code>currentColor</code> so an icon inherits its
            label&apos;s rank.
          </li>
          <li>Curves use a 4 or 8 unit radius, never an arbitrary one.</li>
          <li>
            One stroke weight across the whole set. The 2px stroke is
            deliberate: at Root&apos;s 17px body size a 1.5px icon looks
            thin next to Inter 400.
          </li>
          <li>
            Never an icon alone for a destructive or ambiguous action.
            Icons repeat the label, they do not replace it.
          </li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Motion</h2>
        <p>
          A plate is painted once, when it first arrives. After that, motion
          only ever answers something the person did. No ambient drift, no
          shimmering grain, no looping anything.
        </p>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Moment</th>
                <th>Duration</th>
                <th>Easing</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {MOTION_ROWS.map((row) => (
                <tr key={row.moment}>
                  <td>{row.moment}</td>
                  <td>{row.duration}</td>
                  <td>
                    <code>{row.easing}</code>
                  </td>
                  <td>{row.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="root-doc-list">
          <li>
            Trigger the paint with <code>IntersectionObserver</code> at
            threshold 0.25, once, then unobserve.
          </li>
          <li>
            On a data change, mutate attributes on the marks that are
            already there. Re-rendering the group re-triggers the paint and
            reads as the chart reloading.
          </li>
          <li>
            Under <code>prefers-reduced-motion</code>, everything arrives in
            its final state. Not faster. Arrived.
          </li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Accessibility</h2>
        <ul className="root-doc-list">
          <li>
            Every chart carries <code>role=&quot;img&quot;</code> and an{" "}
            <code>aria-label</code> that states the finding, not the chart
            type. &quot;Calendar leads at 14.2 hours&quot; beats &quot;bar
            chart of hours&quot;.
          </li>
          <li>
            Ship the numbers. A visually hidden table after the figure, or a
            real one below it.
          </li>
          <li>
            Color is never the only channel. The four series differ in
            lightness by at least 0.061, but position and a direct label do
            the real work.
          </li>
          <li>
            Texture is decorative. It must survive being turned off, and the
            chart must still read.
          </li>
          <li>No small text on Ember 700. It fails at 3.89:1 both ways.</li>
          <li>No value that exists only in a hover tooltip.</li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Open questions</h2>
        <ul className="root-doc-list">
          <li>
            There is still no error red. Ember 700 is close enough to Orange
            that using it for a failing series will read as a state. Leave
            failure to copy until Colors closes that question.
          </li>
          <li>
            Four series is the cap and there is no fifth. If a chart needs a
            fifth, the chart is wrong before the palette is. Small multiples
            are the answer, not a new hue.
          </li>
          <li>
            The wash filter is expensive and has only been reasoned about,
            not measured. Profile it on a mid-range phone before shipping an
            illustration above the fold.
          </li>
          <li>
            Dark mode is undefined here. Inverting paper is easy. Inverting
            ink is not, because multiply is wrong on a dark ground. Do not
            ship a dark chart until that is decided. Plates on this page
            stay on Neutral 100 paper.
          </li>
          <li>
            No map projection, no treemap, no network graph. Add one only
            with a real screen behind it.
          </li>
        </ul>
        <p className="root-doc-note">
          Source of truth for UI color: <code>foundations/tokens.json</code>.
          Source of truth for Pulse color:{" "}
          <code>foundations/chart_tokens.json</code>. The script{" "}
          <code>build_chart_palette.py</code> rebuilds the Chart family. Do
          not edit a Chart hex by hand.
        </p>
      </section>
    </article>
  );
}
