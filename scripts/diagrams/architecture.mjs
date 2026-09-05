// How the pieces fit together. Mirrors ARCHITECTURE.md §2–§4.

import { svg, card, text, label, P, mk } from './svg.mjs';
import { icon } from './icons.mjs';

function render() {
  const app = card(60, 140, 320, {
    iconName: 'browser',
    title: 'The app in your browser',
    accent: true,
    lines: [
      'React + TypeScript, built with Vite',
      'Screens: Landing · Sign in · Today',
      'Installable as a phone app (PWA)',
      'Works offline once it has loaded',
    ],
  });

  const supabase = card(490, 140, 320, {
    iconName: 'cloud',
    title: 'Supabase',
    accent: true,
    lines: [
      'Sign-in and accounts',
      'A REST API over the database',
      'A live feed of anything that changes',
    ],
  });

  const db = card(490, 350, 320, {
    iconName: 'database',
    title: 'Postgres',
    lines: ['The tasks and profiles tables', 'Access rules enforced by the database'],
  });

  const hosting = card(60, 350, 320, {
    iconName: 'serverOff',
    title: 'No server of our own',
    tint: true,
    lines: [
      'The browser talks straight to Supabase.',
      'There is no backend to write or run —',
      'the app is static files on Vercel.',
    ],
  });

  const wires = [
    // Requests out.
    `<path class="edge" d="M380,205 H486" marker-end="${mk('arrow')}"/>`,
    label(433, 192, 'asks for and saves'),
    // Live updates back — dashed to distinguish the return path from the request above.
    `<path class="edge-dash" d="M486,250 H380" marker-end="${mk('arrow-muted')}"/>`,
    label(433, 272, 'pushes back changes'),
    // Supabase over the database.
    `<path class="edge" d="M650,286 V346" marker-end="${mk('arrow')}"/>`,
  ].join('\n');

  const notes = [
    icon("bolt", 62, 520, 18, P.accent),
    text(90, 534, 'Changes show up instantly.', { cls: 't b', extra: 'font-weight="600"' }),
    text(90, 554, 'The screen updates the moment you tap, before the save finishes —', { cls: 't s muted' }),
    text(90, 572, 'and quietly puts things back if the save ever fails.', { cls: 't s muted' }),

    icon("phone", 442, 520, 18, P.accent),
    text(470, 534, 'Your devices stay in sync.', { cls: 't b', extra: 'font-weight="600"' }),
    text(470, 554, 'Tick a task off on your phone and the laptop list', { cls: 't s muted' }),
    text(470, 572, 'reorders itself a moment later, with no refresh.', { cls: 't s muted' }),
  ].join('\n');

  return [app.svg, supabase.svg, db.svg, hosting.svg, wires, notes].join('\n');
}

export function architecture() {
  return svg({
    width: 870,
    height: 620,
    title: 'How reflow is put together',
    subtitle: 'A React app in the browser, talking straight to Supabase. Nothing else to run.',
    body: render,
  });
}
