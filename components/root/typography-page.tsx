import {
  TYPE_FAMILIES,
  TYPE_STYLES,
  TYPE_WEIGHTS,
  WEB_TYPE_FAMILIES,
  WEB_TYPE_STYLES,
  WEB_TYPE_WEIGHTS,
} from "@/lib/root-tokens";

const SAMPLE = "The kettle is already warm.";
const MONO_SAMPLE = "07:42  18°";

function iosCssWeight(weight: number) {
  if (weight === 510) {
    return 500;
  }
  if (weight === 590) {
    return 600;
  }
  return weight;
}

export function TypographyPage() {
  return (
    <article className="root-doc">
      <header className="root-doc-header">
        <h1>Typography</h1>
        <p className="root-doc-lede">
          Root does not invent one scale for every platform. iOS aliases
          the system text styles so Dynamic Type still works. Web uses
          three Inter sizes. Personality comes from family, a narrow
          weight band, and color.
        </p>
      </header>

      <section className="root-doc-section">
        <h2>Why alias, not invent</h2>
        <p>
          On iOS the type scale is not only visual. The system styles
          (<code>.body</code>, <code>.largeTitle</code>, and the rest) are
          what connect to Dynamic Type. Dynamic Type is what lets a person
          with low vision use the app.
        </p>
        <p>
          A custom scale next to the system scale means every size must be
          rescaled by hand. Someone will forget. Some text will not grow.
          That is not a foundation. So the scale is the system scale, and
          the four decisions below carry the character.
        </p>
        <p>
          Web has no Dynamic Type contract. It does not copy the iOS
          ladder. Web uses three sizes. Rank on the web comes from color,
          then weight.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Two layers</h2>
        <p>
          Atomic tokens exist so a value is not written twice. Composite
          styles are what you use for almost all text. If size and line
          height are set apart, they drift. A composite style cannot drift.
        </p>
        <ol className="root-doc-list">
          <li>
            <strong>Atomic tokens.</strong> Family, size in points, line
            height in points, and weight. Use these for a rare case, such as
            an icon that must match a size.
          </li>
          <li>
            <strong>Composite styles.</strong> <code>body</code>,{" "}
            <code>headline</code>, <code>display</code>, and the rest. Use
            these for text. If you write a raw <code>font-size</code> in a
            view, you are in an exception that needs a note, or you made a
            mistake.
          </li>
        </ol>
      </section>

      <section className="root-doc-section">
        <p className="root-doc-kicker">iOS</p>
        <h2>Families</h2>
        <p>
          All three are system fonts. There is no download, no license file,
          and full support for Dynamic Type and optical sizes. They also
          align with SF Symbols.
        </p>
        <div className="root-type-families">
          {TYPE_FAMILIES.map((family) => (
            <div key={family.id} className="root-type-family">
              <p
                className={`root-type-family-sample root-type-${family.id}`}
              >
                {family.name}
              </p>
              <p className="root-swatch-label">
                <code>{family.token}</code>
              </p>
              <p className="root-swatch-caption">{family.role}</p>
              <p className="root-swatch-caption">
                <code>{family.swift}</code>
              </p>
            </div>
          ))}
        </div>
        <p>
          Screen titles use New York, not SF Pro. That is the cheapest way
          to give the system a face. Body text stays on SF Pro. People
          expect SF Pro in an iOS list. A long serif paragraph fights that
          habit for no gain.
        </p>
        <p>
          SF Pro Rounded is out of the system. It reads as soft in a way
          that does not match the house. If a future app needs it, document
          the exception. Do not add a fourth default family.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Weight band</h2>
        <p>
          The system uses three weights: 400, 510, and 590. Bold (700) is
          only for serif display and title-1. Rank comes from contrast,
          then space. Size is for a heading, not for every rank. Weight
          is the last tool.
        </p>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>wght</th>
                <th>Use</th>
              </tr>
            </thead>
            <tbody>
              {TYPE_WEIGHTS.map((row) => (
                <tr key={row.token}>
                  <td>
                    <code>{row.token}</code>
                  </td>
                  <td>{row.value}</td>
                  <td>{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Do not call <code>.bold()</code> on body text. For emphasis in a
          paragraph, use <code>weight-medium</code>. If that is not enough,
          use <code>text-primary</code> against <code>text-secondary</code>.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Tracking</h2>
        <p>
          SF adjusts tracking at each size. Do not override it. Do not add
          tracking tokens to the semantic layer.
        </p>
        <p>
          Two exceptions, both documented: <code>family-mono</code> below
          13pt, where a little extra space helps figures; and Figma mockups,
          where the system does not apply tracking and you must add the
          table by hand.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Composite styles</h2>
        <p>
          The names are the iOS names, not translated. The map to{" "}
          <code>.font(.body)</code> is one to one. A family suffix appears
          only when the family is not the default.
        </p>
        <p>
          These specimens use system stand-ins on the web:{" "}
          <code>ui-sans-serif</code>, <code>ui-serif</code>, and{" "}
          <code>ui-monospace</code>. On device, use SF Pro, New York, and
          SF Mono. Sizes are the Large Dynamic Type values, in points.
        </p>
        <div className="root-type-specimens">
          {TYPE_STYLES.map((style) => (
            <div key={style.token} className="root-type-specimen">
              <p
                className={`root-type-${style.family}`}
                style={{
                  fontSize: `${style.size}px`,
                  lineHeight: `${style.lineHeight}px`,
                  fontWeight: iosCssWeight(style.weight),
                }}
              >
                {style.family === "mono" ? MONO_SAMPLE : SAMPLE}
              </p>
              <p className="root-type-meta">
                <code>{style.token}</code>
                <span>
                  {style.apple} · {style.size}/{style.lineHeight} · {style.weight}
                </span>
              </p>
              <p className="root-swatch-caption">{style.use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="root-doc-section">
        <h2>Composition rules</h2>
        <ul className="root-doc-list">
          <li>
            Minimum size is 11pt. That is <code>caption-2</code>. If you
            need smaller type, the problem is density, not type.
          </li>
          <li>
            Prefer two styles on one screen: one heading +{" "}
            <code>body</code>. Use <code>text-primary</code> against{" "}
            <code>text-secondary</code>, then weight, before you pick a
            new size. Three styles is the ceiling, counting the title. A
            page may have a heading. On iOS that heading can be{" "}
            <code>title-2</code>. On the web the heading uses the same
            17px size as body.
          </li>
          <li>
            Quiet chrome uses Neutral 600. Disabled controls use Neutral
            400. Do not pick a new size to make them recede. Active text
            stays stronger.
          </li>
          <li>
            Do not mix families on the same line. Serif and sans can share
            a screen. They must not share a line. The only exception is
            mono figures inside a paragraph, and only when the figures are
            data.
          </li>
          <li>
            Left align. Do not justify.
          </li>
          <li>
            Reading length on iPhone is 35–50 characters. On a wide window,
            cap the column. Do not invent new sizes for iPad.
          </li>
          <li>
            <code>caption-2</code> at 11pt is not safe with{" "}
            <code>text-tertiary</code>. Use <code>text-secondary</code> or{" "}
            <code>text-primary</code>.
          </li>
          <li>
            Tabular figures for any number that you compare in a column.
            That is <code>.monospacedDigit()</code> on SF Pro, not{" "}
            <code>family-mono</code>. Use mono for identifiers and code.
          </li>
        </ul>
      </section>

      <section className="root-doc-section">
        <h2>Dynamic Type</h2>
        <p>
          Use the system styles. Do not hard-code a size.{" "}
          <code>.font(.body)</code> grows. <code>.font(.system(size: 17))</code>
          does not.
        </p>
        <p>
          Space and icon sizes that sit next to text must grow too. Use{" "}
          <code>@ScaledMetric</code> relative to the text style they serve.
        </p>
        <p>
          A layout seen only at Large is not tested. Failures show at AX5,
          where body goes from 17pt to 53pt and a fixed row height breaks.
        </p>
      </section>

      <section className="root-doc-section">
        <p className="root-doc-kicker">Web</p>
        <h2>Inter</h2>
        <p>
          Web is not a copy of the iOS ladder. Inter is the only sans
          family. There is no New York on the web. Three sizes cover
          reading, compact chrome, and captions. Mono uses the system{" "}
          <code>ui-monospace</code> stack as a stand-in.
        </p>
        <div className="root-type-families">
          {WEB_TYPE_FAMILIES.map((family) => (
            <div key={family.id} className="root-type-family">
              <p
                className={`root-type-family-sample ${
                  family.id === "mono" ? "root-type-mono" : "root-type-web"
                }`}
              >
                {family.name}
              </p>
              <p className="root-swatch-label">
                <code>{family.token}</code>
              </p>
              <p className="root-swatch-caption">{family.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="root-doc-section">
        <h2>Web weight band</h2>
        <p>
          Inter uses 400 for body, UI, and captions. Headings use 500.
          That is one hundred points above body. Do not use 700 on the
          web. Rank comes from Neutral 1000 against Neutral 700, then
          this weight step. Size is not how rank is made.
        </p>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Token</th>
                <th>wght</th>
                <th>Use</th>
              </tr>
            </thead>
            <tbody>
              {WEB_TYPE_WEIGHTS.map((row) => (
                <tr key={row.token}>
                  <td>
                    <code>{row.token}</code>
                  </td>
                  <td>{row.value}</td>
                  <td>{row.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="root-doc-section">
        <h2>Web tracking</h2>
        <p>
          Do not override tracking on Inter. Leave the default. Do not
          add tracking tokens to the semantic layer.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Web composite styles</h2>
        <p>
          Three sizes. Body and heading share 17/22. Heading is Neutral
          1000 at weight 500. Body is Neutral 700. UI and caption are
          Neutral 900 at weight 400. The home letter uses <code>body</code> (
          <code>.ntc-web-body</code>).
        </p>
        <div className="root-type-specimens">
          {WEB_TYPE_STYLES.map((style) => (
            <div key={`web-${style.token}`} className="root-type-specimen">
              <p
                className="root-type-web"
                style={{
                  fontSize: `${style.size}px`,
                  lineHeight: `${style.lineHeight}px`,
                  fontWeight: style.weight,
                  color:
                    style.token === "heading"
                      ? "var(--text-primary)"
                      : style.token === "body"
                        ? "var(--root-body)"
                        : "var(--text-secondary)",
                }}
              >
                {SAMPLE}
              </p>
              <p className="root-type-meta">
                <code>{style.token}</code>
                <span>
                  Web · {style.size}/{style.lineHeight} · {style.weight} ·{" "}
                  {style.color}
                </span>
              </p>
              <p className="root-swatch-caption">{style.use}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="root-doc-section">
        <h2>Open questions</h2>
        <ul className="root-doc-list">
          <li>
            Web is locked to three sizes. Do not add a fourth size to
            solve rank. If a screen is unclear, change color or space
            first.
          </li>
          <li>
            New York on every iOS screen title is a strong bet. Prototype
            the first two apps with serif and with sans before you lock
            it.
          </li>
          <li>
            There is no brand display face on iOS. System fonts have a
            ceiling: two house apps will look related, and they will also
            look like any careful iOS app. If differentiation matters
            more than cost, spend it on a display face for titles only.
            Keep SF Pro for UI.
          </li>
          <li>
            Wide windows are not a reason for new sizes. When they
            arrive, decide a maximum column width.
          </li>
        </ul>
        <p className="root-doc-note">
          Source of truth for the Swift aliases:{" "}
          <code>foundations/Foundations.swift</code>.
        </p>
      </section>
    </article>
  );
}
