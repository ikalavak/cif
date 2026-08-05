# Local Push Quality Gate Setup

This repo includes a shared pre-push hook that runs project checks before any push is sent.

## One-time setup (after clone)

Run this from repo root:

```sh
npm run setup:hooks
```

This sets:

- `core.hooksPath` to `.githooks`
- executable permissions on hook scripts

## What runs on each push

The pre-push hook runs:

1. `cif-admin-panel` checks
2. `app-cif/frontend` checks
3. `app-cif/backend` checks

Each project runs `npm run check:all`.

## Current check set

- Build checks
- Dependency vulnerability check with `npm audit --omit=dev --audit-level=critical`

## Notes

- If any check fails, push is blocked.
- Local hooks can be bypassed with `--no-verify`.
- Use CI checks as the non-bypassable enforcement layer for branch promotion.
