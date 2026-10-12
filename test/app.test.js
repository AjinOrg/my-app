'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');
const path = require('node:path');

// Point the app at a temporary secrets folder before loading it
const secretsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'my-app-secrets-'));
process.env.SECRETS_DIR = secretsDir;
process.env.APP_ENV = 'test';
const { handler } = require('../src/app');

let server;
let base;

before(async () => {
  server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
  fs.rmSync(secretsDir, { recursive: true, force: true });
});

test('liveness and readiness probes answer 200', async () => {
  for (const probe of ['/healthz', '/readyz']) {
    const res = await fetch(base + probe);
    assert.equal(res.status, 200, probe);
  }
});

test('root returns app info and environment', async () => {
  const res = await fetch(`${base}/`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.app, 'my-app');
  assert.equal(body.environment, 'test');
});

test('environment prefix from the load balancer is served', async () => {
  const res = await fetch(`${base}/dev`);
  assert.equal(res.status, 200);
  assert.equal((await res.json()).path, '/dev');
});

test('secret file is read on every request (no restart needed)', async () => {
  const file = path.join(secretsDir, 'GREETING');
  fs.writeFileSync(file, 'first');
  assert.equal((await (await fetch(base)).json()).greeting, 'first');
  fs.writeFileSync(file, 'second');
  assert.equal((await (await fetch(base)).json()).greeting, 'second');
});

test('missing secret does not crash the app', async () => {
  fs.rmSync(path.join(secretsDir, 'GREETING'), { force: true });
  const body = await (await fetch(base)).json();
  assert.equal(body.greeting, 'no GREETING secret mounted');
});

test('only GET and HEAD are allowed', async () => {
  const res = await fetch(base, { method: 'POST' });
  assert.equal(res.status, 405);
});

test('security headers are set', async () => {
  const res = await fetch(base);
  assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(res.headers.get('cache-control'), 'no-store');
});
