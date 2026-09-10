import { SPACE_ROLES } from "@/lib/root-tokens";
import { RootDocHeader } from "./root-doc-header";

export function SpacingPage() {
  return (
    <article className="root-doc">
      <RootDocHeader title="Spacing">
        <p className="root-doc-lede">
          Closer means more related. Space groups. Air lets the eye scan.
          Do not invent a gap. Pick a role.
        </p>
      </RootDocHeader>

      <section className="root-doc-section">
        <h2>Two layers</h2>
        <p>
          Primitives are the raw steps on the ladder. Semantic roles are what
          you use in views. Raw pixels are an exception or a mistake.
        </p>
        <ol className="root-doc-list">
          <li>
            <strong>Primitives.</strong> Seven steps: 4, 8, 16, 24, 48, 80,
            120. They exist so a value is not written twice.
          </li>
          <li>
            <strong>Roles.</strong> <code>tight</code>, <code>related</code>,{" "}
            <code>grouped</code>, and the rest. Use these in layout. If you
            write a raw <code>margin</code> or <code>padding</code> in a view,
            you are in an exception that needs a note, or you made a mistake.
          </li>
        </ol>
      </section>

      <section className="root-doc-section">
        <h2>The ladder</h2>
        <p>
          Each role maps to one primitive. The names describe relationship, not
          decoration.
        </p>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>px</th>
                <th>Use</th>
              </tr>
            </thead>
            <tbody>
              {SPACE_ROLES.map((role) => (
                <tr key={role.token}>
                  <td>
                    <code>{role.token}</code>
                  </td>
                  <td>{role.px}</td>
                  <td>{role.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Bar specimen</h3>
        <div className="root-table-wrap">
          <table className="root-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>px</th>
                <th>Bar</th>
              </tr>
            </thead>
            <tbody>
              {SPACE_ROLES.map((role) => (
                <tr key={role.token}>
                  <td>
                    <code>{role.token}</code>
                  </td>
                  <td>{role.px}px</td>
                  <td>
                    <div
                      style={{
                        width: `var(--space-${role.token})`,
                        height: "var(--space-related)",
                        background: "var(--root-line)",
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="root-doc-section">
        <h2>Composition rules</h2>
        <p>
          Spacing is about what belongs together. These rules keep rhythm
          consistent across pages.
        </p>
        <ol className="root-doc-list">
          <li>
            <strong>Heading owns its paragraph.</strong> Use{" "}
            <code>related</code> between a title and the lede that follows.
          </li>
          <li>
            <strong>Paragraphs in a section.</strong> Use{" "}
            <code>grouped</code> between body paragraphs.
          </li>
          <li>
            <strong>Next section.</strong> Use <code>section</code> before a
            new h2 block.
          </li>
          <li>
            <strong>Figure owns caption.</strong> Use <code>tight</code> between
            a chip and its caption.
          </li>
          <li>
            <strong>Heavy figure, then next section.</strong> A pulse plate or
            large swatch row already carries weight. The section margin
            provides the air before the next heading.
          </li>
        </ol>
      </section>

      <section className="root-doc-section">
        <h2>What this site uses</h2>
        <p>
          Root docs, the letter, and the nav use these seven roles. There is no
          second set of gaps for chrome versus content.
        </p>
        <p>
          On the web, roles map to <code>--space-*</code> CSS variables in{" "}
          <code>globals.css</code>. The catalog lives in{" "}
          <code>lib/root-tokens.ts</code>.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>iOS</h2>
        <p>
          The same seven names exist as points in <code>NTCSpace</code>. Space
          next to text uses <code>@ScaledMetric</code> so Dynamic Type can
          scale it. There is no second iOS ladder.
        </p>
      </section>

      <section className="root-doc-section">
        <h2>Open questions</h2>
        <p>
          Keep the set small. A new gap is either a missing role or a mistake.
          If you reach for 12, 20, or 32, stop and pick the nearest role.
        </p>
        <p className="root-doc-note">
          Source: <code>lib/root-tokens.ts</code> for the catalog; CSS{" "}
          <code>--space-*</code> for web; optional Swift{" "}
          <code>NTCSpace</code> for native.
        </p>
      </section>
    </article>
  );
}
