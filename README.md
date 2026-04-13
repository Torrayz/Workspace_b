# Field Marketing Reporting System

> **Production-Ready Platform for Real-Time Field Sales & Marketing Team Management**

Sistem ini adalah monorepo berskala perusahaan yang menggabungkan aplikasi Mobile (untuk tim lapangan) dan Web Dashboard (untuk administrator/manajer). Dibangun dengan teknologi modern yang berfokus pada kecepatan, keamanan, dan real-time tracking.

## 📋 Table of Contents
- [Tech Stack Core](#-tech-stack-core)
- [Struktur Monorepo (npm workspaces)](#-struktur-monorepo-npm-workspaces)
- [Arsitektur & Logika Kode Utama](#-arsitektur--logika-kode-utama)
- [Panduan Setup & Instalasi](#-panduan-setup--instalasi)
- [Environment Variables (.env.local)](#-environment-variables)
- [Panduan Supabase (Penting)](#-panduan-supabase--database)
- [Panduan Pengembangan (Untuk Programmer Berikutnya)](#-panduan-pengembangan-developer-guide)

---

## 🛠 Tech Stack Core

**Monorepo Tools:**
- **[npm workspaces](https://docs.npmjs.com/cli/v7/using-npm/workspaces)**: Menggabungkan dependencies dalam satu root (versi React diisolasi).

**Web Dashboard (Manajemen & Analitik):**
- **[Next.js 14 App Router](https://nextjs.org/)**: Server-Side Rendering (SSR) & Server Actions.
- **[Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)**: Sistem styling dan komponen UI modern.
- **[Recharts](https://recharts.org/)**: Visualisasi data (chart / grafik).
- **[Google Maps React](https://github.com/visgl/react-google-maps)**: Tracking lokasi tim lapangan secara instan.
- **[ExcelJS](https://github.com/exceljs/exceljs) & [jsPDF](https://github.com/parallax/jsPDF)**: Ekspor data laporan.

**Mobile App (Karyawan Lapangan):**
- **[Expo SDK 51](https://expo.dev/) & React Native**: Framework mobile lintas platform.
- **[Expo Router](https://docs.expo.dev/router/introduction/)**: Routing berbasis file seperti Next.js.
- **[Zustand](https://github.com/pmndrs/zustand)**: Manajemen state lokal (auth & lokasi).
- **[Expo Location](https://docs.expo.dev/versions/latest/sdk/location/) & Image Picker**: Integrasi native hardware.

**Backend & Database:**
- **[Supabase](https://supabase.com/)**: PostgreSQL, Realtime WebSocket.
- **[Supabase Edge Functions](https://supabase.com/docs/guides/functions)**: Deno-based serverless functions untuk auth custom dan komputasi berat.

---

## 📂 Struktur Monorepo (npm workspaces)

```text
Workspace_b/
├── package.json               # Root monorepo config (Overrides TypeScript/React)
├── supabase/
│   ├── migrations/            # File SQL schema database
│   └── functions/             # Edge Functions (Node.js/Deno logic backend)
├── apps/
│   ├── web/                   # NEXT.JS WEB DASHBOARD
│   │   ├── src/app/           # Next.js App Router (Rute halaman)
│   │   │   ├── (auth)/        # Halaman Login
│   │   │   ├── dashboard/     # Halaman Dashboard + Actions.ts (Server Actions)
│   │   │   └── api/           # Route handlers untuk REST API fallback
│   │   ├── middleware.ts      # Auth protection & proteksi role (Very Important)
│   │   └── src/components/    # Komponen React modular UI
│   │
│   └── mobile/                # EXPO REACT NATIVE APP
│       ├── app/               # Rute aplikasi Expo Router
│       ├── components/        # Komponen UI mobile
│       ├── hooks/             # UseAuth, UseLocation, dll.
│       ├── store/             # Zustand stores (Menyimpan data persisten)
│       ├── lib/supabase.ts    # Setup klien Supabase (SecureStore adapter)
│       └── metro.config.js    # Kritis: Isolasi React Native vs React Next.js
```

---

## 🧠 Arsitektur & Logika Kode Utama

### 1. Autentikasi Kustom (Custom JWT Flow)
Karena karyawan kesulitan menghafal email & password, sistem ini menggunakan **Nomor Induk** sebagai satu-satunya kredensial.
- **Alur Kerja**: User memasukkan Nomor Induk -> Frontend memanggil **Edge Function `validate-nomor-induk`**.
- **Di Supabase Function**: Sistem mengecek database dengan `service_role` (bypass RLS), membuat Custom JWT yang ditandatangani Secret Key, lalu membalas dengan Token.
- **Role Banning**: Middleware Web (`apps/web/src/middleware.ts`) tegas **memblokir** user role `user` dari mengakses situs Web. Mereka diarahkan ke APK Mobile dengan pesan error.

### 2. Dual-React Version Handling (Sangat Penting)
- `apps/web` memakai **React 18** (kebutuhan Next.js stabil).
- `apps/mobile` memakai **React 19** (kebutuhan arsitektur Expo baru).
- **Logika fix**: `package.json` di root memiliki script yang memastikan tidak ada hoisting bentrok, ditangani dengan `metro.config.js` di folder `mobile` untuk mem-bypass root workspace, dan `tsconfig.json` di mobile membatasi `typeRoots`.

### 3. Server-Only Architecture (Next.js Web)
Sistem web memaksimalkan kinerja dan keamanan dengan memindahkan hampir semua interaksi DB ke backend.
- File **`actions.ts`** di dalam folder `dashboard` berisi fungsi _Next.js Server Actions_. Komponen klien tidak langsung berinteraksi dengan Supabase Database, melainkan memanggil Action. Ini menyembunyikan logika RLS dan error handling dari browser.

### 4. Background GPS Location Tracking
- Karyawan mobile harus punya bukti di lokasi. File hook `useLocation.ts` digunakan untuk mendapatkan GPS.
- Data ini tidak dikirim melalui Edge Function, tapi di-**upsert secara asinkron menimpa tabel `user_locations`** menggunakan Supabase Realtime di client. Web Admin memakai subscription (web-socket) sehingga marker peta (Google Maps di web) bergerak tanpa refresh.

---

## 🚀 Panduan Setup & Instalasi

### 1. Prasyarat
- Database **Supabase** (Proyek baru/gratis).
- **Node.js** v20+.

### 2. Instalasi Dependensi
Jalankan ini dari root folder proyek:
```bash
# Otomatis install semua dependency Web dan Mobile melalui Workspaces.
npm install --legacy-peer-deps
```

### 3. Menjalankan Proyek di Lokal
Untuk menjalankan **Web Dashboard**:
```bash
npm run dev:web
# Atau secara manual: cd apps/web && npm run dev
```

Untuk menjalankan **Mobile App (Expo)**:
```bash
npm run dev:mobile
# Pastikan Android SDK (ANDROID_HOME) dan emulator berjalan atau buka Expo Go di HP fisik.
```

---

## 🔐 Environment Variables

Siapkan file environment ini sebelum Anda menjalankannya.

**1. Root Supabase / Web (`apps/web/.env.local`)**
```env
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."
JWT_SECRET="Samakan_Dengan_Secret_Di_Supabase_Edge_Function"
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```

**2. Mobile App (`apps/mobile/.env.local`)**
```env
EXPO_PUBLIC_SUPABASE_URL="https://[PROJECT_ID].supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="eyJhbG..."
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY="AIzaSy..."
```

---

## 🗄 Panduan Supabase & Database

### Migrasi Database (Wajib Pertama)
Semua struktur database disimpan sebagai skrip SQL raw, bukan ORM lokal, karena mengandalkan Row Level Security Supabase.
Buka Dashboard Supabase -> **SQL Editor**, lalu jalankan skrip berikut (Sesuai urutan di folder `/supabase/migrations/`):
1. `001_create_tables.sql`
2. `002_rls_policies.sql`
3. `003_rpc_functions.sql`
4. `004_seed_superadmin.sql` (Agar Anda bisa login web minimal dengan akun Superadmin default).

### Deploy Supabase Edge Functions (Wajib)
Mobile tak akan bisa login tanpa Endpoint autentikasi ini jalan:
```bash
# Pastikan Anda telah menginstal CLI 'supabase' (npx supabase)
# 1. Login CLI
supabase login

# 2. Deploy Functions
supabase functions deploy validate-nomor-induk
supabase functions deploy process-laporan-submit
supabase functions deploy bulk-import-users
```
Set variable rahasia ke proyek Supabase:
```bash
supabase secrets set JWT_SECRET="STRING_RAHASIA_ANDA"
```

---

## 🛠 Panduan Pengembangan (Developer Guide)

> **Untuk para *maintainer* proyek selanjutnya, harap baca peringatan di bawah ini:**

1. **Memastikan Auth Bekerja:**
   Jika di Mobile muncul error **Missing authorization header** saat fungsi login `validate-nomor-induk`, pastikan fetch header HTTP mengirim argumen `Authorization: Bearer <SUPABASE_ANON_KEY>`. Apikey saja tidak cukup untuk Edge Functions Supabase.

2. **Memperbaiki Error Red Squiggly (Tipe React Konflik):**
   Akan ada tipe yang bertarung di IDE TypeScript Anda. `Node_modules` root punya react 18 (diambil Web), `Node_modules` mobile punya react 19. **JANGAN MERUBAH INI.** Abaikan error IDE di vscode (TypeScript Language Server sering bingung dalam monorepo).
   Jika kompilasi (`npm run build:web` atau `npx tsc`) berhasil **exit 0**, kode aman-aman saja.

3. **Cara Menambah Role Baru Secara Cepat:**
   Buka file Database SQL `001_create_tables.sql`, edit baris tipe enum `user_role`. Lalu pastikan pergi ke `apps/web/src/middleware.ts` untuk mengizinkan role baru tersebut menuju path Next.js.
   
4. **Keamanan & Cookies Next.js:**
   Dashboard web membaca session auth menggunakan `cookies().get('auth_user')`. Ini tidak rentan XSS karena `httpOnly`. Jika menambah API di Web yang bersifat mutasi (POST), selalu panggil `createSupabaseAdminClient` (jika bypass aturan RLS dibutuhan).
