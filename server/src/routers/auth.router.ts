import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { users, sessions } from "../db/schema.js";
import { googleOAuth, githubOAuth } from "../lib/oauth.js";
import { generateCodeVerifier, generateState } from "arctic";
import crypto from "crypto";

const providerSchema = z.enum(["google", "github"]);

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
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
        return { url: url.toString(), state, codeVerifier };
      }

      const url = githubOAuth.createAuthorizationURL(state, ["user:email"]);
      return { url: url.toString(), state };
    }),

  callback: publicProcedure
    .input(
      z.object({
        provider: providerSchema,
        code: z.string(),
        codeVerifier: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      let email: string;
      let name: string;
      let avatarUrl: string | null = null;
      let providerId: string;

      if (input.provider === "google") {
        if (!input.codeVerifier) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Code verifier required for Google OAuth",
          });
        }
        const tokens = await googleOAuth.validateAuthorizationCode(
          input.code,
          input.codeVerifier
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

      const token = generateSessionToken();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await db.insert(sessions).values({
        userId: user.id,
        token,
        expiresAt,
      });

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

    return { success: true };
  }),
});
