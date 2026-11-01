import { describe, expect, it } from 'vitest';
import { isValidEmail, isValidHex, parseAmount, sanitizeText, toSafeHttpUrl } from './form';

describe('form helpers', () => {
  it('sanitizeText trims, strips control characters and clamps length', () => {
    expect(sanitizeText('  hi\u0000 there\u0007  ')).toBe('hi there');
    expect(sanitizeText('abcdef', 3)).toBe('abc');
    expect(sanitizeText(undefined)).toBe('');
  });

  it('toSafeHttpUrl only allows http(s) and adds a scheme when missing', () => {
    expect(toSafeHttpUrl('example.com/menu')).toBe('https://example.com/menu');
    expect(toSafeHttpUrl('http://a.test')).toBe('http://a.test/');
    expect(toSafeHttpUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeHttpUrl('data:text/html,hi')).toBeNull();
    expect(toSafeHttpUrl('')).toBeNull();
  });

  it('parseAmount accepts cents and rejects negatives / huge / junk', () => {
    expect(parseAmount('12.345')).toBe(12.35);
    expect(parseAmount('')).toBe(0);
    expect(parseAmount('-1')).toBeNull();
    expect(parseAmount('1e12')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
  });

  it('validates emails and hex colours', () => {
    expect(isValidEmail('a@b.co')).toBe(true);
    expect(isValidEmail('nope')).toBe(false);
    expect(isValidHex('#FFcad4')).toBe(true);
    expect(isValidHex('red')).toBe(false);
  });
});
