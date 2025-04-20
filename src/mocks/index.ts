if (typeof window === 'undefined') {
  // For Node.js environment (SSR)
  const { server } = require('./server');
  server.listen();
} else {
  // For browser environment
  const { worker } = require('./browser');
  worker.start();
}
