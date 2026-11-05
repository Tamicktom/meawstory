//* Libraries imports
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const serverEnv = createEnv({
  server: {
    DATABASE_URL: z.string(),
    BETTER_AUTH_SECRET: z.string(),
    OPENAI_API_KEY: z.string(),
    //* Outside production, emails go to .email-outbox instead of Resend.
    RESEND_API_KEY:
      process.env.NODE_ENV === "production"
        ? z.string().min(1)
        : z.string().optional(),
  },
  experimental__runtimeEnv: process.env
});
