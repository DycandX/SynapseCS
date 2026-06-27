# SynapseCS — Git Workflow & Best Practices

## Branching Strategy

```
main                    production — live
  └─ develop            integration & staging — gabungan semua branch
       ├─ feat/xxx      fitur baru
       ├─ fix/xxx       bug fix
       ├─ perf/xxx      performance improvement
       ├─ sec/xxx       security hardening
       ├─ chore/xxx     tooling, CI, refactor, dependency
       └─ docs/xxx      dokumentasi
```

### Aturan Dasar

1. **Task/fix branch merge langsung ke `develop` via terminal.** Nggak perlu PR.
2. **Branch dari `develop`, merge ke `develop`.**
3. **Hanya `develop` yang merge ke `main` — via PR di GitHub.** (setelah sprint selesai)
4. **Branch pendek umurnya.** Maksimal 2-3 hari. Kalo lebih, split jadi branch lebih kecil.
5. **Tiap logical change satu commit.** Jangan nunggu sampe selesai semua baru commit.

---

## Workflow per Sprint

```
┌─────────────────────────────────────────────────────────────┐
│                     Satu Sprint (P0 / P1 / P2)              │
│                                                             │
│  Task 1:  feat/xxx ──(merge terminal)──→ develop            │
│  Task 2:  fix/xxx  ──(merge terminal)──→ develop            │
│  Task 3:  perf/xxx ──(merge terminal)──→ develop            │
│  ...                                                         │
│  Final:   develop ──(PR)──→ main ──(tag)──→ deploy          │
└─────────────────────────────────────────────────────────────┘
```

| Langkah | Tujuan | Kapan | Metode |
|---------|--------|-------|--------|
| Task branch → `develop` | Integrasi & testing | Tiap 1 task selesai | Merge terminal |
| `develop` → `main` | Rilis production | Setelah 1 sprint selesai | PR di GitHub |

**Aturan penting:**
- **Jangan pernah merge langsung ke `main`.** `develop` adalah staging/QA. `main` cuma diisi kalo udah tested lewat `develop`.
- **Tiap 1 task = 1 branch.** Jangan gabung 2 task beda dalam 1 branch.

---

## Naming Convention

Format: `<prefix>/<kebab-case-description>`

| Prefix | Penggunaan | Contoh |
|--------|-----------|--------|
| `feat/` | Fitur baru | `feat/ai-draft-streaming` |
| `fix/` | Bug fix | `fix/rls-policies` |
| `perf/` | Performance | `perf/parallel-queries` |
| `sec/` | Security | `sec/jwt-app-metadata` |
| `chore/` | Tooling, refactor, CI | `chore/sentry-setup` |
| `docs/` | Dokumentasi | `docs/workflow-guide` |

### Contoh branch untuk sprint:

```
fix/rls-policies
fix/get-embedding
perf/pgvector-index
feat/ai-streaming
sec/input-validation
perf/data-caching
feat/pagination-inbox
chore/migration-workflow
```

---

## Commit Message Convention

Gunakan **Conventional Commits**:

```
<type>(<scope>): <deskripsi>
```

### Type

| Type | Kapan |
|------|-------|
| `feat` | Fitur baru |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `sec` | Security fix |
| `refactor` | Refactor kode (tanpa ubah behavior) |
| `chore` | Tooling, CI, dependency |
| `docs` | Dokumentasi |
| `style` | Formatting, whitespace (bukan CSS) |

### Scope (opsional — bagian mana dari codebase)

`ai`, `supabase`, `auth`, `ui`, `api`, `db`, `config`, dll.

### Contoh:

```
feat(ai): add streaming response to AI draft endpoint
fix(auth): validate JWT role from app_metadata instead of user_metadata
perf(db): add IVFFlat index to knowledge_embeddings.embedding
sec(rls): tighten RLS policies for conversations table
chore: configure Sentry for error monitoring
refactor(ai): parallelize SOP search and message fetch
docs: add workflow guide
```

### Aturan commit:

- **Deskripsi dalam bahasa Inggris** (standar open source)
- **Gunakan imperative mood** — "add" bukan "added" atau "adds"
- **Huruf kecil setelah type** — `fix(rls): tighten policies` bukan `Fix(rls): Tighten Policies`
- **Maksimal 72 karakter** untuk subjek. Detail di body (setelah baris kosong) kalo perlu.
- **Satu commit = satu logical change.** Jangan campur 2 concern beda dalam 1 commit.

---

## Workflow untuk Ngerjain Task

### 1. Mulai Task Baru

```bash
# Pastikan develop up-to-date
git checkout develop
git pull

# Branch baru
git checkout -b <prefix>/<deskripsi>
```

### 2. Selama Ngerjain

