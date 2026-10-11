//* Libraries imports
import { Elysia } from 'elysia';

//* Routes imports
import { writeRoutes } from './routes/write';

const app = new Elysia({ prefix: '/api' })
  .use(writeRoutes)
  .get('/', () => {
    return ({ message: 'Hello World' });
  });

export { app };
export type App = typeof app;