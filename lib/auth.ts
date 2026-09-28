//* Libraries imports
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

//* Local imports
import * as schema from "@/database/schema";
import { clientEnv } from "@/env/client";

//* Libraries imports
import { db } from "@/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: clientEnv.NEXT_PUBLIC_VERCEL_URL,
  emailAndPassword: { enabled: true },
});
