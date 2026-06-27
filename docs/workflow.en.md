# SynapseCS — Git Workflow & Best Practices

## Branching Strategy

```
main                    production — live
  └─ develop            integration & staging — all branches merged here
       ├─ feat/xxx      new feature
       ├─ fix/xxx       bug fix
       ├─ perf/xxx      performance improvement
       ├─ sec/xxx       security hardening
       ├─ chore/xxx     tooling, CI, refactor, dependencies
       └─ docs/xxx      documentation
```

### Ground Rules

1. **Never commit directly to `main` or `develop`.** All changes go through PRs.
2. **Branch from `develop`, merge into `develop`.**
3. **Only `develop` merges into `main`** — via PR after all sprint features are ready.
4. **Keep branches short-lived.** Max 2-3 days. If it takes longer, split into smaller branches.
5. **One commit per logical change.** Don't wait until everything is done to commit.

---

## Naming Convention

Format: `<prefix>/<kebab-case-description>`

| Prefix | Usage | Example |
|--------|-------|---------|
| `feat/` | New feature | `feat/ai-draft-streaming` |
| `fix/` | Bug fix | `fix/rls-policies` |
| `perf/` | Performance improvement | `perf/parallel-queries` |
| `sec/` | Security hardening | `sec/jwt-app-metadata` |
| `chore/` | Tooling, refactor, CI | `chore/sentry-setup` |
| `docs/` | Documentation | `docs/workflow-guide` |

### Sprint branch examples:

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

Use **Conventional Commits**:

```
<type>(<scope>): <description>
```

### Type

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `sec` | Security fix |
| `refactor` | Code refactor (no behavior change) |
| `chore` | Tooling, CI, dependencies |
| `docs` | Documentation |
| `style` | Formatting, whitespace (not CSS) |

### Scope (optional — which part of the codebase)

`ai`, `supabase`, `auth`, `ui`, `api`, `db`, `config`, etc.

### Examples:

```
feat(ai): add streaming response to AI draft endpoint
fix(auth): validate JWT role from app_metadata instead of user_metadata
perf(db): add IVFFlat index to knowledge_embeddings.embedding
sec(rls): tighten RLS policies for conversations table
chore: configure Sentry for error monitoring
refactor(ai): parallelize SOP search and message fetch
docs: add workflow guide
```

### Commit rules:

- **Use English** (open source standard)
- **Imperative mood** — "add" not "added" or "adds"
- **Lowercase after type** — `fix(rls): tighten policies` not `Fix(rls): Tighten Policies`
- **Max 72 characters** for the subject line. Put details in the body (after blank line) if needed.
- **One commit = one logical change.** Don't mix two unrelated concerns in one commit.

---

## Task Workflow

### 1. Start a New Task

```bash
# Make sure develop is up to date
git checkout develop
git pull

# Create a new branch
git checkout -b <prefix>/<description>
```

### 2. During Development

```bash
# Commit often (every time a logical change is complete)
git add <file>
git commit -m "<type>(<scope>): <message>"

# If develop has moved forward, rebase to keep history linear
git fetch origin
git rebase origin/develop
```

#### Resolving Rebase Conflicts

If a conflict occurs during rebase:

```bash
# 1. Check which files are conflicted
git status

# 2. Open the file, look for conflict markers:
#    <<<<<<< HEAD (develop's version)
#    =======
#    >>>>>>> (your branch's version)

# 3. Edit the file — remove markers, keep the final code

# 4. Stage the resolved file
git add <file>

# 5. Continue the rebase
git rebase --continue

# 6. If you're stuck or want to cancel:
git rebase --abort  # back to before the rebase
```

**IMPORTANT:** `git push --force` is required after a rebase. Because rebase rewrites history, a normal push will be rejected:
```bash
git push --force-with-lease  # safer than --force
```

### 3. Open a PR to Develop

```bash
git push origin <branch-name>
```

Create a Pull Request on GitHub with this format:

**Title:** `<type>(<scope>): <description>` (same as commit format)
**Body:**
```
## What
- Change 1
- Change 2

## Why
Reason this change is necessary

## How to Test
Steps to test manually
```

### 4. Review & Merge

- At least 1 person must review the PR
- Must pass build (lint + typecheck)
- Use **Squash and Merge** to keep develop history clean
- Delete the branch after merging

### 5. Release to Production

```bash
git checkout main
git pull
git merge develop
git tag v<major>.<minor>.<patch>
git push --tags
```

---

## Best Practices

### 1. Keep Your Branch Up-to-Date

Rebase your branch from `develop` regularly to minimize conflicts:

```bash
git fetch origin
git rebase origin/develop
```

### 2. Never Rebase a Shared Branch

**Never** rebase `develop` or `main`. Rebasing rewrites history — force-pushing a shared branch will break everyone else who branched from it.

- Rebase is for **personal branches only** (feat/fix/perf/etc).
- `develop` and `main` use **merge only**.

### 3. Rebase > Merge (for personal branches)

On your own branch, **rebase is cleaner than merge**:

```
Merge:   feat/x ──A──B──C──D──E──F   (cluttered with merge commits)
Rebase:  feat/x ──A──B──C             (linear, easy to read)
```

### 4. Commit Small & Often

- Don't wait until the entire feature is done to commit.
- Each logical change (adding a function, fixing a small bug, renaming) gets its own commit.
- Easier to revert, cherry-pick, and review.

### 5. Self-Review Before Requesting Review

Before assigning a reviewer, check your own work:

```bash
git diff main...HEAD   # see everything that changed
```

Make sure:
- No debug code / console.log left behind
- No irrelevant files committed
- Naming is consistent with the codebase
- Error handling is in place

### 6. Clean Up Merged Branches

Delete local and remote branches after they're merged:

```bash
git branch -d <branch-name>
git push origin --delete <branch-name>
```

Stale branches pile up and make it hard to tell what's still active.

---

## Code Quality Checklist (before commit)

- [ ] `npm run lint` — no errors
- [ ] `npm run build` — no errors
- [ ] No `any` types (when possible)
- [ ] No commented-out code
- [ ] No `console.log` (use `console.error` for error logging)
- [ ] Input validation present at trust boundaries (Server Actions, API routes)
- [ ] Proper error handling — don't catch and silently ignore

---

## Project-Specific Info

**Stack:** Next.js 16 (App Router, Server Actions) + Supabase + OpenRouter
**Root:** `E:\_PROJECT\AI Customer Support (synapse-ai)`
**Base branch:** `develop`
**Dependency install:** `npm install`
**Dev server:** `npm run dev` (at `http://localhost:3000/synapse-cs`)

All Supabase SQL changes must go through migration files — no direct edits in the Supabase dashboard.
