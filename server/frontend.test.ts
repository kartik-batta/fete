// @vitest-environment node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { afterAll, describe, expect, it } from 'vitest';
import { staticFrontend } from './frontend';
import { testApp } from './test/helpers';

describe('staticFrontend', () => {
  const distDir = mkdtempSync(path.join(tmpdir(), 'fete-dist-'));
  mkdirSync(path.join(distDir, 'assets'));
  writeFileSync(path.join(distDir, 'index.html'), '<!doctype html><title>Fête</title>');
  writeFileSync(path.join(distDir, 'assets', 'app-abc123.js'), 'console.log(1)');
  const frontend = staticFrontend(distDir);
  const app = testApp({ isProduction: true, mountFrontend: frontend.mount });

  afterAll(async () => {
    await frontend.close();
    rmSync(distDir, { recursive: true, force: true });
  });

  it('serves hashed assets with immutable caching', async () => {
    const res = await request(app).get('/assets/app-abc123.js');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toContain('immutable');
  });

  it('falls back to index.html for client-side routes', async () => {
    const res = await request(app).get('/events/123');
    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>Fête</title>');
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  it('keeps unknown API routes as JSON 404s', async () => {
    const res = await request(app).get('/api/unknown');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
