import {
  ApiError,
  generateIdeas,
  generateInvitation,
  generateThemes,
  generateTimeline,
  isAbortError,
  postJson,
} from './api';

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

const identity = (json: unknown) => json;

async function expectApiError(promise: Promise<unknown>, kind: ApiError['kind']) {
  const error = await promise.then(
    () => {
      throw new Error('expected rejection');
    },
    (e: unknown) => e,
  );
  expect(error).toBeInstanceOf(ApiError);
  expect((error as ApiError).kind).toBe(kind);
  return error as ApiError;
}

describe('postJson', () => {
  it('POSTs JSON and returns the parsed result', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ ok: 1 }));
    await expect(postJson('/x', { a: 1 }, identity, { fetchImpl })).resolves.toEqual({ ok: 1 });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('/x');
    expect(init).toMatchObject({ method: 'POST', body: '{"a":1}' });
    expect(init.headers['Content-Type']).toBe('application/json');
  });

  it('maps non-2xx responses to http errors using the server message', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ error: 'Too many requests' }, 429));
    const error = await expectApiError(postJson('/x', {}, identity, { fetchImpl }), 'http');
    expect(error.status).toBe(429);
    expect(error.message).toBe('Too many requests');
  });

  it('maps non-JSON error bodies to http errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('<html>', { status: 502 }));
    const error = await expectApiError(postJson('/x', {}, identity, { fetchImpl }), 'http');
    expect(error.status).toBe(502);
  });

  it('maps invalid JSON on success to parse errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(new Response('not json', { status: 200 }));
    await expectApiError(postJson('/x', {}, identity, { fetchImpl }), 'parse');
  });

  it('maps rejected fetches to network errors', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    await expectApiError(postJson('/x', {}, identity, { fetchImpl }), 'network');
  });

  it('times out slow requests', async () => {
    vi.useFakeTimers();
    try {
      const fetchImpl = vi.fn(
        (_url: RequestInfo | URL, init?: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      );
      const promise = postJson('/x', {}, identity, { fetchImpl, timeoutMs: 1000 });
      const assertion = expectApiError(promise, 'timeout');
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });

  it('honours caller cancellation', async () => {
    const controller = new AbortController();
    const fetchImpl = vi.fn(
      (_url: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    const promise = postJson('/x', {}, identity, { fetchImpl, signal: controller.signal });
    controller.abort();
    const error = await expectApiError(promise, 'aborted');
    expect(isAbortError(error)).toBe(true);
  });

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn();
    await expectApiError(
      postJson('/x', {}, identity, { fetchImpl, signal: controller.signal }),
      'aborted',
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps shape mismatches to invalid_response errors', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({ themes: 'nope' }));
    await expectApiError(generateThemes({} as never, { fetchImpl }), 'invalid_response');
  });
});

describe('endpoint functions', () => {
  const event = { occasion: 'birthday' as const, guestCount: 10, budget: 100 };

  it.each([
    [
      'themes',
      () => generateThemes({ ...event, vibe: 'v', notes: '' }, { fetchImpl: fetchFor('themes') }),
    ],
    [
      'invitation',
      () =>
        generateInvitation(
          {
            eventTitle: 't',
            occasion: 'birthday',
            hostName: 'h',
            date: '',
            time: '',
            location: '',
            theme: '',
            tone: 'warm',
            extraDetails: '',
            type: 'invitation',
          },
          { fetchImpl: fetchFor('invitation') },
        ),
    ],
    [
      'timeline',
      () =>
        generateTimeline(
          {
            eventTitle: 't',
            occasion: 'birthday',
            startTime: '',
            endTime: '',
            guestCount: 1,
            vibes: '',
            keyMoments: '',
          },
          { fetchImpl: fetchFor('timeline') },
        ),
    ],
    [
      'ideas',
      () =>
        generateIdeas(
          { ...event, theme: '', dietary: '', ageGroup: '' },
          { fetchImpl: fetchFor('ideas') },
        ),
    ],
  ])('calls /api/gemini/%s and validates the body', async (_name, call) => {
    await expect(call()).resolves.toBeDefined();
  });
});

const BODIES: Record<string, unknown> = {
  themes: { success: true, themes: [{ id: '1', title: 'T', tagline: 'L', palette: [], decorIdeas: [] }] },
  invitation: {
    success: true,
    invitation: {
      subjectLine: 's',
      headline: 'h',
      greeting: 'g',
      body: 'b',
      detailsBlock: { when: 'w', where: 'w', rsvpNote: 'r' },
      closing: 'c',
      signoff: 's',
    },
  },
  timeline: { success: true, timeline: [{ id: '1', time: '1 PM', title: 't', category: 'food' }] },
  ideas: {
    success: true,
    ideas: {
      decor: [],
      menu: { starters: [], mains: [], desserts: [], signatureDrinks: [] },
      activities: [],
    },
  },
};

function fetchFor(endpoint: string) {
  return vi.fn(async (url: RequestInfo | URL) => {
    expect(url).toBe(`/api/gemini/${endpoint}`);
    return jsonResponse(BODIES[endpoint]);
  }) as unknown as typeof fetch;
}
