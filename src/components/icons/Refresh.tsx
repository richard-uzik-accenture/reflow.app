import type { SVGProps } from 'react';

export function Refresh(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M20 8s-2.5-4.5-8-4.5a8.5 8.5 0 1 0 8.5 8.5"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points="20,3 20,8 15,8"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
