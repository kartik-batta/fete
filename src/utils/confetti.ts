/**
 * Celebration confetti effects.
 *
 * `canvas-confetti` is loaded on first use via dynamic `import()` so it stays
 * out of the initial bundle, and every effect is skipped for users who have
 * asked the OS to reduce motion. The public functions stay fire-and-forget.
 */
import type { Options } from 'canvas-confetti';

type ConfettiFn = (options?: Options) => unknown;

const FESTIVE_COLORS = ['#FFD6BA', '#D8B4E2', '#B8D5B8', '#E78B75', '#F9C74F', '#F4ACB7', '#FFEAA7'];
const MINI_COLORS = ['#FFCAD4', '#B5E2FA', '#FDFD96', '#C1FBA4', '#F4ACB7'];
const FESTIVE_PARTICLE_COUNT = 200;

/** Staggered bursts that together make one "festive" explosion. */
const FESTIVE_BURSTS: ReadonlyArray<{ ratio: number; options: Options }> = [
  { ratio: 0.25, options: { spread: 26, startVelocity: 55 } },
  { ratio: 0.2, options: { spread: 60 } },
  { ratio: 0.35, options: { spread: 100, decay: 0.91, scalar: 0.8 } },
  { ratio: 0.1, options: { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 } },
  { ratio: 0.1, options: { spread: 120, startVelocity: 45 } },
];

let confettiPromise: Promise<ConfettiFn> | null = null;

function loadConfetti(): Promise<ConfettiFn> {
  confettiPromise ??= import('canvas-confetti').then((mod) => mod.default as ConfettiFn);
  return confettiPromise;
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/** Runs `draw` with the confetti function unless motion is reduced; never throws. */
function withConfetti(draw: (confetti: ConfettiFn) => void): void {
  if (typeof window === 'undefined' || prefersReducedMotion()) return;
  loadConfetti()
    .then(draw)
    .catch((err) => {
      // Decorative only — a failed chunk load must not break the action that triggered it.
      confettiPromise = null;
      console.warn('Confetti effect unavailable:', err);
    });
}

export function triggerFestiveConfetti(): void {
  withConfetti((confetti) => {
    for (const { ratio, options } of FESTIVE_BURSTS) {
      confetti({
        origin: { y: 0.7 },
        colors: FESTIVE_COLORS,
        ...options,
        particleCount: Math.floor(FESTIVE_PARTICLE_COUNT * ratio),
      });
    }
  });
}

/** Small burst at a viewport-relative position (0–1 on each axis). */
export function triggerMiniConfetti(x = 0.5, y = 0.5): void {
  withConfetti((confetti) => {
    confetti({
      particleCount: 40,
      spread: 50,
      origin: { x, y },
      colors: MINI_COLORS,
      ticks: 120,
      gravity: 1.2,
      scalar: 0.8,
    });
  });
}
