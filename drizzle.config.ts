//* Libraries imports
import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

//* Local imports
import { serverEnv } from "@/env/server";

export default defineConfig({
  out: './database/migrations',
  schema: './database/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: serverEnv.DATABASE_URL,
  },
});
