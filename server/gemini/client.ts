import { GoogleGenAI, type Schema } from '@google/genai';

/** A single structured-JSON generation request. */
export interface JsonGenerationRequest {
  /** Trusted instructions (role, rules, injection guard). */
  readonly systemInstruction: string;
  /** Task description plus delimited, untrusted user data. */
  readonly prompt: string;
  readonly responseSchema: Schema;
  readonly signal: AbortSignal;
}

/**
 * Abstraction over the LLM so routes can be tested with a mock and the provider swapped.
 * Implementations resolve with the raw JSON text produced by the model.
 */
export interface JsonGenerator {
  generateJson(request: JsonGenerationRequest): Promise<string | undefined>;
}

/** Creates a {@link JsonGenerator} backed by the Google Gemini API. */
export function createGeminiGenerator(apiKey: string, model: string): JsonGenerator {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });

  return {
    async generateJson({ systemInstruction, prompt, responseSchema, signal }) {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          abortSignal: signal,
        },
      });
      return response.text;
    },
  };
}
