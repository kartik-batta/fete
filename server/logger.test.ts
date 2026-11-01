// @vitest-environment node
import './test/nodeEnv';
import { describe, expect, it } from 'vitest';
import { describeError } from './logger';

describe('describeError', () => {
  it('formats Error instances, strings and unknown values', () => {
    expect(describeError(new TypeError('bad'))).toBe('TypeError: bad');
    expect(describeError('plain')).toBe('plain');
    expect(describeError({ secret: 1 })).toBe('Unknown error');
  });
});
