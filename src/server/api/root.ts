import { createTRPCRouter } from '@/server/api/trpc';
import { chatRouter } from '@/server/api/routers/chat';

export const appRouter = createTRPCRouter({
  chat: chatRouter,
});

export type AppRouter = typeof appRouter;