---
name: pstack-workflow
description: Combined TDD plus pstack evidence spine. Use on features, bug fixes, PRs, and app repos. Do not use poteto-mode sticky. Do not auto-commit.
---

# pstack workflow

Keep TDD and commit gates. Add pstack evidence around them.

## Feature or bug (logic tests can prove)

1. `how` if more than one file. `architect` if the change crosses a boundary.
2. TDD Red with `test-writer`. Confirm fail. Ask. Commit tests only.
3. Green with `implementer`. Do not edit tests. If Stuck, stop and ask.
4. `verifier`. Then `security-auditor` for auth, payments, or secrets. Critical blocks commit.
5. `blast-radius` if the diff looks small and scary. Prove the fact by running code.
6. Ask. Commit production files only.
7. If UI exists: motion skill, then `design-verifier`.

## App repo with no verify skill

Offer once: generate `create-verification-skill`. Prove one feature end to end.

## Contested PR the user asked for

`interrogate`. Do not auto-apply. Then `blast-radius` if the diff looks small and scary.

## Never

- Sticky `/poteto-mode`
- `poteto-agent` on Red or Green
- Commit, push, merge, or open a PR without the user asking
- Graphite land or overnight merge
