//* Libraries imports
import { Elysia } from 'elysia';

//* Routes imports
import { writeRoutes } from './routes/write';
import { correctionRoutes } from './routes/correction';

const app = new Elysia({ prefix: '/api' })
  .use(writeRoutes)
  .use(correctionRoutes)
  .get('/', () => {
    return ({ message: 'Hello World' });
  });

export { app };
export type App = typeof app;