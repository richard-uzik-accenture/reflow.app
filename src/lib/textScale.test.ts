import { describe, expect, it } from 'vitest';
import { scaleTitleStyle, type TextScaleRange } from './textScale';

const ranges: TextScaleRange[] = [
  { maxChars: 10, fontSize: '30px', maxWidth: '20ch' },
  { maxChars: 20, fontSize: '24px', maxWidth: '30ch' },
  { maxChars: Infinity, fontSize: '18px', maxWidth: '90%' },
];

describe('scaleTitleStyle', () => {
  it('returns the shortest-tier values for a short string', () => {
    expect(scaleTitleStyle('short', ranges)).toEqual({ fontSize: '30px', maxWidth: '20ch' });
  });

  it('returns progressively smaller font-size / wider max-width across tier boundaries', () => {
    expect(scaleTitleStyle('a'.repeat(11), ranges)).toEqual({ fontSize: '24px', maxWidth: '30ch' });
    expect(scaleTitleStyle('a'.repeat(21), ranges)).toEqual({ fontSize: '18px', maxWidth: '90%' });
  });

  it('is inclusive at exactly the tier boundary', () => {
    expect(scaleTitleStyle('a'.repeat(10), ranges)).toEqual({ fontSize: '30px', maxWidth: '20ch' });
  });

  it('returns the last tier for very long strings', () => {
    expect(scaleTitleStyle('a'.repeat(500), ranges)).toEqual({ fontSize: '18px', maxWidth: '90%' });
  });

  it('trims whitespace before counting', () => {
    expect(scaleTitleStyle('  short  ', ranges)).toEqual({ fontSize: '30px', maxWidth: '20ch' });
  });

  it('handles an empty string without throwing', () => {
    expect(scaleTitleStyle('', ranges)).toEqual({ fontSize: '30px', maxWidth: '20ch' });
  });
});
