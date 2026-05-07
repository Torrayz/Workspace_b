# Field Marketing System

Field Marketing System adalah aplikasi internal untuk mengelola rencana penagihan, laporan kunjungan, bukti foto, dan pemantauan lokasi tim lapangan. Project ini menggunakan monorepo npm workspaces dengan dua aplikasi utama: mobile app untuk field collector dan web dashboard untuk admin/superadmin.

## Overview

- **Mobile app**: Expo React Native app untuk user lapangan membuat rencana, mengirim laporan kunjungan, upload foto bukti, dan mengirim lokasi.
- **Web dashboard**: Next.js dashboard untuk admin dan superadmin melihat KPI, laporan, peta lokasi, dan manajemen user.
- **Backend**: Supabase PostgreSQL, Row Level Security, Storage, dan Edge Functions.
- **Shared package**: tipe, konstanta, dan schema validasi yang dapat digunakan lintas app.

## Tech Stack

| Area | Technology |
| --- | --- |
| Monorepo | npm workspaces |
| Mobile | Expo SDK 54, React Native 0.81, Expo Router |
| Web | Next.js 14 App Router, React 18, Tailwind CSS |
| State | Zustand |
| Forms | React Hook Form, Zod |
| Backend | Supabase PostgreSQL, Storage, Edge Functions |
| Maps | Google Maps / react-native-maps |
| Shared code | `@field-marketing/shared` |

## Repository Structure

```text
.
├── apps
│   ├── mobile                 # Expo React Native app
│   └── web                    # Next.js dashboard
├── packages
│   └── shared                 # Shared types, constants, validations
├── supabase
│   ├── functions              # Supabase Edge Functions
│   └── migrations             # Database migrations
├── package.json               # Workspace scripts
├── package-lock.json
└── tsconfig.base.json
```

## Applications

### Mobile

Located in `apps/mobile`.

Primary responsibilities:

- Login using employee ID.
- Create and view collection plans.
- Submit visit reports with amount, status, GPS location, and photo evidence.
- View report history, calendar, and map-based visit data.
- Send current location for admin monitoring.

### Web

Located in `apps/web`.

Primary responsibilities:

- Admin and superadmin dashboard.
- KPI, performance, status, and revenue visualization.
- Report table, filters, and export flow.
- User management for superadmin.
- Delete request approval workflow for plans submitted from mobile.

## Access Model

| Role | Access |
| --- | --- |
| `user` | Mobile app only |
| `admin` | Web dashboard, report monitoring, delete request review |
| `superadmin` | Full web dashboard access, user management, import flow |

The mobile app blocks admin/superadmin accounts. The web dashboard blocks field user accounts.

## Prerequisites

- Node.js 20 LTS or newer. Node 20 is recommended for Expo development.
- npm 10 or newer.
- Expo Go for mobile development.
- Supabase project.
- Google Maps API key for mobile maps.

Use npm only. This project is configured for npm workspaces.

## Environment Variables

Create `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_PUBLIC_APP_URL=http://localhost:8081
```

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.

## Installation

Install dependencies from the repository root:

```bash
npm install
```

Avoid installing dependencies independently inside workspace folders unless you understand the lockfile impact.

## Development

Run the web dashboard:

```bash
npm run dev:web
```

Run the mobile app:

```bash
npm run dev:mobile
```

Or from the mobile workspace:

```bash
cd apps/mobile
npx expo start -c
```

Use tunnel mode only when LAN connection is not available:

```bash
cd apps/mobile
npx expo start --tunnel -c
```

## Verification

Type-check mobile:

```bash
npx tsc --noEmit -p apps/mobile/tsconfig.json
```

Type-check web:

```bash
npx tsc --noEmit -p apps/web/tsconfig.json
```

Lint web:

```bash
npm run lint --workspace=apps/web
```

Format check:

```bash
npm run format:check
```

## Supabase

Database migrations are stored in `supabase/migrations`.

Edge Functions are stored in `supabase/functions`:

| Function | Purpose |
| --- | --- |
| `validate-nomor-induk` | Validates employee ID and returns a custom JWT |
| `process-laporan-submit` | Validates ownership, GPS bounds, and inserts reports |
| `bulk-import-users` | Imports users from parsed Excel rows |

Apply migrations in order before testing production-like flows. Storage buckets and policies must be configured in Supabase for report photo uploads.

## Mobile Build

Preview Android build:

```bash
cd apps/mobile
npx eas build --platform android --profile preview
```

Production build configuration is maintained in `apps/mobile/eas.json`.

## Monorepo Notes

- Web and mobile use different React major versions.
- `apps/mobile/metro.config.js` forces Metro to resolve React from `apps/mobile/node_modules` to avoid duplicate React runtime issues.
- Run dependency installation from the root so `package-lock.json` remains authoritative.
- Keep app-specific environment files inside their respective workspace folders.

## Additional Documentation

- `SUPABASE_DEPLOYMENT.md`
- `MIGRATIONS_VERIFICATION.md`
- `MOBILE_ADMIN_INTEGRATION_GUIDE.md`
- `CHANGELOG.md`

## License

Private internal project.
