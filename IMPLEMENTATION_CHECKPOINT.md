# Implementation checkpoint

## Completed

- Monorepo: `front/`, `backend/`, root `package.json`
- JSON stores + atomic writes under `data/`
- Seed org structure in `backend/src/data/seedPeople.js`
- Excel import (SheetJS `xlsx`), single-file replacement, in-memory cache
- Auth: bcryptjs, JWT HTTP-only cookies, token version, logout revocation, rate-limited login
- Bootstrap admin CLI, temp passwords, forced password change gate
- Role-based row filtering + leaderboard/overview/achievements/orders/team APIs
- React UI: login, change password, overview, achievements, leaderboard, orders, team, admin
- Node test runner: auth, import, permissions (6 tests passing)

## Follow-ups (optional hardening)

- HTTP integration tests with supertest for every endpoint
- Multer 2.x upgrade when stable on target Windows policy
- Map-unassigned UI to persist alias → user ID without manual JSON edits
- Full component library split (ConfirmDialog, Toast, etc.) — core UX present inline
- Validate against your real `.xlsx` when available and adjust column aliases if headers differ

## Excel policy

Exactly one active workbook: `data/current.xlsx`. No historical snapshots or merge across uploads.
