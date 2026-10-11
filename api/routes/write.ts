//* Libraries imports
import { Elysia } from "elysia";
import z from "zod";

const writeRoutes = new Elysia({ prefix: '/write' })
  .post(
    '/:themeId',
    async (request) => {
      const { themeId } = request.params;
      const { content } = request.body;


      console.log({
        themeId,
        content,
      })


      return ({ message: 'Hello World' });
    },
    {
      body: z.object({
        content: z.string(),
      }),
      params: z.object({
        themeId: z.string(),
      }),
    }
  );

export { writeRoutes };