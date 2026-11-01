// @vitest-environment node
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { buildCspDirectives } from './middleware/security';
import { testApp } from './test/helpers';

describe('createApp security', () => {
  it('sets security headers and hides the framework', async () => {
    const res = await request(testApp()).post('/api/gemini/themes').send({});
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['cache-control']).toBe('no-store');
    const csp = res.headers['content-security-policy'];
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self';");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it('sends HSTS only in production', async () => {
    const prod = await request(testApp({ isProduction: true })).get('/api/x');
    const dev = await request(testApp({ isProduction: false })).get('/api/x');
    expect(prod.headers['strict-transport-security']).toBeDefined();
    expect(dev.headers['strict-transport-security']).toBeUndefined();
  });

  it('relaxes the CSP only in development', () => {
    const prod = buildCspDirectives(true);
    const dev = buildCspDirectives(false);
    expect(prod.scriptSrc).toEqual(["'self'"]);
    expect(dev.scriptSrc).toEqual(expect.arrayContaining(["'unsafe-inline'", "'unsafe-eval'"]));
    expect(dev.connectSrc).toEqual(expect.arrayContaining(['ws:']));
    expect(dev.upgradeInsecureRequests).toBeNull();
  });

  it('returns JSON 404 for unknown API routes', async () => {
    const res = await request(testApp()).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: 'Not found' });
  });

  it('rejects GET on POST-only endpoints with 404 JSON', async () => {
    const res = await request(testApp()).get('/api/gemini/themes');
    expect(res.status).toBe(404);
  });

  it('rejects malformed JSON with 400 and no parser internals', async () => {
    const res = await request(testApp())
      .post('/api/gemini/themes')
      .set('Content-Type', 'application/json')
      .send('{"occasion": ');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: 'Malformed JSON body' });
  });

  it('rejects bodies larger than the limit with 413', async () => {
    const res = await request(testApp({ bodyLimit: '1kb' }))
      .post('/api/gemini/themes')
      .send({ notes: 'x'.repeat(5_000) });
    expect(res.status).toBe(413);
    expect(res.body.error).toBe('Request body too large');
  });

  it('rate limits API requests per client', async () => {
    const app = testApp({ rateLimit: { windowMs: 60_000, max: 2 } });
    await request(app).post('/api/gemini/themes').send({}).expect(200);
    await request(app).post('/api/gemini/themes').send({}).expect(200);
    const res = await request(app).post('/api/gemini/themes').send({});
    expect(res.status).toBe(429);
    expect(res.body.success).toBe(false);
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('does not rate limit non-API routes', async () => {
    const app = testApp({
      rateLimit: { windowMs: 60_000, max: 1 },
      mountFrontend: (a) => a.get('/', (_req, res) => void res.send('ok')),
    });
    for (let i = 0; i < 3; i += 1) await request(app).get('/').expect(200);
  });

  it('never leaks internal error details to clients', async () => {
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const app = testApp({
      logger,
      mountFrontend: (a) =>
        a.get('/boom', () => {
          throw new Error('db password is hunter2');
        }),
    });
    const res = await request(app).get('/boom');
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toContain('hunter2');
    expect(res.body).toEqual({ success: false, error: 'Something went wrong. Please try again.' });
    expect(logger.error).toHaveBeenCalledWith(
      'Unhandled request error',
      expect.objectContaining({ error: expect.stringContaining('hunter2') }),
    );
  });
});
