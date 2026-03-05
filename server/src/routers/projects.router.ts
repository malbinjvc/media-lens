import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { projects, media } from "../db/schema.js";

export const projectsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(50),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      return db
        .select()
        .from(projects)
        .where(eq(projects.userId, ctx.user.id))
        .orderBy(desc(projects.updatedAt))
        .limit(input?.limit ?? 50);
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [project] = await db
        .select()
        .from(projects)
        .where(
          and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id))
        )
        .limit(1);

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const projectMedia = await db
        .select()
        .from(media)
        .where(
          and(eq(media.projectId, input.id), eq(media.userId, ctx.user.id))
        )
        .orderBy(desc(media.createdAt))
        .limit(100);

      return { ...project, media: projectMedia };
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .default("#6366f1"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [project] = await db
        .insert(projects)
        .values({ ...input, userId: ctx.user.id })
        .returning();
      return project;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        color: z
          .string()
          .regex(/^#[0-9a-fA-F]{6}$/)
          .optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [project] = await db
        .update(projects)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(projects.id, id), eq(projects.userId, ctx.user.id)))
        .returning();

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return project;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [project] = await db
        .delete(projects)
        .where(
          and(eq(projects.id, input.id), eq(projects.userId, ctx.user.id))
        )
        .returning();

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      return { success: true };
    }),
});
