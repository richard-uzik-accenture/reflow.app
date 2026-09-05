// Stroke icons for the diagrams, drawn on the same 24px grid at the same
// 1.75px weight as src/components/icons/ — see branding.md §5. Each entry is
// just the path data; `icon()` wraps it with the shared stroke attributes.

const PATHS = {
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21a8 8 0 0 1 16 0',
  list: 'M4 7h16 M4 12h16 M4 17h10',
  database: 'M12 7c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3Z M4 4v16c0 1.7 3.6 3 8 3s8-1.3 8-3V4 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  browser: 'M3 5h18v14H3z M3 9h18 M6 7h.01 M9 7h.01',
  cloud: 'M7 19a4 4 0 0 1 0-8 6 6 0 0 1 11.3 2A3.5 3.5 0 0 1 17.5 19H7Z',
  lock: 'M6 11h12v9H6z M9 11V8a3 3 0 0 1 6 0v3',
  bolt: 'M13 3 5 14h6l-1 7 8-11h-6l1-7Z',
  branch: 'M6 4v10 M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M6 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M18 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M18 10v2a4 4 0 0 1-4 4H6',
  rocket: 'M12 3c3 2 5 5.5 5 9.5l-2.5 2.5h-5L7 12.5C7 8.5 9 5 12 3Z M9.5 15 8 20l3-1.5 3 1.5-1.5-5 M12 10h.01',
  check: 'M5 13l5 5 9-11',
  sunrise: 'M12 3v3 M5.5 8.5 7.6 10.6 M18.5 8.5 16.4 10.6 M3 17h18 M8 17a4 4 0 0 1 8 0 M6 21h12',
  swap: 'M4 8h12 M13 5l3 3-3 3 M20 16H8 M11 13l-3 3 3 3',
  phone: 'M8 3h8a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z M11 18h2',
  tag: 'M3 12V4h8l10 10-8 8L3 12Z M7.5 7.5h.01',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5l3 2',
  arrowDown: 'M12 4v16 M6 14l6 6 6-6',
  shield: 'M12 3l8 3v6c0 5-3.4 8.3-8 10-4.6-1.7-8-5-8-10V6l8-3Z',
  serverOff: 'M4 4h11 M4 4v6h16V6.5 M4 14h7 M4 14v6h9v-3.5 M3 3l18 18',
  sliders: 'M4 6h9 M17 6h3 M4 12h3 M11 12h9 M4 18h13 M21 18h-1 M17 4v4 M7 10v4 M15 16v4',
};

/**
 * Renders one icon at `size` px, top-left anchored at (x, y).
 * `color` is a literal hex — these are drawn into a palette-swapped layer.
 * Stroke width is pre-divided by the scale factor so the drawn weight stays
 * 1.75px however large the icon is rendered.
 */
export function icon(name, x, y, size, color, { width = 1.75 } = {}) {
  const d = PATHS[name];
  if (!d) throw new Error(`unknown icon: ${name}`);
  const s = size / 24;
  return `<g transform="translate(${x},${y}) scale(${s})" fill="none" stroke="${color}" stroke-width="${(width / s).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round"><path d="${d}"/></g>`;
}
