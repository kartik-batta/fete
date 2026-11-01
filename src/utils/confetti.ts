import confetti from 'canvas-confetti';

export function triggerFestiveConfetti() {
  const count = 200;
  const defaults = {
    origin: { y: 0.7 },
    colors: ['#FFD6BA', '#D8B4E2', '#B8D5B8', '#E78B75', '#F9C74F', '#F4ACB7', '#FFEAA7'],
  };

  function fire(particleRatio: number, opts: confetti.Options) {
    confetti({
      ...defaults,
      ...opts,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, {
    spread: 26,
    startVelocity: 55,
  });
  fire(0.2, {
    spread: 60,
  });
  fire(0.35, {
    spread: 100,
    decay: 0.91,
    scalar: 0.8,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 25,
    decay: 0.92,
    scalar: 1.2,
  });
  fire(0.1, {
    spread: 120,
    startVelocity: 45,
  });
}

export function triggerMiniConfetti(x = 0.5, y = 0.5) {
  confetti({
    particleCount: 40,
    spread: 50,
    origin: { x, y },
    colors: ['#FFCAD4', '#B5E2FA', '#FDFD96', '#C1FBA4', '#F4ACB7'],
    ticks: 120,
    gravity: 1.2,
    scalar: 0.8,
  });
}
