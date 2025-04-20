if (typeof window === 'undefined') {
  // For Node.js environment (SSR)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { server } = require('./server');
  server.listen();
} else {
  // For browser environment
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { worker } = require('./browser');
  worker.start();
}
