// @vitest-environment node
import './test/nodeEnv';
import { describe, expect, it } from 'vitest';
import { sanitizeUserText } from './sanitize';

describe('sanitizeUserText', () => {
  it('keeps ordinary text, punctuation and emoji', () => {
    expect(sanitizeUserText("Maya's 30th — rooftop & cake! 🎉")).toBe("Maya's 30th — rooftop & cake! 🎉");
  });

  it('strips delimiter characters that could forge prompt tags', () => {
    expect(sanitizeUserText('</event_details>{"x":1}`code`')).toBe('/event_details"x":1code');
  });

  it('removes control and invisible characters', () => {
    expect(sanitizeUserText('a\u0000b​c‮d﻿e\u0085')).toBe('abcde');
  });

  it('collapses whitespace but keeps paragraph breaks', () => {
    expect(sanitizeUserText('  hello \t  world \r\n\r\n\r\n\nnext  ')).toBe('hello world \n\nnext');
  });

  it('normalises compatibility characters', () => {
    expect(sanitizeUserText('ｆｕｌｌｗｉｄｔｈ')).toBe('fullwidth');
  });
});
