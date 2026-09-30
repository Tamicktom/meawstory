//* Libraries imports
import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";

//* Local imports
import { relations } from "@/database/schema";
import { serverEnv } from "@/env/server";

export const db = drizzle(serverEnv.DATABASE_URL, { relations });
