import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, lt } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { googleOAuth, githubOAuth } from "../lib/oauth.js";
import { generateCodeVerifier, generateState } from "arctic";
import { env } from "../lib/env.js";
import crypto from "crypto";

const providerSchema = z.enum(["google", "github"]);

// In-memory store for OAuth state validation (CSRF protection)
// In production, use Redis or database
const pendingOAuthStates = new Map<
  string,
  { provider: string; codeVerifier?: string; expiresAt: number }
>();

// Cleanup expired states every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of pendingOAuthStates) {
    if (val.expiresAt < now) pendingOAuthStates.delete(key);
  }
}, 5 * 60 * 1000);

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

const MAX_SESSIONS_PER_USER = 10;
const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function setSessionCookie(
  res: import("express").Response,
  token: string,
  expiresAt: Date
) {
  res.cookie("session_token", token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export const authRouter = router({
  getLoginUrl: publicProcedure
    .input(z.object({ provider: providerSchema }))
    .mutation(async ({ input }) => {
      const state = generateState();

      if (input.provider === "google") {
        const codeVerifier = generateCodeVerifier();
        const url = googleOAuth.createAuthorizationURL(state, codeVerifier, [
          "openid",
          "email",
          "profile",
        ]);
        // Store state + codeVerifier server-side (10 min expiry)
        pendingOAuthStates.set(state, {
          provider: "google",
          codeVerifier,
          expiresAt: Date.now() + 10 * 60 * 1000,
        });
        return { url: url.toString(), state };
      }

      const url = githubOAuth.createAuthorizationURL(state, ["user:email"]);
      pendingOAuthStates.set(state, {
        provider: "github",
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      return { url: url.toString(), state };
    }),

  callback: publicProcedure
    .input(
      z.object({
        provider: providerSchema,
        code: z.string().min(1).max(2000),
        state: z.string().min(1).max(200),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Validate OAuth state (CSRF protection)
      const pending = pendingOAuthStates.get(input.state);
      if (!pending || pending.provider !== input.provider) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid or expired OAuth state",
        });
      }
      pendingOAuthStates.delete(input.state);

      if (pending.expiresAt < Date.now()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "OAuth state expired",
        });
      }

      let email: string;
      let name: string;
      let avatarUrl: string | null = null;
      let providerId: string;

      if (input.provider === "google") {
        if (!pending.codeVerifier) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Code verifier not found for Google OAuth",
          });
        }
        const tokens = await googleOAuth.validateAuthorizationCode(
          input.code,
          pending.codeVerifier
        );
        const response = await fetch(
          "https://openidconnect.googleapis.com/v1/userinfo",
          { headers: { Authorization: `Bearer ${tokens.accessToken()}` } }
        );
        const profile = (await response.json()) as {
          sub: string;
          email: string;
          name: string;
          picture?: string;
        };
        email = profile.email;
        name = profile.name;
        avatarUrl = profile.picture || null;
        providerId = profile.sub;
      } else {
        const tokens = await githubOAuth.validateAuthorizationCode(input.code);
        const userResponse = await fetch("https://api.github.com/user", {
          headers: { Authorization: `Bearer ${tokens.accessToken()}` },
        });
        const profile = (await userResponse.json()) as {
          id: number;
          login: string;
          name: string | null;
          avatar_url: string;
        };

        const emailResponse = await fetch(
          "https://api.github.com/user/emails",
          { headers: { Authorization: `Bearer ${tokens.accessToken()}` } }
        );
        const emails = (await emailResponse.json()) as Array<{
          email: string;
          primary: boolean;
        }>;
        const primaryEmail = emails.find((e) => e.primary);
        email = primaryEmail?.email || `${profile.login}@github.com`;
        name = profile.name || profile.login;
        avatarUrl = profile.avatar_url;
        providerId = String(profile.id);
      }

      let [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email))
        .limit(1);

      if (!user) {
        [user] = await db
          .insert(users)
          .values({
            email,
            name,
            avatarUrl,
            provider: input.provider,
            providerId,
          })
          .returning();
      }

      // Enforce max sessions per user
      const userSessions = await db
        .select()
        .from(sessions)
        .where(eq(sessions.userId, user.id))
        .orderBy(sessions.createdAt);

      if (userSessions.length >= MAX_SESSIONS_PER_USER) {
        const oldest = userSessions[0];
        await db.delete(sessions).where(eq(sessions.id, oldest.id));
      }

      // Cleanup expired sessions for this user
      await db
        .delete(sessions)
        .where(
          and(eq(sessions.userId, user.id), lt(sessions.expiresAt, new Date()))
        );

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt,
      });

      // Set httpOnly cookie (primary auth method)
      setSessionCookie(ctx.res, token, expiresAt);

      // Also return token for clients that can't use cookies (e.g. mobile)
      return { token, user: { id: user.id, email: user.email, name: user.name } };
    }),

  me: protectedProcedure.query(async ({ ctx }) => {
    return ctx.user;
  }),

  logout: protectedProcedure.mutation(async ({ ctx }) => {
    const token =
      ctx.req.headers.authorization?.replace("Bearer ", "") ||
      ctx.req.cookies?.session_token;

    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token));
    }

    // Clear the session cookie
    ctx.res.clearCookie("session_token", {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return { success: true };
  }),
});
