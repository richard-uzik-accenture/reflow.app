import type { SVGProps } from 'react';

export function Refresh(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" {...props}>
      <path
        d="M18.75 12a6.75 6.75 0 1 1-2.1-4.9M18.75 5.25v3.75H15"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