```bash
# Commit sering (tiap logical change selesai)
git add <file>
git commit -m "<type>(<scope>): <message>"

# Kalo develop udah maju, rebase biar history linear
git fetch origin
git rebase origin/develop
```

#### Resolve Konflik Saat Rebase

Kalo muncul konflik waktu rebase:

```bash
# 1. Cek file yang conflict
git status

# 2. Buka file, cari marker conflict:
#    <<<<<<< HEAD (punya develop)
#    =======
#    >>>>>>> (punya branch lo)

# 3. Edit file, hapus marker, tentuin kode final

# 4. Stage file yang udah diresolve
git add <file>

# 5. Lanjutin rebase
git rebase --continue

# 6. Kalo bingung / mau batalin rebase:
git rebase --abort  # balik ke sebelum rebase
```

**PENTING:** `git push --force` setelah rebase. Karena rebase nulis ulang history, push biasa bakal ditolak:
```bash
git push --force-with-lease  # lebih aman daripada --force
```

### 3. PR ke Develop

```bash
git push origin <branch-name>
```

Buat Pull Request di GitHub dengan format:

**Title:** `<type>(<scope>): <deskripsi>` (sama kayak commit)
**Body:**
```
## What
- Perubahan 1
- Perubahan 2

## Why
Alasan kenapa perubahan ini perlu

## How to Test
Langkah test manual
```

### 4. Merge ke Develop (Terminal)

Karena solo dev, nggak perlu PR ke develop — langsung merge aja:

```bash
git checkout develop
git pull
git merge <nama-branch>
git push origin develop
git branch -d <nama-branch>
git push origin --delete <nama-branch>
```

Pastikan `npm run build && npm run lint` lulus sebelum merge.

### 5. Release ke Production (via PR)

```bash
# 1. Merge develop ke main via terminal
git checkout main
git pull
git merge develop

# 2. Tag version
git tag v<major>.<minor>.<patch>
git push origin main --tags
```

Atau bikin **PR dari `develop` ke `main`** di GitHub untuk audit trail, lalu merge + tag manual. Pilih metode yang lo mau — yang penting ada tag version tiap rilis.

---

## Best Practices

### 1. Keep Branch Up-to-Date

Rebase branch lo secara rutin dari `develop` biar conflict minimal kalo udh telanjur kerja panjang:

```bash
git fetch origin
git rebase origin/develop
```

### 2. Jangan Rebase Shared Branch

**Jangan pernah** rebase `develop` atau `main`. Rebase nulis ulang history — kalo dipaksa push ke shared branch, semua orang yg udah branch dari situ bakal pusing.

- Rebase cuma dipake di **personal branch** (feat/fix/perf/dll).
- `develop` dan `main` pake **merge** aja.

### 3. Rebase > Merge (untuk personal branch)

Di branch lo sendiri, **rebase lebih bersih daripada merge**:

```
Merge:   feat/x ──A──B──C──D──E──F   (banyak merge commit)
Rebase:  feat/x ──A──B──C             (linear, gampang dibaca)
```

### 4. Commit Kecil & Sering

- Jangan nunggu selesai semua fitur baru commit.
- Tiap logical change (bikin fungsi, fixing bug kecil, ganti nama) commit sendiri.
- Gampang revert, gampang cherry-pick, gampang review.

### 5. Review PR Sebelum Minta Review

Sebelum assign reviewer, cek sendiri dulu:

```bash
git diff main...HEAD   # apa aja yg berubah
```

Pastikan:
- Nggak ada debug code / console.log
- Nggak ada file ke-commit yang nggak relevan
- Naming konsisten sama codebase
- Error handling ada

### 6. Bersihin Branch Bekas

Hapus branch lokal & remote setelah di-merge:

```bash
git branch -d <branch-name>
git push origin --delete <branch-name>
```

Kalo lupa, branch numpuk — lama2 pusing bedain mana yg masih aktif.

---

## Code Quality Checklist (sebelum commit)

- [ ] `npm run lint` — no errors
- [ ] `npm run build` — no errors
- [ ] No `any` types (kalo bisa)
- [ ] No commented-out code
- [ ] No `console.log` (pake `console.error` kalo error logging)
- [ ] Input validation ada untuk trusted boundaries (Server Actions, API routes)
- [ ] Error handling proper — jangan catch trus silent

---

## Proyek ini spesifik

**Stack:** Next.js 16 (App Router, Server Actions) + Supabase + OpenRouter
**Root:** `E:\_PROJECT\AI Customer Support (synapse-ai)`
**Base branch:** `develop`
**Dependency install:** `npm install`
**Dev server:** `npm run dev` (di `http://localhost:3000/synapse-cs`)

Semua perubahan SQL (Supabase) harus lewat migration file, bukan edit langsung di dashboard.
