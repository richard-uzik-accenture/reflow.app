import type { SVGProps } from 'react';

/**
 * The reflow mark — "the shift": a ranked list, middle row breaking into a
 * chevron. See branding.md §1. In-app placements invert with theme via
 * --mark-bg/--mark-fg; the standalone app-icon/favicon asset stays fixed.
 */
export function Mark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 118 118" fill="none" {...props}>
      <rect width="118" height="118" rx="26" fill="var(--mark-bg, #171335)" />
      <g transform="translate(18.88, 20.48) scale(0.8024)" fill="var(--mark-fg, #FAF9FB)">
        <rect x="16" y="10" width="64" height="20" rx="10" />
        <path d="M 16 38 H 66 L 76 48 L 66 58 H 16 A 10 10 0 0 1 16 38 Z" />
        <path d="M 72 38 H 84 L 94 48 L 84 58 H 72 L 82 48 Z" />
        <rect x="16" y="66" width="64" height="20" rx="10" />
      </g>
    </svg>
  );
}
