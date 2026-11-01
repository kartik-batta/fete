// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { silentLogger } from '../logger';
import { mockGenerator } from '../test/helpers';
import { generateWithFallback, safeJsonParse, TimeoutError, withTimeout } from './generate';

describe('withTimeout', () => {
  it('resolves when the task finishes in time', async () => {
    await expect(withTimeout(async () => 'ok', 100)).resolves.toBe('ok');
  });

  it('rejects with TimeoutError and aborts the signal', async () => {
    let captured: AbortSignal | undefined;
    const pending = withTimeout((signal) => {
      captured = signal;
      return new Promise<never>(() => undefined);
    }, 10);
    await expect(pending).rejects.toBeInstanceOf(TimeoutError);
    expect(captured?.aborted).toBe(true);
  });

  it('propagates task errors', async () => {
    await expect(withTimeout(async () => Promise.reject(new Error('nope')), 100)).rejects.toThrow('nope');
  });
});

describe('safeJsonParse', () => {
  it.each([[undefined], [''], ['not json'], ['{"a":']])('returns undefined for %o', (text) => {
    expect(safeJsonParse(text)).toBeUndefined();
  });

  it('parses valid JSON', () => {
    expect(safeJsonParse('{"a":[1]}')).toEqual({ a: [1] });
  });
});

describe('generateWithFallback', () => {
  const base = {
    label: 'test',
    systemInstruction: 'sys',
    prompt: 'prompt',
    responseSchema: {},
    outputSchema: z.object({ value: z.number() }),
    fallback: () => ({ value: 0 }),
    timeoutMs: 100,
    logger: silentLogger,
  };

  it('uses the fallback when there is no generator', async () => {
    await expect(generateWithFallback({ ...base, generator: null })).resolves.toEqual({
      data: { value: 0 },
      source: 'fallback',
    });
  });

  it('returns parsed AI output when valid', async () => {
    const generator = mockGenerator(async () => '{"value":7}');
    await expect(generateWithFallback({ ...base, generator })).resolves.toEqual({ data: { value: 7 }, source: 'ai' });
  });

  it('logs and falls back on schema mismatch', async () => {
    const logger = { ...silentLogger, warn: vi.fn() };
    const generator = mockGenerator(async () => '{"value":"seven"}');
    const result = await generateWithFallback({ ...base, generator, logger });
    expect(result.source).toBe('fallback');
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('failed validation'), expect.any(Object));
  });

  it('falls back on an empty model response', async () => {
    const generator = mockGenerator(async () => undefined);
    expect((await generateWithFallback({ ...base, generator })).source).toBe('fallback');
  });
});
