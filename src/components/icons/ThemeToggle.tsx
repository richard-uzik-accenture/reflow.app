import type { SVGProps } from 'react';

/** Sun/moon toggle glyph — built from the icon system's circle + bar atoms (branding.md §5). */
export function ThemeToggle({ isDark, ...props }: SVGProps<SVGSVGElement> & { isDark: boolean }) {
  if (isDark) {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
        <path
          d="M20 13.5A8.25 8.25 0 1 1 10.5 4a6.75 6.75 0 0 0 9.5 9.5Z"
          stroke="currentColor"
          strokeWidth={1.75}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <circle cx="12" cy="12" r="4.5" stroke="currentColor" strokeWidth={1.75} />
      <path
        d="M12 3 L12 5.5 M12 18.5 L12 21 M21 12 L18.5 12 M5.5 12 L3 12 M18.36 5.64 L16.6 7.4 M7.4 16.6 L5.64 18.36 M18.36 18.36 L16.6 16.6 M7.4 7.4 L5.64 5.64"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}
