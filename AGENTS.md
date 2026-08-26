# Agent instructions

## Cursor Cloud specific instructions

Cloud Agents must use the project files in `.cursor/`. Do not use only local home-directory skills or rules. Those files are not on the Cloud VM.

### Rules (always apply)

Read `.cursor/rules/`:

- `tdd.mdc` — test-driven development. Tests first. Parent commits. Subagents do not commit.
- `design.mdc` — after UI exists, run `design-verifier`.
- `pstack-gates.mdc` — pstack does not override TDD, commits, or PRs.
- `pstack-models.mdc` — per-role model choices.

### Skills

Read `.cursor/skills/` when the task matches:

- TDD spine: `pstack-workflow`
- Web motion: `animate`
- Expo or React Native motion: `animate-expo`
- Motion review: `review-animations`, `ui-craft`
- Motion helpers: `animation-vocabulary`, `find-animation-opportunities`, `improve-animations`

### Agents

Use `.cursor/agents/` for the TDD and design spine:

- `test-writer` (Red)
- `implementer` (Green)
- `verifier`
- `security-auditor` after verifier for auth, payments, or secrets
- `design-verifier` after UI exists

Do not auto-commit. Do not push. Do not open a pull request unless the user asks.
