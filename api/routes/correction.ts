//* Libraries imports
import { Elysia } from "elysia";
import { headers } from "next/headers";
import z from "zod";

//* Local imports
import { auth } from "@/lib/auth";

//* Services imports
import { correctionService } from "@/services/correction";


const correctionRoutes = new Elysia({ prefix: "/correction" })
  .get(
    "/check-correction-status/:textId",
    async (request) => {
      const { textId } = request.params;

      const session = await auth.api.getSession({
        headers: await headers(),
      });

      if (!session) {
        request.set.status = 401;
        return { message: "Unauthorized" };
      }

      const correction = await correctionService.findLatestActiveCorrection(textId);

      return {
        status: correction?.status ?? "PENDING",
      };
    },
    {
      params: z.object({
        textId: z.string(),
      }),
    }
  );

export { correctionRoutes };