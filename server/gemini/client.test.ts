// @vitest-environment node
import '../test/nodeEnv';
import { describe, expect, it, vi } from 'vitest';

const generateContent = vi.fn(async () => ({ text: '{"ok":true}' }));
vi.mock('@google/genai', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@google/genai')>()),
  GoogleGenAI: vi.fn(function GoogleGenAI() {
    return { models: { generateContent } };
  }),
}));

const { createGeminiGenerator } = await import('./client');

describe('createGeminiGenerator', () => {
  it('requests structured JSON from the configured model with the abort signal', async () => {
    const generator = createGeminiGenerator('test-key', 'gemini-test');
    const signal = new AbortController().signal;
    const text = await generator.generateJson({
      systemInstruction: 'sys',
      prompt: 'hello',
      responseSchema: {},
      signal,
    });
    expect(text).toBe('{"ok":true}');
    expect(generateContent).toHaveBeenCalledWith({
      model: 'gemini-test',
      contents: 'hello',
      config: {
        systemInstruction: 'sys',
        responseMimeType: 'application/json',
        responseSchema: {},
        abortSignal: signal,
      },
    });
  });
});
