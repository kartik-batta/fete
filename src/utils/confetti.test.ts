import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const confettiMock = vi.fn();
vi.mock('canvas-confetti', () => ({ default: confettiMock }));

function mockReducedMotion(reduce: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduce && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })) as unknown as typeof window.matchMedia;
}

describe('confetti', () => {
  beforeEach(() => confettiMock.mockClear());
  afterEach(() => vi.restoreAllMocks());

  it('lazy-loads canvas-confetti and fires the festive bursts', async () => {
    mockReducedMotion(false);
    const { triggerFestiveConfetti } = await import('./confetti');
    triggerFestiveConfetti();
    await vi.waitFor(() => expect(confettiMock).toHaveBeenCalledTimes(5));
    const total = confettiMock.mock.calls.reduce((n, [opts]) => n + opts.particleCount, 0);
    expect(total).toBe(200);
  });

  it('fires a mini burst at the given origin', async () => {
    mockReducedMotion(false);
    const { triggerMiniConfetti } = await import('./confetti');
    triggerMiniConfetti(0.2, 0.8);
    await vi.waitFor(() =>
      expect(confettiMock).toHaveBeenCalledWith(expect.objectContaining({ origin: { x: 0.2, y: 0.8 } }))
    );
  });

  it('does nothing when the user prefers reduced motion', async () => {
    mockReducedMotion(true);
    const { triggerFestiveConfetti, triggerMiniConfetti, prefersReducedMotion } = await import('./confetti');
    expect(prefersReducedMotion()).toBe(true);
    triggerFestiveConfetti();
    triggerMiniConfetti();
    await new Promise((r) => setTimeout(r, 10));
    expect(confettiMock).not.toHaveBeenCalled();
  });
});
