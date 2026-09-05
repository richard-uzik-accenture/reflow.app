// How a change reaches people. Mirrors .claude/skills/devops-workflow/SKILL.md.

import { svg, card, text, rect, P, mk } from './svg.mjs';
import { icon } from './icons.mjs';

/** One environment chip: name, address, and how it gets deployed. */
function envChip(x, y, w, { name, domain, gate, auto }) {
  const h = 92;
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${P.surface}" stroke="${auto ? P.line : P.warn}" stroke-width="1.25"/>`,
    `<text class="t" x="${x + 20}" y="${y + 30}" font-size="14.5" font-weight="600" fill="${P.text}">${name}</text>`,
    `<text class="t mono s" x="${x + 20}" y="${y + 52}" fill="${P.muted}">${domain}</text>`,
    `<rect x="${x + 20}" y="${y + 64}" width="${gate.length * 6.2 + 20}" height="18" rx="9" fill="${auto ? P.accentWash : P.warnWash}"/>`,
    `<text class="t s" x="${x + 30}" y="${y + 77}" fill="${auto ? P.accent : P.warn}" font-weight="600">${gate}</text>`,
  ].join('\n');
}

function render() {
  // ---- Step 1: the branches ----------------------------------------------
  const branches = card(60, 140, 330, {
    iconName: 'branch',
    title: 'Write the code',
    accent: true,
    lines: [
      'feature branch  →  dev  →  main',
      'dev is where things get tried out',
      'only a human may merge into main',
    ],
  });

  // ---- Step 2: the build --------------------------------------------------
  const build = card(60, 330, 330, {
    iconName: 'bolt',
    title: 'Build it once',
    accent: true,
    lines: [
      'GitHub Actions runs on every push to main',
      'It builds the app and hands the result to',
      'Octopus. It never deploys anything itself.',
    ],
  });

  // ---- Step 3: promotion --------------------------------------------------
  const promote = card(60, 540, 330, {
    iconName: 'rocket',
    title: 'Promote that same build',
    accent: true,
    lines: [
      'Octopus moves one build through all three',
      'environments — nothing is ever rebuilt, so',
      'what reaches production is what was tested.',
    ],
  });

  const steps = [
    `<path class="edge" d="M225,278 V326" marker-end="${mk('arrow')}"/>`,
    `<path class="edge" d="M225,468 V536" marker-end="${mk('arrow')}"/>`,
  ].join('\n');

  // ---- The three environments --------------------------------------------
  const ex = 470;
  const envs = [
    text(ex, 132, 'Where it lands', { cls: 't h' }),
    envChip(ex, 148, 340, {
      name: 'DEV',
      domain: 'dev.usereflow.app',
      gate: 'deploys automatically',
      auto: true,
    }),
    envChip(ex, 264, 340, {
      name: 'QUALITY',
      domain: 'quality.usereflow.app',
      gate: 'waits for a person',
      auto: false,
    }),
    envChip(ex, 380, 340, {
      name: 'PRODUCTION',
      domain: 'usereflow.app',
      gate: 'waits for a person',
      auto: false,
    }),

    `<path class="edge" d="M394,${576} H432 V194 H${ex - 4}" marker-end="${mk('arrow')}"/>`,
    `<path class="edge" d="M432,310 H${ex - 4}" marker-end="${mk('arrow')}"/>`,
    `<path class="edge" d="M432,426 H${ex - 4}" marker-end="${mk('arrow')}"/>`,
  ].join('\n');

  const data = [
    rect(ex, 500, 340, 132, { cls: 'box-alt', rx: 14 }),
    icon('database', ex + 20, 518, 20, P.accent),
    text(ex + 50, 534, 'Each environment has its own data', {
      cls: 't b',
      extra: 'font-weight="600"',
    }),
    text(ex + 50, 558, 'DEV and QUALITY share one Supabase project,', { cls: 't s muted' }),
    text(ex + 50, 576, 'kept apart by using a separate schema each.', { cls: 't s muted' }),
    text(ex + 50, 600, 'Production sits in a project of its own, so real', { cls: 't s muted' }),
    text(ex + 50, 618, 'data never shares a home with test data.', { cls: 't s muted' }),
  ].join('\n');

  return [branches.svg, build.svg, promote.svg, steps, envs, data].join('\n');
}

export function deployment() {
  return svg({
    width: 870,
    height: 700,
    title: 'How a change reaches people',
    subtitle: 'Built once, then promoted through three environments — production always ships what was tested.',
    body: render,
  });
}
