# Field Marketing System

Sistem manajemen laporan kunjungan untuk tim field marketing. Terdiri dari **Web Dashboard** (Admin/Superadmin) dan **Mobile App** (Field Collector).

## Tech Stack

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| **Monorepo** | npm workspaces | - |
| **Mobile** | Expo (Expo Router) | SDK 54 |
| **Mobile UI** | React Native | 0.81.5 |
| **Mobile State** | Zustand | latest |
| **Mobile Maps** | react-native-maps (Google Maps) | latest |
| **Mobile Calendar** | react-native-calendars | latest |
| **Web** | Next.js (App Router) | 14.2 |
| **Web Styling** | TailwindCSS | 3.4 |
| **Backend** | Supabase (PostgreSQL + Edge Functions) | - |
| **Auth** | Custom JWT via Supabase | - |
| **Storage** | Supabase Storage | - |
| **Form** | React Hook Form + Zod | - |
| **Shared** | `@field-marketing/shared` (validasi + tipe) | - |

---

## Prasyarat

Pastikan sudah terinstall di komputer kamu:

- **Node.js** ≥ 20.0.0 ([download](https://nodejs.org/))
- **npm** ≥ 10 (bawaan Node.js)
- **Git** ([download](https://git-scm.com/))
- **Expo Go** app di HP (Android/iOS) — untuk testing mobile
- **ngrok** (opsional, untuk tunnel jika LAN tidak bekerja) — [download](https://ngrok.com/download)

---

## Setup Project

### 1. Clone Repository

```bash
git clone https://github.com/Torrayz/Workspace_b.git
cd Workspace_b
```

### 2. Install Dependencies

```bash
npm install
```

> ⚠️ Jangan gunakan `pnpm` atau `yarn`. Project ini menggunakan **npm workspaces** karena kompatibilitas dengan Metro Bundler (Expo/React Native).

### 3. Setup Environment Variables

#### Mobile (`apps/mobile/.env.local`)

Buat file `apps/mobile/.env.local`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
EXPO_PUBLIC_APP_URL=http://localhost:8081
```

#### Web (`apps/web/.env.local`)

Buat file `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

> 🔑 Dapatkan keys dari [Supabase Dashboard](https://supabase.com/dashboard) → Settings → API

---

## Menjalankan Project

### Web Dashboard (Admin/Superadmin)

```bash
npm run dev:web
```

Buka `http://localhost:3000` di browser.

### Mobile App (Field Collector)

**Cara 1: Mode LAN** (jika HP & laptop di WiFi yang sama)

```bash
cd apps/mobile
npx expo start -c
```

Scan QR code yang muncul di terminal menggunakan Expo Go.

**Cara 2: Mode Tunnel** (jika LAN tidak bekerja / beda jaringan)

```bash
cd apps/mobile
npx expo start --tunnel -c
```

Scan QR code yang muncul di terminal menggunakan Expo Go.

> **⚠️ Troubleshooting Tunnel:**
>
> Jika muncul error `CommandError: failed to start tunnel` atau `session closed`:
>
> 1. Buat akun gratis di [ngrok.com](https://dashboard.ngrok.com/signup)
> 2. Copy authtoken dari dashboard ngrok
> 3. Jalankan: `ngrok config add-authtoken <TOKEN_ANDA>`
> 4. Expo menggunakan ngrok v2 bawaan (`@expo/ngrok-bin`) yang mungkin sudah usang.
>    Jika masih error, ganti binary ngrok bawaan Expo dengan ngrok system:
>    ```bash
>    # Backup binary lama
>    NGROK_BIN=$(find ~/.npm-global -path "*/@expo/ngrok-bin-linux-x64/ngrok" 2>/dev/null)
>    cp "$NGROK_BIN" "${NGROK_BIN}.backup"
>    # Symlink ke system ngrok
>    ln -sf $(which ngrok) "$NGROK_BIN"
>    ```
> 5. Patch file `~/.npm-global/lib/node_modules/@expo/ngrok/index.js` untuk strip internal fields yang tidak dikenal ngrok v3 (lihat commit history untuk detail patch).

---

## Struktur Project

```
Workspace_b/
├── apps/
│   ├── mobile/                   # Expo React Native app
│   │   ├── app/
│   │   │   ├── (auth)/           # Login screen
│   │   │   ├── (main)/           # Tab navigator (5 tabs)
│   │   │   │   ├── index.tsx     # Home — KPI Dashboard
│   │   │   │   ├── rencana.tsx   # Daftar & buat rencana
│   │   │   │   ├── calendar.tsx  # Kalender visual rencana & laporan
│   │   │   │   ├── maps.tsx      # Peta lokasi kunjungan (Google Maps)
│   │   │   │   ├── history.tsx   # History laporan
│   │   │   │   ├── laporan/
│   │   │   │   │   └── buat.tsx  # Form kunjungan (submit laporan)
│   │   │   │   └── _layout.tsx   # Bottom tab navigator
│   │   │   └── _layout.tsx       # Root layout (auth guard)
│   │   ├── components/ui/        # Reusable UI components
│   │   ├── constants/theme.ts    # Design tokens (colors, spacing, etc.)
│   │   ├── hooks/                # Custom hooks (useRencana, useLaporan, etc.)
│   │   ├── lib/                  # Utilities (supabase client, formatters)
│   │   ├── store/                # Zustand stores (auth, location)
│   │   └── app.json              # Expo configuration
│   │
│   └── web/                      # Next.js web dashboard
│       └── src/app/
│           ├── (auth)/           # Login pages
│           └── dashboard/
│               ├── admin/        # Admin dashboard (approve reports, manage users)
│               └── super/        # Superadmin dashboard (full access)
│
├── packages/
│   └── shared/                   # Shared types, validations, constants
│       ├── types/
│       ├── validations/
│       └── constants/
│
├── supabase/
│   ├── functions/                # Supabase Edge Functions
│   └── migrations/               # Database migration SQL files
│
├── package.json                  # Root workspace config
├── tsconfig.base.json            # Shared TypeScript config
└── .gitignore
```

---

## Fitur Utama

### Mobile App (Field Collector)

| Fitur | Deskripsi |
|-------|-----------|
| **KPI Dashboard** | Ringkasan metrik: total rencana, kunjungan bulan ini, DH tertagih, % eksekusi |
| **Rencana** | Buat & kelola rencana penagihan dengan target nominal dan tanggal |
| **Kalender** | Kalender visual menampilkan tanggal target rencana & tanggal kunjungan laporan (locale Indonesia) |
| **Maps** | Peta Google Maps menampilkan pin lokasi GPS kunjungan, filter by status, stat overlay |
| **Form Kunjungan** | Submit laporan dengan foto, GPS, status (lunas/pending/gagal/sebagian) |
| **History** | Lihat riwayat semua laporan yang sudah dikirim |
| **Safe Area** | UI responsif — otomatis menyesuaikan notch, status bar, dan navigasi 3 tombol Android |

### Web Dashboard (Admin/Superadmin)

| Fitur | Deskripsi |
|-------|-----------|
| **Overview** | Statistik global: total user, laporan, rekap per bulan |
| **Laporan** | Review & approve/reject laporan dari field collector |
| **User Management** | Tambah/hapus user (superadmin only) |
| **Persetujuan Hapus** | Approve/reject request hapus rencana dari mobile |
| **RBAC** | Role-based access: admin vs superadmin vs field collector |

---

## Role & Access Control

| Role | Akses |
|------|-------|
| `superadmin` | Web dashboard — full access (semua fitur admin + user management) |
| `admin` | Web dashboard — review laporan, approve delete requests |
| `user` | Mobile app only — buat rencana, submit laporan, lihat history |

> ⚠️ User dengan role `user` yang mencoba akses web dashboard akan di-redirect ke halaman peringatan. Admin/superadmin tidak bisa akses mobile app.

---

## Database (Supabase)

### Tabel Utama

| Tabel | Deskripsi |
|-------|-----------|
| `users` | Data user (nama, email, role, wilayah) |
| `rencana` | Rencana penagihan (target, tanggal, status, delete request) |
| `laporan` | Laporan kunjungan (foto, GPS, nominal, status) |

### Edge Functions

| Function | Deskripsi |
|----------|-----------|
| `process-laporan-submit` | Validasi server-side (GPS bounds, ownership) + insert laporan |

---

## Troubleshooting

### "Metro waiting on exp://..." tapi tidak bisa connect dari HP

1. Pastikan HP dan laptop di WiFi yang **sama**
2. Matikan mobile data di HP sementara
3. Jika tetap gagal, gunakan mode `--tunnel`

### Warning "@types/react version mismatch"

Project ini menggunakan React 18 di web dan React 19 di mobile. Jika muncul warning:

```bash
# Hapus node_modules dan install ulang
rm -rf node_modules apps/mobile/node_modules apps/web/node_modules
npm install
```

### "Invalid hook call" error di mobile

Metro bundler mungkin me-resolve React dari root (v18) bukan dari mobile (v19). File `metro.config.js` sudah dikonfigurasi untuk menangani ini. Jika masih error:

```bash
cd apps/mobile
npx expo start -c   # -c flag membersihkan cache Metro
```

### Build production mobile

```bash
cd apps/mobile
npx eas build --platform android --profile preview
```

---

## Development Notes

- **Jangan gunakan pnpm/yarn** — Metro Bundler tidak kompatibel dengan symlink pnpm
- **Metro config kustom** — `apps/mobile/metro.config.js` memaksa React resolve ke versi mobile (v19)
- **Design tokens** — Semua warna, spacing, dan radius ada di `apps/mobile/constants/theme.ts`
- **Formatting** — Jalankan `npm run format` sebelum commit
- **TypeScript** — Cek error: `cd apps/mobile && npx tsc --noEmit`

---

## License

Private project — not for public distribution.
