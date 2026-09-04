# Phase 5 — Audit CLAUDE.md's project-specific section against reality

Phase 4 only touched CLAUDE.md's doc-index list and one stale example list. This phase is the
real audit: every factual claim in the "Project: reflow" section (from line 92 down) checked
against current code. The guidelines section (§1-5, lines 1-90) is generic behavioral policy, not
a factual claim about this project — **out of scope**, leave untouched.

Findings below are already verified against the current tree (`src/`, `supabase/migrations/`,
`package.json`, `.env.example`, `.claude/skills/`) as of this audit. Fixing them is mechanical.

## Task 1: Fix the stale `src/` project-structure tree

`CLAUDE.md`'s tree (lines 105-128) is out of date on all three subfolders:

- [x] **`components/`** — listed as "TaskList, TaskRow, MorningFlow, CompareDuel, BrainDump,
      LeftoverCard, TagInput, AddTaskFab, TaskModal, InstallPrompt, VersionBadge, BorderGlow".
      Current folder also has `AppLoading.tsx`, `EmptyState.tsx`, `TaskListSkeleton.tsx`,
      `Toast.tsx`, `UpdateBanner.tsx` — five components missing from the list, three of them
      (`TaskListSkeleton`, `Toast`, `EmptyState`) are exactly the empty-state/error-UX/loading work
      that was implemented after this line was last written. Update the list to match.
- [x] **`components/icons/`** — the description ("hand-written stroke icons...") is still
      accurate, but if the list of icons is ever enumerated elsewhere it should include `Pencil`,
      `Clock`, `Refresh`, `Share`, `GithubMark`, `GoogleMark`, `ThemeToggle` alongside whatever's
      already named. (Current CLAUDE.md doesn't enumerate icons individually, so likely no change
      needed here beyond confirming the prose description still holds — it does.)
- [x] **`hooks/`** — listed as "useAuth, useTasks, useMorningFlow, useCompareInsertion,
      useLongPressDrag, useInstallPrompt, useRolloverPrompt, useReducedMotion". Current folder also
      has `useAppUpdate.ts`, `useTheme.ts`, `useToast.ts` — three missing. Update the list.
- [x] **`lib/`** — listed as "tasks.ts, ranking.ts, compare.ts, triage.ts, tags.ts, swipe.ts,
      realtimeMerge.ts, transitions.ts, pwa.ts, supabase.ts, devMock.ts". Current folder also has
      `validation.ts`, `textScale.ts`, `theme.ts` — three missing, each with its own `*.test.ts`
      sibling per the stated convention. Update the list and one-line descriptions (this is the
      list `docs/ARCHITECTURE.md` Phase 3 also draws from — keep the two in sync rather than
      writing the module descriptions twice from scratch).

## Task 2: Verify commands and env vars are still accurate

- [x] **Commands table** (lines 147-154) — matches `package.json` scripts exactly
      (`dev`, `build`, `preview`, `test`, `lint`) with one omission: `package.json` also has a
      `postinstall: patch-package` script not mentioned in CLAUDE.md. Decide whether this is worth
      surfacing (only matters if someone's confused why `npm install` runs something extra) —
      recommend a one-line mention since an unexplained postinstall step is exactly the kind of
      thing that prompts "why did this run" confusion.
- [x] **`npm run dev -- --host`** — confirmed still valid (Vite standard flag), no change needed.
- [x] **Environment variables table** (lines 158-162) — cross-checked against `.env.example`:
      all three vars (`VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_SCHEMA`,
      `VITE_DEV_MODE`) match exactly, including the "optional, default public" framing. **No
      change needed** — this section is accurate.

## Task 3: Verify the migrations claim

- [x] "run every file in `supabase/migrations/` in filename order, starting with `0001_tasks.sql`"
      — current folder has `0001_tasks.sql` through `0005_input_limits.sql`, plus
      `preprod_schema_grants.sql` and `preprod_schema_init.sql`. The numbered-file instruction is
      still correct (those two extra files are preprod-specific, already handled by the
      `devops-workflow` skill per the `VITE_SUPABASE_SCHEMA` row). **No change needed**, but
      confirm README.md's equivalent setup steps (Phase 4, README update task) list the same
      current migration count — don't let the two setup guides drift to different migration
      numbers.

## Task 4: Verify the deployment section

- [x] "Full branching model... live in the `devops-workflow` skill" — confirmed, skill exists at
      `.claude/skills/devops-workflow/SKILL.md` and its description matches
      (feature/dev/main branch flow, DEV/QUALITY/PROD via Octopus). **No change needed.**
- [x] "Current rollout state/open issues are tracked in `docs/plans/devops-setup/00-overview.md`"
      — still true after Phase 1 archives 02/04 (00-overview.md itself stays active until Phase 6
      is done). **No change needed**, but re-check this line once `devops-setup` is fully archived
      in some future session — it'll need to point at the archive instead.
- [x] `.github/workflows/` — CLAUDE.md mentions this path generically ("touching
      `.github/workflows/*`"); confirmed `release.yml` exists there. **No change needed.**

## Task 5: Apply the fixes

- [x] Edit `CLAUDE.md` lines 105-128 (project structure tree) per Task 1
- [x] Add the one-line `postinstall` mention per Task 2, if judged worth it
- [x] Leave Tasks 2 (env vars)/3 (migrations)/4 (deployment) content as-is — verified correct

## Explicitly out of scope for this phase

- The behavioral guidelines §1-5 (lines 1-90) — generic policy, not a factual claim, not audited
- Re-litigating whether the guidelines are still wanted/followed — that's a product/process
  conversation, not a docs-accuracy one

## Verify

- [x] Every file/folder named in CLAUDE.md's project-structure tree exists at that path
- [x] Every file that exists in `src/components/`, `src/hooks/`, `src/lib/` (top-level, non-test)
      is named somewhere in the tree — no silent omissions in either direction
- [x] `docs/ARCHITECTURE.md` (Phase 3) and CLAUDE.md's module lists describe the same set of files
      (one can be terser than the other, but neither should contradict the other on what exists)
