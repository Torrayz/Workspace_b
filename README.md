# 🏢 Field Marketing Reporting System

> **Sistem Pelaporan & Manajemen Tim Marketing Lapangan — Real-Time**

Platform monorepo yang menggabungkan **Mobile App** (untuk karyawan lapangan) dan **Web Dashboard** (untuk Admin/Superadmin). Dibangun untuk monitoring kinerja tim secara real-time: laporan kunjungan, rencana penagihan, tracking GPS, dan analitik bisnis.

---

## 📋 Daftar Isi

- [Tech Stack](#-tech-stack)
- [Struktur Folder](#-struktur-folder)
- [Cara Setup & Menjalankan Project](#-cara-setup--menjalankan-project)
- [Environment Variables](#-environment-variables)
- [Setup Database (Supabase)](#-setup-database-supabase)
- [Deploy Edge Functions](#-deploy-edge-functions)
- [Alur Kerja Git (Branch Workflow)](#-alur-kerja-git-branch-workflow)
- [Arsitektur & Konsep Penting](#-arsitektur--konsep-penting)
- [Catatan Penting untuk Developer](#-catatan-penting-untuk-developer)
- [Kontak & Kontributor](#-kontak--kontributor)

---

## 🛠 Tech Stack

| Layer | Teknologi |
|---|---|
| **Monorepo** | npm workspaces |
| **Web Dashboard** | Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui, Recharts, Google Maps |
| **Mobile App** | Expo SDK 54, React Native 0.81, React 19, Expo Router, Zustand |
| **Backend / DB** | Supabase (PostgreSQL + Realtime WebSocket + Edge Functions) |
| **Shared Package** | TypeScript types, Zod validations, constants |
| **Auth** | Custom JWT via Supabase Edge Function (login pakai Nomor Induk) |
| **Export** | ExcelJS (xlsx), jsPDF (pdf) |

---

## 📂 Struktur Folder

```
Workspace_b/
├── package.json                  # Root monorepo (npm workspaces config)
├── tsconfig.base.json            # TypeScript config induk
├── .prettierrc                   # Config Prettier (formatter)
├── .gitignore                    # File yang diabaikan git
│
├── apps/
│   ├── web/                      # 🌐 WEB DASHBOARD (Next.js 14)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/login/ # Halaman login web
│   │   │   │   ├── dashboard/    # Halaman dashboard + Server Actions
│   │   │   │   │   ├── admin/    # Dashboard Admin
│   │   │   │   │   └── super/    # Dashboard Superadmin (manajemen user)
│   │   │   │   └── api/          # API route handlers
│   │   │   ├── components/
│   │   │   │   ├── features/     # Komponen fitur (dashboard, maps, reports, users)
│   │   │   │   ├── layout/       # Layout (Sidebar, Header, DashboardLayout)
│   │   │   │   ├── providers/    # ThemeProvider
│   │   │   │   └── ui/           # Komponen UI dasar (Toaster, dll)
│   │   │   ├── hooks/            # Custom hooks (useDashboardData)
│   │   │   ├── lib/              # Utilities (supabase client/server, formatters)
│   │   │   └── middleware.ts     # 🔒 Auth guard & role-based access control
│   │   ├── .env.local            # ⚠️ ENV web (JANGAN COMMIT — lihat template di bawah)
│   │   ├── next.config.js        # Next.js config
│   │   ├── tailwind.config.ts    # Tailwind config
│   │   └── package.json          # Dependencies web
│   │
│   └── mobile/                   # 📱 MOBILE APP (Expo + React Native)
│       ├── app/
│       │   ├── (auth)/           # Halaman auth (login screen)
│       │   ├── (main)/           # Halaman utama setelah login
│       │   │   ├── index.tsx     # Home screen (ringkasan & KPI)
│       │   │   ├── rencana.tsx   # Manajemen rencana penagihan
│       │   │   ├── history.tsx   # Riwayat laporan
│       │   │   └── laporan/
│       │   │       └── buat.tsx  # Form buat laporan kunjungan
│       │   └── _layout.tsx       # Root layout
│       ├── components/ui/        # Komponen UI reusable (Button, Card, Input, dll)
│       ├── hooks/                # Custom hooks (useAuth, useLaporan, useRencana, useLocation)
│       ├── store/                # Zustand stores (authStore, locationStore)
│       ├── lib/                  # Supabase client, formatters, image compress
│       ├── constants/            # Theme & design tokens
│       ├── assets/               # Ikon & splash screen
│       ├── .env.local            # ⚠️ ENV mobile (JANGAN COMMIT — lihat template di bawah)
│       ├── metro.config.js       # Metro bundler config (isolasi React version)
│       └── package.json          # Dependencies mobile
│
├── packages/
│   └── shared/                   # 📦 SHARED PACKAGE (@field-marketing/shared)
│       ├── types/                # TypeScript types (user, laporan, rencana, dashboard)
│       ├── validations/          # Zod schemas (user, rencana)
│       ├── constants/            # Shared constants
│       └── index.ts              # Entry point
│
└── supabase/
    ├── migrations/               # 🗄️ SQL migration files (di-run manual di SQL Editor)
    │   ├── 001_create_tables.sql
    │   ├── 002_rls_policies.sql
    │   ├── 003_rpc_functions.sql
    │   ├── 003_rencana_delete_workflow.sql
    │   └── 004_seed_superadmin.sql
    └── functions/                # ⚡ Supabase Edge Functions (Deno)
        ├── validate-nomor-induk/ # Auth: login via nomor induk → custom JWT
        ├── process-laporan-submit/ # Proses submit laporan
        └── bulk-import-users/    # Import user dari Excel
```

---

## 🚀 Cara Setup & Menjalankan Project

### Prasyarat

- **Node.js** v20 atau lebih baru
- **npm** (sudah include di Node.js)
- **Expo Go** app di HP (untuk test mobile) ATAU Android emulator
- Akses ke project **Supabase** (minta ke project owner)

### Langkah 1 — Clone Repository

```bash
git clone https://github.com/Torrayz/Workspace_b.git
cd Workspace_b
```

### Langkah 2 — Checkout ke Branch develop

```bash
# JANGAN langsung kerja di branch main!
git checkout develop
# Buat branch fitur kamu dari develop
git checkout -b feature/nama-fitur
```

### Langkah 3 — Install Dependencies

```bash
# Dari root folder — install semua (web + mobile + shared)
npm install --legacy-peer-deps
```

> ⚠️ **Wajib pakai `--legacy-peer-deps`** karena ada dual React version (React 18 di web, React 19 di mobile).

### Langkah 4 — Setup Environment Variables

Buat file `.env.local` di masing-masing app. **Lihat bagian [Environment Variables](#-environment-variables) di bawah untuk template.**

### Langkah 5 — Jalankan Project

**Web Dashboard:**
```bash
npm run dev:web
# Buka http://localhost:3000
```

**Mobile App (Expo):**
```bash
npm run dev:mobile
# Scan QR code dari Expo Go di HP, ATAU tekan 'a' untuk Android emulator
```

---

## 🔐 Environment Variables

> ⚠️ File `.env.local` **TIDAK boleh di-commit ke git!** Minta value-nya ke project owner.

### `apps/web/.env.local`

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOi..."

# JWT (harus sama dengan yang di-set di Supabase Edge Function)
JWT_SECRET="string_rahasia_anda"

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```

### `apps/mobile/.env.local`

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOi..."

# Google Maps (untuk fitur lokasi)
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```

### Di mana mendapat value-nya?
| Variable | Sumber |
|---|---|
| `SUPABASE_URL` & `ANON_KEY` | Supabase Dashboard → Settings → API |
| `SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API (jangan share ke client!) |
| `JWT_SECRET` | Supabase Dashboard → Settings → API → JWT Secret |
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs → Maps JavaScript API |

---

## 🗄 Setup Database (Supabase)

Jika kamu setup project dari nol atau perlu reset database:

1. Buka **Supabase Dashboard** → **SQL Editor**
2. Jalankan migration files **SECARA BERURUTAN**:

```
supabase/migrations/001_create_tables.sql       → Buat semua tabel
supabase/migrations/002_rls_policies.sql         → Row Level Security policies
supabase/migrations/003_rpc_functions.sql        → Functions & stored procedures
supabase/migrations/003_rencana_delete_workflow.sql → Workflow hapus rencana
supabase/migrations/004_seed_superadmin.sql      → Akun superadmin default
```

> ⚠️ **Urutan PENTING!** Jangan loncat — tiap file bergantung pada file sebelumnya.

---

## ⚡ Deploy Edge Functions

Edge Functions wajib di-deploy agar fitur login & submit laporan berfungsi:

```bash
# 1. Install Supabase CLI (jika belum)
npm install -g supabase

# 2. Login ke Supabase
supabase login

# 3. Link ke project
supabase link --project-ref <PROJECT_ID>

# 4. Deploy semua function
supabase functions deploy validate-nomor-induk
supabase functions deploy process-laporan-submit
supabase functions deploy bulk-import-users

# 5. Set secret (JWT_SECRET harus sama dengan di .env.local web)
supabase secrets set JWT_SECRET="string_rahasia_anda"
```

---

## 🌳 Alur Kerja Git (Branch Workflow)

```
main          ← Branch production, hanya via Pull Request (PR)
└── develop   ← Branch development utama, merge fitur ke sini
    ├── feature/nama-fitur-1
    ├── feature/nama-fitur-2
    └── fix/nama-bugfix
```

### Aturan:
1. **JANGAN push langsung ke `main`** — harus lewat Pull Request dari `develop`
2. **JANGAN push langsung ke `develop`** — buat branch fitur dulu
3. **Naming convention branch:**
   - `feature/deskripsi-singkat` — untuk fitur baru
   - `fix/deskripsi-singkat` — untuk bugfix
   - `hotfix/deskripsi-singkat` — untuk fix urgent di production
4. **Sebelum buat PR, pastikan:**
   - Code sudah di-test secara lokal
   - Tidak ada error TypeScript (`npm run build:web`)
   - Commit message jelas dan deskriptif

### Contoh alur kerja:
```bash
# 1. Pastikan develop up to date
git checkout develop
git pull origin develop

# 2. Buat branch fitur
git checkout -b feature/tambah-filter-laporan

# 3. Kerjakan fiturnya, lalu commit
git add .
git commit -m "feat: tambah filter tanggal di halaman laporan"

# 4. Push branch
git push origin feature/tambah-filter-laporan

# 5. Buat Pull Request di GitHub: feature/tambah-filter-laporan → develop
```

---

## 🧠 Arsitektur & Konsep Penting

### 1. Autentikasi (Custom JWT)
- Sistem ini **TIDAK pakai email/password**. User login pakai **Nomor Induk** saja.
- Alur: Mobile mengirim Nomor Induk → Edge Function `validate-nomor-induk` → cek DB → return JWT token.
- Web dashboard membaca session dari cookie `auth_user` (httpOnly).

### 2. Role-Based Access Control (RBAC)
| Role | Akses |
|---|---|
| `user` | **Hanya mobile app** — tidak bisa akses web dashboard |
| `admin` | Web dashboard admin (`/dashboard/admin`) |
| `superadmin` | Web dashboard superadmin (`/dashboard/super`) + semua akses admin |

Middleware di `apps/web/src/middleware.ts` mengontrol ini secara ketat.

### 3. Dual React Version
- `apps/web` → **React 18** (kebutuhan Next.js 14)
- `apps/mobile` → **React 19** (kebutuhan Expo SDK 54)
- Ini **sudah dikonfigurasi** — jangan ubah versi React di salah satu app tanpa paham implikasinya.
- `metro.config.js` di mobile sudah mengisolasi agar tidak bentrok.

### 4. Server Actions (Web)
- File `apps/web/src/app/dashboard/actions.ts` berisi semua logika interaksi database.
- Komponen client **tidak langsung query Supabase** — selalu lewat Server Actions.
- Ini untuk keamanan (menyembunyikan DB logic dari browser).

### 5. Realtime GPS Tracking
- Mobile app mengirim lokasi GPS ke tabel `user_locations` via Supabase Realtime.
- Web dashboard subscribe ke perubahan → marker di Google Maps bergerak live.

---

## ⚠️ Catatan Penting untuk Developer

### Hal yang HARUS diperhatikan:

1. **Jangan commit file `.env.local`** — sudah di-`.gitignore`, tapi tetap hati-hati.

2. **Error TypeScript merah di IDE (squiggly lines)** — ini NORMAL di monorepo dengan dual React version. Selama `npm run build:web` atau `npx tsc` berhasil (exit code 0), abaikan error IDE.

3. **Install dependency baru** — jalankan dari root dan tentukan workspace:
   ```bash
   # Untuk web
   npm install nama-package --workspace=apps/web --legacy-peer-deps
   
   # Untuk mobile
   npm install nama-package --workspace=apps/mobile --legacy-peer-deps
   ```

4. **Menambah role baru:**
   - Edit enum `user_role` di `supabase/migrations/001_create_tables.sql`
   - Update middleware di `apps/web/src/middleware.ts`
   - Update Sidebar di `apps/web/src/components/layout/Sidebar.tsx`

5. **Edge Function gagal (Missing authorization header):**
   - Pastikan request mengirim header `Authorization: Bearer <SUPABASE_ANON_KEY>`
   - Apikey saja tidak cukup untuk Edge Functions.

6. **Jangan hapus `metro.config.js`** di folder mobile — file ini kritis untuk mengisolasi React Native dari React Next.js.

### Scripts yang tersedia:

```bash
npm run dev:web          # Jalankan web dashboard (localhost:3000)
npm run dev:mobile       # Jalankan mobile app (Expo)
npm run build:web        # Build production web
npm run lint             # Lint semua workspace
npm run format           # Format semua file dengan Prettier
npm run format:check     # Cek format tanpa mengubah file
```

---

## 👥 Kontak & Kontributor

| Nama | Role | GitHub |
|---|---|---|
| Torray | Project Owner | [@Torrayz](https://github.com/Torrayz) |

---

> 📅 Terakhir diperbarui: April 2026
