# EasyLink — Internal Sales & Operations Dashboard

Monorepo layout:

- `front/` — React + Vite UI (Arabic default, EN toggle, light/dark themes)
- `backend/` — Express API, Excel import, JSON persistence, auth
- `data/` — Runtime data (not committed): users, people, config, `current.xlsx`

## Requirements

- **Node.js 20 LTS** (or newer 20.x)
- Windows-friendly stack: **no native addons** (uses `bcryptjs`, SheetJS `xlsx`)

## Install (Windows)

```powershell
cd D:\projects\EasyLink
npm install
npm run install:all
```

## Development

Runs API on **8501** and Vite on **5173** with `/api` proxy.

```powershell
npm run dev
```

Open: http://localhost:5173

## Production

```powershell
npm run build
$env:NODE_ENV="production"
npm start
```

Open: http://localhost:8501 (binds `0.0.0.0`)

Optional: `$env:COOKIE_SECURE="true"` behind HTTPS.

## Admin bootstrap

One-time local command (refuses if already completed):

```powershell
npm run bootstrap:admin
```

Copy the username/password shown **once**, sign in, and **change the password** on first login.

## Employee accounts

1. Sign in as admin → **Administration**
2. **Activate** a person → copy the one-time temporary password from the modal
3. User signs in, must change password within **7 days**

Reset: **Reset password** on the user issues a new temporary password (shown once).

## Daily Excel upload

- Admin → upload `.xlsx` (max 50 MB)
- Required sheets (name trim matched): `2026 Report`, `Under Activation`, `Lost Report`
- Header row detected by `KAM Name` within first 10 rows
- **Single active report policy:** successful upload **replaces** `data/current.xlsx` and rebuilds all metrics; no historical workbooks kept

### Assumptions (no production workbook in repo)

- `# of Orders` is treated as an **order identifier** string
- Applied revenue counts only rows on **`2026 Report`**
- Month column is **1–12**; year comes from **Admin → Reporting year** (`config.reportingYear`), not upload date
- Replace `front/public/logo.png` with your company logo to refine theme colors

## Permissions (summary)

| Role | Visibility |
|------|------------|
| admin | All rows, admin tools |
| top | All rows |
| manager | Self + direct reports (`managerId`) |
| ict | Self + ICT-classified orders |
| employee | Self only |

Leaderboard: company-wide ranks without customer/MSISDN details.

## Environment variables

| Variable | Purpose |
|----------|---------|
| `PORT` | Default `8501` |
| `HOST` | Default `0.0.0.0` |
| `NODE_ENV` | `production` serves `front/dist` |
| `COOKIE_SECURE` | `true` for Secure cookies |
| `EASYLINK_DATA_DIR` | Override data root (tests) |

JWT secret: `data/.jwt-secret` (local file, mode 600).

## Persistence & backup

Single Node process; JSON + one XLSX under `data/`. Back up the entire `data/` folder while the app is stopped. Use atomic writes; avoid multiple server instances sharing the same `data/`.

## Windows Task Scheduler

1. Action: `Program` → `node`
2. Arguments: `D:\projects\EasyLink\backend\src\index.js`
3. Start in: `D:\projects\EasyLink`
4. Set `NODE_ENV=production` in task environment

## Testing

```powershell
npm test
```

## Troubleshooting

- **403 PASSWORD_CHANGE_REQUIRED** — complete `/change-password`
- **TEMP_PASSWORD_EXPIRED** — admin reset required
- **Import errors** — verify sheet names and `KAM Name` header row
- **Empty dashboards** — upload Excel or check reporting year vs month column

## Screenshots

Run dev or production, sign in, use browser devtools → capture viewport per page.
