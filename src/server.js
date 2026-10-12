'use strict';

const http = require('node:http');
const { handler } = require('./app');

const PORT = Number(process.env.PORT || 8080);

const server = http.createServer(handler);

// Keep idle connections open longer than the load balancer's idle timeout (60 s),
// otherwise the ALB can reuse a connection the app has just closed (intermittent 502s)
server.keepAliveTimeout = 65_000;
server.headersTimeout = 66_000;

server.listen(PORT, () => {
  console.log(JSON.stringify({ msg: 'listening', port: PORT }));
});

// Kubernetes sends SIGTERM before stopping a pod: finish open requests, then exit
function shutdown(signal) {
  console.log(JSON.stringify({ msg: 'shutting down', signal }));
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
