//* Libraries imports
import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";

//* Routes
export const { GET, POST } = toNextJsHandler(auth.handler);