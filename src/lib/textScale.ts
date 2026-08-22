export interface TextScaleRange {
  /** Inclusive upper bound on character count for this tier. */
  maxChars: number;
  fontSize: string;
  maxWidth: string;
}

export function scaleTitleStyle(text: string, ranges: TextScaleRange[]): { fontSize: string; maxWidth: string } {
  const len = text.trim().length;
  const tier = ranges.find((r) => len <= r.maxChars) ?? ranges[ranges.length - 1];
  return { fontSize: tier.fontSize, maxWidth: tier.maxWidth };
}

export const HEADLINE_SCALE_RANGES: TextScaleRange[] = [
  { maxChars: 24, fontSize: 'clamp(22px, 6vw, 30px)', maxWidth: '26ch' },
  { maxChars: 40, fontSize: 'clamp(19px, 5.2vw, 25px)', maxWidth: '30ch' },
  { maxChars: 64, fontSize: 'clamp(16px, 4.4vw, 21px)', maxWidth: '34ch' },
  { maxChars: Infinity, fontSize: 'clamp(14px, 3.8vw, 18px)', maxWidth: '92%' },
];

export const CARD_TITLE_SCALE_RANGES: TextScaleRange[] = [
  { maxChars: 24, fontSize: 'clamp(23px, 6.2vw, 29px)', maxWidth: '100%' },
  { maxChars: 40, fontSize: 'clamp(19px, 5.4vw, 25px)', maxWidth: '100%' },
  { maxChars: 64, fontSize: 'clamp(16px, 4.6vw, 21px)', maxWidth: '100%' },
  { maxChars: Infinity, fontSize: 'clamp(14px, 4vw, 18px)', maxWidth: '100%' },
];
