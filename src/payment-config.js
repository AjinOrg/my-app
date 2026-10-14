'use strict';

// DEMO (branch demo/ci-failures, never merged): a credential hard-coded in source. Expected: Gitleaks fails.
// The value is random text in the shape of an API key; it is not a real credential.
const paymentConfig = {
  provider: 'demo-payments',
  paymentApiKey: 'Zx8Qw3Rt6Yu1Io4Pa7Sd2Fg5Hj9Kl0Mn',
};

module.exports = { paymentConfig };
// demo run 2026-10-14-1011
