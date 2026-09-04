# Phase 6 — Close the loop

> **Archived 2026-09-04, partly moot.** The pipeline was proved end to end by a real
> production deployment (see `04-octopus-setup.md`), so the dry-run box is satisfied in
> substance. The `feature/combat-screen-polish` retarget no longer applies — that branch
> no longer exists. The README branch-model note was never written; it was judged not
> worth a dedicated phase. Still-open infrastructure items moved to `docs/BACKLOG.md`.

Prove the pipeline end to end, then bring existing work back in line with the new
model.

## Deliverables

- [ ] Dry-run: merge a trivial change through `feature/* → dev → main` (real human
      approval on the `dev → main` PR). Confirm GitHub Actions creates a release,
      Octopus auto-deploys to dev, and the preprod/prod steps sit waiting for manual
      approval. Approve preprod, confirm it deploys correctly. Do **not** approve prod
      until actually ready to ship — this run is just proving the mechanics.
      Verify: all three domains reachable, each serving from its own Supabase project
      (check the app's data matches what's expected per environment).
- [ ] Retarget `feature/combat-screen-polish` (cut from `main` before `dev` existed)
      so its eventual PR targets `dev`, not `main`.
- [ ] Update `README.md` / onboarding notes to describe the branch model
      (`feature → dev → main`) and point at the `devops-workflow` skill instead of
      requiring re-deriving it each time.
- [ ] Move this plan's files to `docs/plans/devops-setup/archive/` once every
      checkbox above is checked.
