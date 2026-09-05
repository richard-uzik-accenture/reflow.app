// A day in reflow. Mirrors ARCHITECTURE.md §5–§6 and PRODUCT.md.

import { svg, text, rect, P, mk } from './svg.mjs';
import { icon } from './icons.mjs';

/** A numbered step: circled number, icon, title, and a short explanation. */
function step(x, y, w, n, iconName, title, lines) {
  const h = 68 + lines.length * 19;
  return {
    h,
    bottom: y + h,
    svg: [
      `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${P.surface}" stroke="${P.line}" stroke-width="1.25"/>`,
      `<circle cx="${x + 38}" cy="${y + 34}" r="17" fill="${P.accent}"/>`,
      `<text class="t" x="${x + 38}" y="${y + 40}" text-anchor="middle" font-size="15" font-weight="600" fill="${P.onAccent}">${n}</text>`,
      icon(iconName, x + 68, y + 22, 22, P.accent),
      `<text class="t" x="${x + 100}" y="${y + 40}" font-size="15" font-weight="600" fill="${P.text}">${title}</text>`,
      ...lines.map(
        (l, i) =>
          `<text class="t s" x="${x + 68}" y="${y + 68 + i * 19}" fill="${P.muted}">${l}</text>`,
      ),
    ].join('\n'),
  };
}

function render() {
  const x = 60;
  const w = 420;

  const s1 = step(x, 130, w, 1, 'sunrise', 'Start the day', [
    'Anything still open from yesterday comes back,',
    'one card at a time. Keep it or let it go —',
    'nothing is carried over behind your back.',
  ]);

  const s2 = step(x, s1.bottom + 26, w, 2, 'list', 'Empty your head', [
    'Add everything else you are carrying around.',
    'It joins the tasks you just kept, in one list.',
  ]);

  const s3 = step(x, s2.bottom + 26, w, 3, 'swap', 'Rank by comparing', [
    'When something new arrives mid-day, reflow',
    'shows it against one task at a time and asks',
    'which matters more. A few swipes place it.',
  ]);

  const s4 = step(x, s3.bottom + 26, w, 4, 'check', 'Work down the list', [
    'Swipe right to finish, left to drop, drag to',
    'reorder. Whatever is left becomes tomorrow’s',
    'first question.',
  ]);

  const steps = [s1, s2, s3, s4];
  const arrows = steps
    .slice(0, -1)
    .map((s) => `<path class="edge" d="M${x + 38},${s.bottom + 2} V${s.bottom + 22}" marker-end="${mk('arrow')}"/>`)
    .join('\n');

  // The loop back to the top: today's leftovers are tomorrow's first question.
  const loop = [
    `<path class="edge-dash" d="M${x + 38},${s4.bottom} V${s4.bottom + 26} H${x - 22} V164 H${x - 4}" marker-end="${mk('arrow-muted')}"/>`,
    `<text class="t s muted" x="${x - 30}" y="${(164 + s4.bottom) / 2}" transform="rotate(-90 ${x - 30} ${(164 + s4.bottom) / 2})" text-anchor="middle" font-size="11.5" letter-spacing="0.3">the next morning</text>`,
  ].join('\n');

  // ---- Right column: the duel, drawn as what you actually see -------------
  const dx = 540;
  const duel = [
    text(dx, 148, 'What "rank by comparing" looks like', { cls: 't h' }),
    rect(dx, 166, 300, 250, { cls: 'box', rx: 14 }),

    // The new task, called out against the task it's being compared to.
    `<rect x="${dx + 24}" y="${190}" width="252" height="34" rx="10" fill="${P.accentWash}" stroke="${P.accent}" stroke-width="1.25"/>`,
    `<text class="t s" x="${dx + 38}" y="${211}" fill="${P.accent}" font-weight="600">Book the dentist</text>`,
    `<text class="t s" x="${dx + 262}" y="${211}" text-anchor="end" fill="${P.accent}">new</text>`,

    text(dx + 150, 246, 'more important than…', { cls: 't s muted', anchor: 'middle' }),

    `<rect x="${dx + 24}" y="${258}" width="252" height="44" rx="10" fill="${P.surfaceAlt}" stroke="${P.line}" stroke-width="1.25"/>`,
    `<text class="t b" x="${dx + 38}" y="${285}" fill="${P.text}" font-weight="600">Finish the quarterly report</text>`,

    // The two answers.
    `<rect x="${dx + 24}" y="${318}" width="120" height="36" rx="10" fill="${P.surface}" stroke="${P.line}" stroke-width="1.25"/>`,
    `<text class="t s" x="${dx + 84}" y="${341}" text-anchor="middle" fill="${P.text}">← no, lower</text>`,
    `<rect x="${dx + 156}" y="${318}" width="120" height="36" rx="10" fill="${P.surface}" stroke="${P.line}" stroke-width="1.25"/>`,
    `<text class="t s" x="${dx + 216}" y="${341}" text-anchor="middle" fill="${P.text}">yes, higher →</text>`,

    text(dx + 24, 382, 'Each answer halves what is left to check, so even', { cls: 't s muted' }),
    text(dx + 24, 400, 'a long list only takes a handful of swipes.', { cls: 't s muted' }),
  ].join('\n');

  // ---- Right column: why it holds up -------------------------------------
  const why = [
    rect(dx, 448, 300, 176, { cls: 'box-alt', rx: 14 }),
    icon('shield', dx + 24, 468, 20, P.accent),
    text(dx + 54, 484, 'Built for days that go wrong', { cls: 't b', extra: 'font-weight="600"' }),
    text(dx + 24, 512, 'Interruptions are expected, not a failure. The list', { cls: 't s muted' }),
    text(dx + 24, 530, 'does not shame you for what you did not finish —', { cls: 't s muted' }),
    text(dx + 24, 548, 'it just asks again tomorrow, once.', { cls: 't s muted' }),
    text(dx + 24, 576, 'There is no scheduling, no calendar and no', { cls: 't s muted' }),
    text(dx + 24, 594, 'streaks to break. One ranked list, every day.', { cls: 't s muted' }),
  ].join('\n');

  return [...steps.map((s) => s.svg), arrows, loop, duel, why].join('\n');
}

export function userFlow() {
  return svg({
    width: 900,
    height: 780,
    title: 'A day in reflow',
    subtitle: 'Triage what is left over, add what is new, then rank by comparing rather than by guessing.',
    body: render,
  });
}
