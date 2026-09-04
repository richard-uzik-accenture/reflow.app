# Phase 4 — Octopus Deploy setup

**The full pipeline is built, tested, and has been used for a real production
deployment.** GitHub Actions builds and packages on every push to `main`, creates
a matching-numbered Octopus release, `dev` genuinely auto-deploys (verified — see
"Lifecycle auto-deploy" below, this was NOT true earlier in the session and had to
be fixed), `preprod`/`prod` require manual trigger + approval, and a real release
has been approved through all three environments — `usereflow.app` confirmed live
serving that build.

**One real open problem, stop-here-and-resume-next-session**: the Pushcut
notification that fires after `dev` finishes deploying links to Octopus's generic
Tasks page, but by the time you tap it (after `dev` has already finished), there's
nothing on that page for you to act on — you still have to navigate yourself to
Releases to find the release and manually deploy it to `preprod`. The static Tasks
link only made sense for the *old* notification design (which fired ON the approval
gate, when something really was pending on Tasks) — it doesn't fit the *new* design
(which fires on stage-completion, prompting "go start the next stage"). See "Open
problem: dev/preprod-success notification links to the wrong page" below — this is
where to resume.

## Deliverables

- [x] Provisioned Octopus Cloud (free Starter tier).
- [x] Created environments, in order: `dev`, `preprod`, `prod`.
- [x] **Lifecycle auto-deploy (added later, this was a real gap)**: originally left
      the built-in "Default Lifecycle" fully unmodified, believing its "default
      conventions" (ordering-only, no explicit phases) meant `dev` auto-deployed
      since it had no approval gate. **This was wrong** — confirmed via Octopus's
      own docs that "default conventions" only enforces *order*, not automatic
      deployment; every `dev` deploy up to that point had actually been manually
      triggered by clicking "Deploy to dev," same mechanism as preprod/prod, just
      without the approval step in front. Fixed by adding **explicit phases** to
      the Default Lifecycle: `Dev` (environment `dev`, auto-deploy lightning-bolt
      **on** — this is the default when adding an environment to a phase, nothing
      extra to toggle), `Preprod` (environment `preprod`, auto-deploy **off** —
      deliberately, see below), `Prod` (environment `prod`, auto-deploy **off**).
      Verified for real: pushed to `main`, did nothing manually, watched `dev`
      deploy itself.
      **Preprod/Prod auto-deploy deliberately NOT enabled**, even though Octopus
      supports chaining it (a phase can auto-deploy the moment the release enters
      it, i.e. the moment the prior phase succeeds) — user's own reasoning: if
      preprod auto-started on every dev success and approval wasn't prompt, stuck
      releases could pile up waiting on approval with no easy bulk-cancel (see
      "Task hygiene" note below). Preferred model: each stage's completion just
      *notifies*, human explicitly triggers the next stage themselves. This is a
      deliberate product decision, not a fallback — don't revisit without asking.
- [x] Created the Octopus project **`reflow`**.
- [x] Project variables: `VercelToken`, `VercelOrgId`, `VercelProjectId`,
      `SupabaseUrl`, `SupabaseAnonKey`, `SupabaseSchema` — one name per variable,
      environment-scoped rows.
- [x] Generated an Octopus API key for GitHub Actions.
- [x] `Deploy to Vercel` step (step 2 in the process): Run a Script, Bash, "Run once
      on a worker", Referenced Package `reflow`. Installs Node via `nvm` (worker has
      no root/sudo), then runs `vercel deploy --prebuilt`:
      ```bash
      set -euo pipefail

      echo "Deploying package to Vercel project #{VercelProjectId} (environment: #{Octopus.Environment.Name})"

      if ! command -v npx >/dev/null 2>&1; then
        echo "Node.js not found on worker, installing via nvm (no root needed)..."
        export NVM_DIR="$HOME/.nvm"
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.6/install.sh | bash
        [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
        nvm install 20
        nvm use 20
      fi

      PACKAGE_DIR="#{Octopus.Action.Package[reflow].ExtractedPath}"
      cd "$PACKAGE_DIR"

      mkdir -p .vercel
      cat > .vercel/project.json <<EOF
      {
        "projectId": "#{VercelProjectId}",
        "orgId": "#{VercelOrgId}"
      }
      EOF

      npx --yes vercel deploy --prebuilt --prod --token="#{VercelToken}" --yes
      ```
