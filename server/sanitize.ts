// Control characters except tab (\u0009), newline (\u000A) and carriage return (\u000D).
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g;
// Zero-width and bidirectional-override characters that can hide text from human reviewers.
const INVISIBLE_CHARS = /[​-‏‪-‮⁠-⁤⁦-⁩﻿]/g;
// Characters that could be used to forge or close the prompt's data delimiters.
const DELIMITER_CHARS = /[<>`{}]/g;

/**
 * Normalises untrusted user text before it is embedded in a model prompt.
 *
 * Removes control/invisible characters and delimiter-like symbols, collapses runs of
 * whitespace and trims the result. Length limits are enforced separately by the zod schemas.
 */
export function sanitizeUserText(value: string): string {
  return value
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(CONTROL_CHARS, '')
    .replace(INVISIBLE_CHARS, '')
    .replace(DELIMITER_CHARS, '')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
