// Tiny SVG builder shared by the diagram generators. No dependencies — these are
// string templates, not a drawing library.
//
// These are technical reference diagrams, not brand surfaces: the palette below
// is a plain slate-neutral + accent scheme chosen for legibility, independent of
// branding.md. Don't reach for the app's brand colors here — the goal is a
// diagram that reads clearly on its own, the way a systems-docs diagram would.

import { icon } from './icons.mjs';

export const C = {
  slate950: '#0B1120',
  slate800: '#1E293B',
  slate600: '#475569',
  slate400: '#94A3B8',
  slate300: '#CBD5E1',
  slate200: '#E2E8F0',
  slate100: '#F1F5F9',
  slate50: '#F8FAFC',
  white: '#FFFFFF',
  blue600: '#2563EB',
  blue400: '#60A5FA',
  blueWash: '#DBEAFE',
  amber600: '#D97706',
  amber400: '#FBBF24',
  amberWash: '#FEF3C7',
};

// Light and dark role palettes: neutral slate for structure, one blue accent for
// emphasis and primary flow, one amber accent reserved for gates/callouts only.
const LIGHT = {
  bg: C.slate50,
  surface: C.white,
  surfaceAlt: C.slate100,
  line: C.slate200,
  text: C.slate950,
  muted: C.slate600,
  accent: C.blue600,
  accentSoft: C.slate400,
  accentWash: C.blueWash,
  warn: C.amber600,
  warnWash: C.amberWash,
  onAccent: C.white,
};

const DARK = {
  bg: '#0A0F1C',
  surface: C.slate800,
  surfaceAlt: '#152033',
  line: '#2E3B4E',
  text: C.slate100,
  muted: C.slate400,
  accent: C.blue400,
  accentSoft: '#5B6B84',
  accentWash: '#1E2E47',
  warn: C.amber400,
  warnWash: '#3D2E10',
  onAccent: C.slate950,
};

// The active palette while a diagram is being built. Diagram modules read
// `P.text` etc. rather than hardcoding hex, and `svg()` renders each diagram
// twice — once per palette — layering the dark copy on top behind a
// prefers-color-scheme media query.
export let P = LIGHT;

// Colors are emitted as literal hex, not CSS custom properties: rasterizers
// (librsvg, resvg, and most SVG-to-PNG paths) don't resolve var() at all, and
// an <img>-embedded SVG can't inherit variables from the host page either.
// prefers-color-scheme inside the SVG *is* honored by browsers, so theme
// switching happens by showing/hiding whole layers instead.
// Rules are prefixed with the layer's own class, since both layers live in one
// document and share class names — unscoped, the second <style> block would
// repaint the first layer's text in the wrong palette.
function baseStyle(p, suffix) {
  const g = `.layer-${suffix}`;
  return `
  ${g} .t { font-family: -apple-system, 'Segoe UI', system-ui, sans-serif; fill: ${p.text}; }
  ${g} .mono { font-family: ui-monospace, 'Cascadia Mono', 'Consolas', monospace; }
  ${g} .muted { fill: ${p.muted}; }
  ${g} .title { font-size: 21px; font-weight: 600; letter-spacing: -0.3px; }
  ${g} .subtitle { font-size: 12.5px; fill: ${p.muted}; }
  ${g} .h { font-size: 13.5px; font-weight: 600; }
  ${g} .b { font-size: 12px; }
  ${g} .s { font-size: 10.5px; }
  ${g} .box { fill: ${p.surface}; stroke: ${p.line}; stroke-width: 1.25; }
  ${g} .box-alt { fill: ${p.surfaceAlt}; stroke: ${p.line}; stroke-width: 1.25; }
  ${g} .group { fill: none; stroke: ${p.accentSoft}; stroke-width: 1.25; stroke-dasharray: 5 4; opacity: 0.75; }
  ${g} .edge { fill: none; stroke: ${p.accentSoft}; stroke-width: 1.5; }
  ${g} .edge-accent { fill: none; stroke: ${p.accent}; stroke-width: 1.75; }
  ${g} .edge-dash { fill: none; stroke: ${p.muted}; stroke-width: 1.25; stroke-dasharray: 4 4; }
`;
}

// `ns` is the id suffix for the layer currently being rendered, so the light and
// dark copies never collide on marker/clipPath ids.
export let ns = 'l';

function defs(p, suffix) {
  return `<defs>
  <marker id="arrow-${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${p.accentSoft}"/>
  </marker>
  <marker id="arrow-accent-${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${p.accent}"/>
  </marker>
  <marker id="arrow-muted-${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6.5" markerHeight="6.5" orient="auto-start-reverse">
    <path d="M0,0 L10,5 L0,10 z" fill="${p.muted}"/>
  </marker>
  <marker id="crowsfoot-${suffix}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="11" markerHeight="11" orient="auto">
    <path d="M10,0 L0,5 L10,10 M10,5 L0,5" fill="none" stroke="${p.accentSoft}" stroke-width="1.4"/>
  </marker>
</defs>`;
}

/**
 * `body` is a function, not a string — it is called once per palette with `P`
 * and `ns` already swapped, so each layer picks up its own colors and ids.
 */