- [x] Root-caused and fixed the `invalid API key` login bug — see "Env var fix"
      below. Unmarked Sensitive on **all three** Vercel projects (DEV, QUALITY,
      PROD), not just DEV.
- [x] **Manual Intervention approval gate** — step 1 in the process, runs *before*
      `Deploy to Vercel`:
      - Step type: Manual Intervention, name `Approve Deployment`.
      - Instructions text: "Review this release before promoting it to
        #{Octopus.Environment.Name}. Confirm the deployment to the previous
        environment looked correct before approving."
      - Scoped via Configure features → Environments → "Run only for specific
        environments" → `preprod` + `prod` (not `dev`, which stays automatic).
      - **Responsible Teams: "Space Managers"**, not "Octopus Administrators" — the
        account that created this Octopus Cloud instance is a Space Manager but
        is *not* automatically a member of Octopus Administrators, and lacks the
        `AdministerSystem` permission needed to add itself to that team. If
        approvals ever get stuck on "must be assigned" with no way to assign,
        check which team the step is actually scoped to and confirm your user is
        really a member of it — don't assume instance-owner implies
        Administrators membership.
      - New steps append to the *end* of the process by default — this step had
        to be manually reordered to run first. If Octopus's UI doesn't offer
        drag-and-drop, look for a per-step reorder control (varies by version).
- [x] **Verified working, for real**: deployed a release through `dev` (auto) →
      `preprod` (approved, gate correctly paused first) → `prod` (approved).
      `usereflow.app` confirmed serving that exact release.
- [x] **Version traceability**: package version, Octopus `release_number`, and an
      in-app badge all driven by the same `0.0.${{ github.run_number }}` value from
      the GitHub Actions workflow (see `.github/workflows/release.yml`), plus the
      short commit SHA. A device's live site directly shows e.g. `v0.0.16 ·
      afb799e`, traceable to both the exact Octopus release and GitHub commit
      without opening Octopus. Versioning is deliberately manual for the middle
      number — stays `0.0.x` incrementing forever unless the user explicitly asks
      to bump to `0.1.0` for a real milestone; nothing auto-bumps it.
- [~] **Outside-web-UI notification — built, working, but linking to the wrong
      page (open problem, see below).** iPhone push via Octopus Subscription →
      Pushcut webhook.
      - **Design evolved during this session** — worth understanding both the
        original and current shape, since the doc/git history references the
        original:
        - *Original design*: fire on **"Manual intervention interruption
          raised"**, scoped to `preprod`+`prod`. This meant the notification
          only ever arrived *after* you'd already manually clicked "Deploy to
          preprod/prod" yourself — not useful as a prompt, just a confirmation
          of something you'd already done.
        - *Current design (what's live now)*: fire on **"Deployment succeeded"**
          (found via the event-category search box — "Deployment succeeded" is
          the general one; don't confuse with the narrower "Auto-deploy trigger
          succeeded"), scoped to environments `dev` + `preprod` (not `prod`,
          which has no "next stage" to prompt toward). This fires the moment
          `dev` finishes (auto-deployed) or `preprod` finishes (after you
          approved it), prompting you to go trigger the *next* stage.
        - Rationale for NOT auto-deploying preprod/prod and instead using
          completion-notifications: avoids stuck-releases piling up on the
          approval gate if you're not prompt — see lifecycle note above.
        - Same Octopus Subscription object was edited in place (not a new one) —
          Projects = `reflow`, same Pushcut webhook Payload URL, same 10s
          timeout, no team-scope restriction.
      - Pushcut: one notification, one Action of type **URL** (not Shortcut),
        currently pointing at `https://reflow.octopus.app/app#/Spaces-1/tasks`
        — **this is the part that's now wrong, see "Open problem" below**. Set
        as the notification's default action so a plain tap opens it.
      - **True one-tap approve (skip the extra tap into Octopus) was investigated
        and deliberately not built** — two real blockers, not just extra effort:
        (1) approving an Octopus interruption is 3 chained API calls (`GET
        interruptions?regardingDocumentId=...` → `PUT .../responsible` → `PUT
        .../submit`), where calls 2/3 need an ID returned by call 1 — Pushcut's
        single URL action can only fire one fixed request, it cannot chain calls
        or parse a response to feed the next one; (2) even a single authenticated
        call would require storing a real Octopus API key inside Pushcut's action
        config, which has no secret-storage mechanism — the key would sit in
        plaintext, readable via iCloud/device access, a meaningfully weaker
        security posture than every other credential handled this session (all
        of which live in GitHub/Octopus/Vercel's own scoped secret stores).
        Revisit only if a small hosted middle-man (e.g. a free-tier serverless
        function holding the API key, doing the 3-call chain, exposed as one
        simple endpoint Pushcut can hit) becomes worth the added
        infrastructure — not needed for now.
      - Dynamic deep-linking straight to the specific pending deployment (instead
        of the general Tasks list) was also investigated: Octopus's webhook
        payload does contain what's needed (`Payload.Event.RelatedDocumentIds`
        has the `Deployments-N` id; `ServerUri` + `Spaces-1` + that id builds
        `https://reflow.octopus.app/app#/Spaces-1/deployments/Deployments-N`,
        confirmed by inspecting a real captured payload via webhook.site). Not
        wired up: Pushcut's URL action only accepts a static URL, no placeholder
        substitution from the incoming webhook JSON — only its **Shortcut**
        action type can consume dynamic `input`, which would need both a
        hand-built iOS Shortcut and the same hosted middle-man (to reshape
        Octopus's nested payload into Pushcut's flat `{input/title/text}`
        format). Not worth the infrastructure for saving one tap — static Tasks
        link accepted instead.

