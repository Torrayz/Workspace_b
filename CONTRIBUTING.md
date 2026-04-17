# 🤝 Panduan Kontribusi (Contributing Guide)

> Baca ini sebelum mulai ngoding!

---

## ⚠️ ATURAN UTAMA

### 🚫 JANGAN push langsung ke branch `main`

Branch `main` adalah branch **production**. Semua perubahan ke `main` **HARUS melalui Pull Request (PR)** dari branch `develop`.

### 🚫 JANGAN push langsung ke branch `develop`

Selalu buat **branch fitur** dari `develop` terlebih dahulu.

---

## 🌳 Alur Kerja (Git Workflow)

```
main            ← Production (hanya merge dari develop via PR)
└── develop     ← Development utama (hanya merge dari feature branch via PR)
    ├── feature/nama-fitur
    ├── fix/nama-bug
    └── hotfix/urgent-fix
```

### Langkah-langkah:

```bash
# 1. Pastikan develop terbaru
git checkout develop
git pull origin develop

# 2. Buat branch fitur dari develop
git checkout -b feature/nama-fitur-kamu

# 3. Kerjakan dan commit
git add .
git commit -m "feat: deskripsi singkat perubahan"

# 4. Push branch kamu
git push origin feature/nama-fitur-kamu

# 5. Buat Pull Request di GitHub:
#    feature/nama-fitur-kamu → develop
```

---

## 📝 Aturan Penamaan Branch

| Prefix | Digunakan untuk | Contoh |
|---|---|---|
| `feature/` | Fitur baru | `feature/tambah-filter-tanggal` |
| `fix/` | Perbaikan bug | `fix/login-gagal-mobile` |
| `hotfix/` | Fix urgent di production | `hotfix/crash-saat-submit` |
| `docs/` | Perubahan dokumentasi | `docs/update-readme` |
| `refactor/` | Refactoring kode | `refactor/cleanup-hooks` |

---

## 📝 Aturan Commit Message

Gunakan format: `<type>: <deskripsi>`

| Type | Kegunaan |
|---|---|
| `feat` | Fitur baru |
| `fix` | Perbaikan bug |
| `docs` | Perubahan dokumentasi |
| `style` | Formatting, typo (tanpa perubahan logic) |
| `refactor` | Refactoring kode |
| `chore` | Update config, dependency, dll |

**Contoh:**
```
feat: tambah filter tanggal di halaman rencana
fix: perbaiki error upload foto laporan
docs: update panduan setup di README
chore: update expo SDK ke versi terbaru
```

---

## ✅ Checklist Sebelum Buat PR

- [ ] Code sudah di-test secara lokal (web & mobile)
- [ ] Tidak ada error TypeScript (`npm run build:web` sukses)
- [ ] Commit message jelas dan deskriptif
- [ ] Tidak ada file `.env` yang ter-commit
- [ ] PR description menjelaskan apa yang berubah dan kenapa

---

## 🛠 Cara Install Dependency Baru

```bash
# Untuk web
npm install nama-package --workspace=apps/web --legacy-peer-deps

# Untuk mobile
npm install nama-package --workspace=apps/mobile --legacy-peer-deps

# Untuk shared package
npm install nama-package --workspace=packages/shared --legacy-peer-deps
```

> ⚠️ Selalu jalankan dari **root folder** project, bukan dari dalam folder apps/web atau apps/mobile.

---

## ❓ Ada Pertanyaan?

Hubungi project owner sebelum membuat perubahan besar pada arsitektur.
