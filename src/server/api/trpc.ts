/* eslint-disable @typescript-eslint/no-unused-vars */
import { initTRPC, TRPCError } from "@trpc/server";
import { type Session, getServerSession } from "next-auth";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { authOptions } from "@/server/auth";
import { db } from "@/server/db";
import superjson from "superjson";
import { ZodError } from "zod";

interface CreateContextOptions {
  session: Session | null;
}

const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    db,
  };
};

export const createTRPCContext = async (req?: NextRequest) => {
  // Try standard NextAuth session first
  let session = await getServerSession(authOptions);

  // Fallback: when getServerSession cannot see cookies in this context, read JWT directly
  if (!session && req) {
    try {
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (token && typeof token.id === "string") {
        session = {
          user: {
            id: String(token.id),
            name: token.name ?? null,
            email: token.email ?? null,
            image: (typeof token.picture === "string" ? token.picture : null) ?? null,
          },
          expires: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        } as unknown as Session;
      }
    } catch (e) {
      // ignore
    }
  }
  return createInnerTRPCContext({ session });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
