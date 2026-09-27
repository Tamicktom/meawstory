//* Libraries imports
import { treaty } from '@elysia/eden';

//* Local imports
import type { App } from '@/api';
import { clientEnv } from '@/env/client';

export const client = treaty<App>(clientEnv.NEXT_PUBLIC_VERCEL_URL);