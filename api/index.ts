//* Libraries imports
import { Elysia } from 'elysia';

const app = new Elysia({ prefix: '/api' })
  .get('/', () => 'Hello World');

export { app };
export type App = typeof app;