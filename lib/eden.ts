//* Libraries imports
import { treaty } from '@elysia/eden';

//* Local imports
import type { App } from '@/api';

export const api = treaty<App>('localhost:3000');