'use strict';

// Request handler for my-app. No framework and no runtime dependencies: less code to patch and scan.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SECRETS_DIR = process.env.SECRETS_DIR || '/etc/my-app/secrets';
const APP_ENV = process.env.APP_ENV || 'local';
const APP_VERSION = process.env.APP_VERSION || 'dev';

// Read on every call: when a value changes in Secrets Manager, External Secrets updates the Kubernetes
// Secret and the kubelet updates the mounted file, so the new value is used without restarting the pod.
function readSecret(name) {
  try {
    return fs.readFileSync(path.join(SECRETS_DIR, name), 'utf8').trim();
  } catch {
    return null;
  }
}

function send(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(json),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(json);
}

function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return send(res, 405, { error: 'method not allowed' });
  }

  const { pathname } = new URL(req.url, 'http://localhost');

  // Probes: kubelet (liveness/readiness) and the load balancer health check call these directly
  if (pathname === '/healthz') return send(res, 200, { status: 'ok' });
  if (pathname === '/readyz') return send(res, 200, { status: 'ready' });

  // Everything else, including the environment prefix from the shared load balancer (/dev, /staging, ...)
  const greeting = readSecret('GREETING');
  return send(res, 200, {
    app: 'my-app',
    environment: APP_ENV,
    version: APP_VERSION,
    pod: os.hostname(),
    path: pathname,
    // Demo value only. Real secrets must never be returned in a response.
    greeting: greeting ?? 'no GREETING secret mounted',
  });
}

module.exports = { handler, readSecret };
