'use strict';

// DEMO (branch demo/ci-failures, never merged): a change that breaks expected behaviour. Expected: the unit
// tests fail, so the pipeline stops before any image is built.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { handler } = require('../src/app');

test('DEMO: health endpoint is expected to return 201 (wrong on purpose)', async () => {
  const res = {
    writeHead(status) { this.status = status; },
    setHeader() {},
    end() {},
  };
  handler({ method: 'GET', url: '/healthz' }, res);
  assert.equal(res.status, 201); // the app correctly returns 200, so this fails
});
