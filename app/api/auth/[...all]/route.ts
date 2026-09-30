//* Libraries imports
import { toNextJsHandler } from "better-auth/next-js";

//* Local imports
import { auth } from "@/lib/auth";

export const { GET, POST } = toNextJsHandler(auth.handler);