export function svg({ width, height, title, subtitle, body }) {
  // The dark layer carries display="none" as a presentation *attribute*, not
  // just a CSS rule: static rasterizers (librsvg, resvg) ignore the stylesheet
  // and would otherwise paint the dark copy straight over the light one. The
  // media query below overrides the attribute in browsers, which do cascade.
  const layer = (p, suffix, hidden) => {
    P = p;
    ns = suffix;
    const content = body();
    return `<g class="layer-${suffix}"${hidden ? ' display="none"' : ''}>
<style>${baseStyle(p, suffix)}</style>
${defs(p, suffix)}
<rect width="${width}" height="${height}" fill="${p.bg}"/>
<text class="t title" x="32" y="42">${esc(title)}</text>
${subtitle ? `<text class="t subtitle" x="32" y="63">${esc(subtitle)}</text>` : ''}
${content}
</g>`;
  };

  const light = layer(LIGHT, 'l', false);
  const dark = layer(DARK, 'd', true);
  P = LIGHT;
  ns = 'l';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}">
<title>${esc(title)}</title>
<style>
  @media (prefers-color-scheme: dark) {
    .layer-l { display: none; }
    .layer-d { display: inline !important; }
  }
</style>
${light}
${dark}
</svg>
`;
}

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function rect(x, y, w, h, { cls = 'box', rx = 10, extra = '' } = {}) {
  return `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${extra}/>`;
}

export function text(x, y, str, { cls = 't b', anchor = 'start', extra = '' } = {}) {
  return `<text class="${cls}" x="${x}" y="${y}" text-anchor="${anchor}" ${extra}>${esc(str)}</text>`;
}

// Arrow-marker reference for the layer currently being rendered.
export function mk(marker) {
  return `url(#${marker}-${ns})`;
}

/**
 * A labelled card: bold title, optional muted sub-line(s) beneath it.
 * `sub` may be a string or an array of lines.
 */
export function node(x, y, w, h, title, sub, { cls = 'box', accentBar = false } = {}) {
  const lines = sub == null || sub === '' ? [] : Array.isArray(sub) ? sub : [sub];
  const parts = [rect(x, y, w, h, { cls, rx: 9 })];
  if (accentBar) {
    parts.push(`<rect x="${x}" y="${y + 6}" width="3.5" height="${h - 12}" rx="1.75" fill="${P.warn}"/>`);
  }
  const titleY = lines.length ? y + h / 2 - 4 - (lines.length - 1) * 6 : y + h / 2 + 4;
  parts.push(
    `<text class="t b" x="${x + w / 2}" y="${titleY}" text-anchor="middle" font-weight="600" fill="${P.text}">${esc(title)}</text>`,
  );
  lines.forEach((l, i) => {
    parts.push(
      `<text class="t s" x="${x + w / 2}" y="${titleY + 15 + i * 13}" text-anchor="middle" fill="${P.muted}">${esc(l)}</text>`,
    );
  });
  return parts.join('\n');
}

/**
 * The diagrams' main building block: a soft card with an icon badge, a title,
 * and any number of muted detail lines. Returns its own height so callers can
 * stack cards without hand-counting pixels.
 */
export function card(x, y, w, { iconName, title, lines = [], accent = false, tint = false }) {
  const padX = 20;
  const headH = 54;
  const h = headH + (lines.length ? lines.length * 19 + 14 : 0);
  const badge = accent ? P.accent : P.accentWash;
  const glyph = accent ? P.onAccent : P.accent;

  const parts = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="${tint ? P.surfaceAlt : P.surface}" stroke="${P.line}" stroke-width="1.25"/>`,
    `<rect x="${x + padX}" y="${y + 15}" width="26" height="26" rx="8" fill="${badge}"/>`,
    icon(iconName, x + padX + 5, y + 20, 16, glyph),
    `<text class="t" x="${x + padX + 38}" y="${y + 33}" font-size="14.5" font-weight="600" fill="${P.text}">${esc(title)}</text>`,
  ];

  lines.forEach((l, i) => {
    parts.push(
      `<text class="t s" x="${x + padX + 38}" y="${y + headH + 8 + i * 19}" fill="${P.muted}">${esc(l)}</text>`,
    );
  });

  return { svg: parts.join('\n'), h, bottom: y + h, right: x + w, cx: x + w / 2, cy: y + h / 2 };
}

/** Dashed container with its title notched into the top edge. */
export function groupBox(x, y, w, h, title) {
  return [
    rect(x, y, w, h, { cls: 'group', rx: 14 }),
    `<rect x="${x + 14}" y="${y - 9}" width="${title.length * 6.1 + 16}" height="18" rx="9" fill="${P.bg}"/>`,
    `<text class="t s" x="${x + 22}" y="${y + 4}" font-weight="600" fill="${P.accentSoft}">${esc(title)}</text>`,
  ].join('\n');
}

// Orthogonal connector between two points, elbowing at the midpoint on `axis`.
export function elbow(x1, y1, x2, y2, { axis = 'h', cls = 'edge', marker = 'arrow' } = {}) {
  const d =
    axis === 'h'
      ? `M${x1},${y1} H${(x1 + x2) / 2} V${y2} H${x2}`
      : `M${x1},${y1} V${(y1 + y2) / 2} H${x2} V${y2}`;
  return `<path class="${cls}" d="${d}" marker-end="${mk(marker)}"/>`;
}

export function line(x1, y1, x2, y2, { cls = 'edge', marker = 'arrow' } = {}) {
  return `<path class="${cls}" d="M${x1},${y1} L${x2},${y2}"${marker ? ` marker-end="${mk(marker)}"` : ''}/>`;
}

// Small pill label, typically dropped on top of an edge to name it. The opaque
// backing rect is what lets a label sit directly on a connector.
export function label(x, y, str, { cls = 't s muted', anchor = 'middle', pad = 5 } = {}) {
  const w = str.length * 5.6 + pad * 2;
  return `<g><rect x="${x - w / 2}" y="${y - 9}" width="${w}" height="15" rx="7.5" fill="${P.bg}"/>${text(
    x,
    y + 2,
    str,
    { cls, anchor },
  )}</g>`;
}
