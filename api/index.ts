//* Libraries imports
import { Elysia } from 'elysia';

const app = new Elysia({ prefix: '/api' })
  .get('/', () => {
    return ({ message: 'Hello World' });
  });

export { app };
export type App = typeof app;