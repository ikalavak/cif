# CI Quality Gate Setup

This repo uses a GitHub Actions workflow at `.github/workflows/quality-gate.yml`.

## Trigger policy

The workflow runs on:

- Push to `development`
- Pull requests targeting `staging/testing`, `uat`, or `master`
- Manual run (`workflow_dispatch`)

## What it checks

Three jobs run in parallel:

1. `Admin Panel Checks` in `cif-admin-panel`
2. `Mobile Frontend Checks` in `app-cif/frontend`
3. `Backend Checks` in `app-cif/backend`

Each job runs `npm ci` and then `npm run check:all`.

## Required branch protection

Configure branch protection rules in GitHub for `staging/testing`, `uat`, and `master`:

- Require a pull request before merging
- Require status checks to pass before merging
- Add required checks:
  - `Admin Panel Checks`
  - `Mobile Frontend Checks`
  - `Backend Checks`
- Require at least one approval
- Disable force push

## Recommended promotion flow

- `development` -> `staging/testing`
- `staging/testing` -> `uat`
- `uat` -> `master`

## Notes

- Local hooks prevent most bad pushes early, but can be bypassed with `--no-verify`.
- This CI workflow is the non-bypassable quality gate before branch promotion.
- Existing workflow files under `app-cif/.github/workflows` are not used by GitHub for this repository root.
