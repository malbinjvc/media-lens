import { initTRPC, TRPCError } from "@trpc/server";
import type { Request, Response } from "express";
import { db } from "./db/index.js";
import { sessions, users } from "./db/schema.js";
import { eq, and, gt } from "drizzle-orm";

export interface Context {
  req: Request;
  res: Response;
  user: { id: string; email: string; name: string } | null;
}

export async function createContext({
  req,
  res,
}: {
  req: Request;
  res: Response;
}): Promise<Context> {
  const token =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies?.session_token;

  if (!token) {
    return { req, res, user: null };
  }

  const [session] = await db
    .select({
      userId: sessions.userId,
      email: users.email,
      name: users.name,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
    .limit(1);

  if (!session) {
    return { req, res, user: null };
  }

  return {
    req,
    res,
    user: { id: session.userId, email: session.email, name: session.name },
  };
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});
