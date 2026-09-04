# Backlog

Open ideas and unresolved polish items not yet turned into a phase plan. When one of these
becomes real scoped work, promote it into its own `docs/plans/<name>/` folder per CLAUDE.md §5
and remove it from this list — don't track it in both places.

## Open features

- [ ] Dynamic tag filter: derive clickable filter chips from tasks' active tags, animate them in;
      needs a matching filter icon (see `src/components/icons/`)
- [ ] Reposition tags in `TaskRow` to float on the right side instead of stacking under the title

## Verification / spot-checks (likely already fine, unconfirmed)

- [ ] Confirm toast display duration (currently 4375ms success / 6250ms error in `useToast.ts`)
      feels long enough in real use — raised once as "disappears too fast," never re-confirmed
      after the toast system was built
- [ ] Spot-check tag-chip contrast in dark theme (tokens are theme-aware; rendered contrast
      unverified)

## Open product question (not a scoped task)

- The multi-list brainstorm (`docs/plans/multi-list/00-brainstorm.md`) has 6 unresolved open
  questions blocking any implementation start — see that file directly, don't duplicate its
  questions here.
