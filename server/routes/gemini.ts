import { Router } from 'express';
import type { Schema } from '@google/genai';
import type { z } from 'zod';
import type { JsonGenerator } from '../gemini/client';
import { generateWithFallback } from '../gemini/generate';
import {
  ideasResponseSchema,
  invitationResponseSchema,
  themesResponseSchema,
  timelineResponseSchema,
} from '../gemini/responseSchemas';
import { fallbackIdeas, fallbackInvitation, fallbackThemes, fallbackTimeline } from '../fallbacks';
import type { Logger } from '../logger';
import { asyncHandler } from '../middleware/errors';
import { parseBody } from '../middleware/validate';
import { ideasPrompt, invitationPrompt, themesPrompt, timelinePrompt, type BuiltPrompt } from '../prompts';
import {
  ideasOutputSchema,
  ideasRequestSchema,
  invitationOutputSchema,
  invitationRequestSchema,
  themesOutputSchema,
  themesRequestSchema,
  timelineOutputSchema,
  timelineRequestSchema,
} from '../schemas';

/** Declarative description of one AI-backed endpoint. */
export interface AiEndpoint<Input, Output> {
  /** Path relative to the router mount point, e.g. `/themes`. */
  readonly path: string;
  /** Key under which the payload is returned: `{ success: true, [responseKey]: data }`. */
  readonly responseKey: string;
  readonly requestSchema: z.ZodType<Input>;
  readonly outputSchema: z.ZodType<Output>;
  readonly responseSchema: Schema;
  readonly buildPrompt: (input: Input) => BuiltPrompt;
  readonly fallback: (input: Input) => Output;
}

/** Identity helper that preserves each endpoint's generic types. */
function defineEndpoint<Input, Output>(endpoint: AiEndpoint<Input, Output>): AiEndpoint<Input, Output> {
  return endpoint;
}

export const themesEndpoint = defineEndpoint({
  path: '/themes',
  responseKey: 'themes',
  requestSchema: themesRequestSchema,
  outputSchema: themesOutputSchema,
  responseSchema: themesResponseSchema,
  buildPrompt: themesPrompt,
  fallback: fallbackThemes,
});

export const invitationEndpoint = defineEndpoint({
  path: '/invitation',
  responseKey: 'invitation',
  requestSchema: invitationRequestSchema,
  outputSchema: invitationOutputSchema,
  responseSchema: invitationResponseSchema,
  buildPrompt: invitationPrompt,
  fallback: fallbackInvitation,
});

export const timelineEndpoint = defineEndpoint({
  path: '/timeline',
  responseKey: 'timeline',
  requestSchema: timelineRequestSchema,
  outputSchema: timelineOutputSchema,
  responseSchema: timelineResponseSchema,
  buildPrompt: timelinePrompt,
  fallback: fallbackTimeline,
});

export const ideasEndpoint = defineEndpoint({
  path: '/ideas',
  responseKey: 'ideas',
  requestSchema: ideasRequestSchema,
  outputSchema: ideasOutputSchema,
  responseSchema: ideasResponseSchema,
  buildPrompt: ideasPrompt,
  fallback: fallbackIdeas,
});

export interface GeminiRouterDeps {
  /** `null` when no API key is configured: every endpoint serves curated content. */
  readonly generator: JsonGenerator | null;
  readonly timeoutMs: number;
  readonly logger: Logger;
}

function registerEndpoint<Input, Output>(
  router: Router,
  endpoint: AiEndpoint<Input, Output>,
  deps: GeminiRouterDeps,
): void {
  router.post(
    endpoint.path,
    asyncHandler(async (req, res) => {
      const input = parseBody(endpoint.requestSchema, req.body);
      const { systemInstruction, prompt } = endpoint.buildPrompt(input);
      const { data, source } = await generateWithFallback({
        generator: deps.generator,
        label: endpoint.responseKey,
        systemInstruction,
        prompt,
        responseSchema: endpoint.responseSchema,
        outputSchema: endpoint.outputSchema,
        fallback: () => endpoint.fallback(input),
        timeoutMs: deps.timeoutMs,
        logger: deps.logger,
      });
      res.setHeader('X-Content-Source', source);
      res.json({ success: true, [endpoint.responseKey]: data });
    }),
  );
}

/**
 * Router exposing `POST /themes`, `/invitation`, `/timeline` and `/ideas`.
 * Each validates its body, asks Gemini for schema-checked JSON, and falls back to curated content.
 */
export function createGeminiRouter(deps: GeminiRouterDeps): Router {
  const router = Router();
  registerEndpoint(router, themesEndpoint, deps);
  registerEndpoint(router, invitationEndpoint, deps);
  registerEndpoint(router, timelineEndpoint, deps);
  registerEndpoint(router, ideasEndpoint, deps);
  return router;
}
