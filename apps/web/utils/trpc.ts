import { createTRPCReact } from '@trpc/react-query';
import { type AppRouter } from '@wishlist/api';

export const trpc = createTRPCReact<AppRouter>();
