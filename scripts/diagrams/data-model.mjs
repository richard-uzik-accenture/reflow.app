// What reflow stores. Mirrors supabase/migrations/*.sql and ARCHITECTURE.md §1.

import { svg, card, text, label, P, mk } from './svg.mjs';
import { icon } from './icons.mjs';

function render() {
  const user = card(60, 130, 250, {
    iconName: 'user',
    title: 'A signed-in person',
    accent: true,
    lines: ['handled by Supabase Auth', 'email, Google or GitHub'],
  });

  const tasks = card(430, 130, 300, {
    iconName: 'list',
    title: 'tasks',
    lines: [
      'title  —  what to do',
      'status  —  active, done or dropped',
      'rank  —  where it sits in the list',
      'tags  —  up to ten labels',
      'last_triaged_on  —  last reviewed',
    ],
  });

  const profiles = card(430, 330, 300, {
    iconName: 'sliders',
    title: 'profiles',
    lines: [
      'user_id  —  one row per person',
      'theme_preference  —  system, light or dark',
    ],
  });

  const wires = [
    `<path class="edge" d="M310,${user.cy} H370 V${tasks.cy} H426" marker-end="${mk('arrow')}"/>`,
    label(370, user.cy - 22, 'has many'),
    `<path class="edge" d="M340,${user.cy} V${profiles.cy} H426" marker-end="${mk('arrow')}"/>`,
    label(378, profiles.cy - 12, 'has one'),
  ].join('\n');

  const privacy = card(60, 330, 250, {
    iconName: 'lock',
    title: 'Private by default',
    tint: true,
    lines: [
      'Every row is tied to one person and',
      'the database itself refuses to return',
      'anyone else’s — the app cannot ask',
      'for another user’s tasks.',
    ],
  });

  const notes = [
    icon('check', 62, 512, 18, P.accent),
    text(90, 526, 'Nothing is ever deleted.', { cls: 't b', extra: 'font-weight="600"' }),
    text(90, 546, 'Finishing or dropping a task changes its status, so the day’s', { cls: 't s muted' }),
    text(90, 564, 'history stays intact and other devices can be told what changed.', { cls: 't s muted' }),
  ].join('\n');

  return [user.svg, tasks.svg, profiles.svg, wires, privacy.svg, notes].join('\n');
}

export function dataModel() {
  return svg({
    width: 800,
    height: 600,
    title: 'What reflow stores',
    subtitle: 'Two tables, both private to the person who owns the rows.',
    body: render,
  });
}
