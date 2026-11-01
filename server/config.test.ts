// @vitest-environment node
import './test/nodeEnv';
import { describe, expect, it } from 'vitest';
import { DEFAULT_GEMINI_MODEL, loadConfig } from './config';

describe('loadConfig', () => {
  it('applies safe defaults', () => {
    const config = loadConfig({});
    expect(config).toMatchObject({
      port: 3000,
      isProduction: false,
      geminiApiKey: undefined,
      geminiModel: DEFAULT_GEMINI_MODEL,
      geminiTimeoutMs: 20_000,
      bodyLimit: '50kb',
      rateLimit: { windowMs: 60_000, max: 20 },
      trustProxy: 0,
    });
  });

  it('reads overrides from the environment', () => {
    const config = loadConfig({
      NODE_ENV: 'production',
      PORT: '8080',
      GEMINI_API_KEY: ' key ',
      GEMINI_MODEL: 'gemini-pro-latest',
      RATE_LIMIT_MAX: '5',
      TRUST_PROXY: '1',
    });
    expect(config).toMatchObject({
      port: 8080,
      isProduction: true,
      geminiApiKey: 'key',
      geminiModel: 'gemini-pro-latest',
      rateLimit: { max: 5 },
      trustProxy: 1,
    });
  });

  it('treats a blank API key as absent', () => {
    expect(loadConfig({ GEMINI_API_KEY: '   ' }).geminiApiKey).toBeUndefined();
  });

  it.each([['abc'], ['0'], ['70000'], ['3000.5'], ['-1']])('rejects invalid PORT %s', (port) => {
    expect(() => loadConfig({ PORT: port })).toThrow(/PORT/);
  });

  it('rejects suspicious model names', () => {
    expect(() => loadConfig({ GEMINI_MODEL: '../../etc' })).toThrow(/GEMINI_MODEL/);
  });
});
