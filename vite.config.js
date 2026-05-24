import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'api-mock-plugin',
      configureServer(server) {
        // Prepend Connect middleware to intercept '/api/whatsapp' requests before 
        // Vite's internal bundler resolvers attempt to parse 'api/whatsapp.js'.
        server.middlewares.stack.unshift({
          route: '',
          handle: (req, res, next) => {
            if (req.url && req.url.includes('/api/whatsapp')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ logs: [] }));
              return;
            }
            next();
          }
        });
      }
    }
  ]
});