## Open problem: dev/preprod-success notification links to the wrong page

**This is where to resume next session.**

The notification now correctly fires when `dev` or `preprod` *finishes*
successfully (see "Outside-web-UI notification" above). But its Action still
points at Octopus's generic Tasks page — which was the right target for the
*old* design (fires when something's actively pending on that page) and is the
*wrong* target for the *new* design (fires on completion, when there's nothing
pending yet — you still have to self-navigate to Releases, find the release, and
click deploy on the next environment). Confirmed broken by the user testing it
for real after the `dev`-completion notification fired.

**What the notification should actually do**: land you directly on a page where
triggering the next stage is one click away — ideally the specific release's
page (e.g. `.../releases/Releases-21`), which has a "Deploy to preprod"/"Deploy
to prod" button right there, or at minimum the project's Releases list filtered/
sorted so the newest release is immediately visible.

**Relevant groundwork already done** (see "Dynamic deep-linking" note above,
originally investigated for a different purpose but directly applicable here):
- Octopus's webhook payload for an event **does** contain a real,
  usable link: `Payload.Event.RelatedDocumentIds` includes a `Releases-N` id
  (confirmed present in a real captured payload, alongside `Deployments-N`,
  `Projects-1`, etc.) — `Payload.ServerUri` + `/app#/Spaces-1/releases/` +
  that id should build a working direct link to the release page.
- The blocker found before was **Pushcut's URL action only accepts a static
  URL** — it can't substitute a dynamic value from the incoming webhook JSON
  into that field. Only Pushcut's **Shortcut** action type consumes dynamic
  `input`, and even that needs the payload reshaped into Pushcut's flat
  `{input/title/text}` format first (Octopus's payload is deeply nested), which
  in turn needs a small hosted middle-man (e.g. a free serverless function)
  to do that reshaping — infrastructure explicitly avoided so far this session.

**Options to evaluate next session, roughly cheapest to most involved:**
1. **Static link to the project's Releases list instead of Tasks** — e.g.
   `https://reflow.octopus.app/app#/Spaces-1/projects/reflow/deployments`
   (verify exact path once back in session) sorted newest-first. Same
   "one extra tap to find the right release" tradeoff as before, but at least
   points somewhere relevant instead of an empty Tasks page. Zero new
   infrastructure, ~2 minute fix.
2. **Two separate Pushcut notifications** (one for "dev done, go to preprod"
   with a link that's *closer* to right since preprod's deploy action is
   reachable from a predictable place, one for "preprod done, go to prod") —
   doesn't solve the dynamic-release-id problem, just narrows the static
   options slightly. Marginal improvement, probably not worth the extra
   Octopus subscription/Pushcut notification to maintain two of them.
3. **Real dynamic deep link** — build the small hosted middle-man (hold no
   secrets this time, since it's just reshaping a public-ish payload, not
   approving anything) that receives Octopus's real webhook payload, extracts
   `Releases-N`, and re-POSTs to Pushcut in the `{input: releaseId, title,
   text}` shape Pushcut expects; Pushcut notification's Shortcut action (or
   a URL action using `{{input}}` in the Action URL, if Pushcut's Shortcut
   action can pass input through to a URL open — verify this) builds the
   final link. Solves it properly, but is the exact infrastructure commitment
   this session repeatedly chose to avoid for a one-tap-approve feature — the
   calculus might be different here since it's a genuinely recurring paper cut
   (every single stage transition) rather than a one-time nice-to-have.

Recommend starting with option 1 (cheap, immediate improvement) and only
pursuing option 3 if the extra tap-to-find-the-release genuinely proves
annoying in practice after a week of real use.

## Env var fix — Vercel "Sensitive" flag breaks CLI-driven builds

`dev.usereflow.app` returned `invalid API key` on login after a successful-looking
deploy. Root cause: `VITE_SUPABASE_ANON_KEY` was marked **"Sensitive"** in Vercel.
Per Vercel's docs, Sensitive values are only guaranteed readable "within the Vercel
build container" — QUALITY/PROD were unaffected at the time because their live
deployments were built by Vercel's own git integration (before it was disabled),
which has that access; DEV's build runs via `vercel build` inside GitHub Actions
with a bare `--token`, which could not decrypt the Sensitive value and silently
substituted the literal string `[SENSITIVE]` instead of failing loudly. Confirmed
at the byte level by fetching the live built JS bundle directly via Playwright.

Not a security regression: the Supabase anon/publishable key is designed to be
public (ships in client JS on every Supabase app); real access control is RLS
policies (`auth.uid() = user_id` on `tasks`), not hiding this key. Confirmed with
the user before unmarking. Fixed on all three Vercel projects.

## Task hygiene — no auto-timeout, no bulk-cancel

Learned this session, worth keeping in mind: an Octopus manual intervention does
**not** auto-cancel after inactivity — it sits open indefinitely until someone
approves/rejects/cancels it. There's also **no native bulk-cancel** in the UI
(only one-at-a-time, or scripting the REST API's cancel-queued-deployments
pattern). Octopus Cloud has a limited number of concurrent task slots; enough
abandoned stuck deployments can genuinely exhaust that cap and block new ones
from starting. Checked at end of this session: **zero stuck tasks currently** —
but going forward, explicitly cancel any test deploy you're not going to finish
rather than just navigating away from it.

## Pre-launch follow-up (not part of devops-setup, don't lose this)

Before real users/payments go live, do a focused RLS/security audit: confirm every
table in `supabase/migrations/` has RLS enabled with policies correctly scoping
every operation (select/insert/update/delete) to the authenticated user, not just
`tasks`. Deliberately deferred to keep focus on finishing the deploy pipeline.

## Notes

- Keep the deploy step generic enough that it doesn't need to know *which*
  environment it's running in beyond reading Octopus's scoped variables — the same
  step definition runs for dev/preprod/prod, just with different variable values.
- Don't build the Phase 2 "daily preprod reload from prod" as an Octopus runbook in
  this phase — out of scope per Phase 2's notes.
- Full debugging history (sudo/root dead-ends, the `.vercel/output` packaging bug,
  the release-snapshot gotcha, the Sensitive-var bug, the version-sync fix) is
  preserved in git history on this file and in `.github/workflows/release.yml`'s
  commit messages.
