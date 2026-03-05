import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { media } from "../db/schema.js";
import { storageService } from "../services/storage.service.js";

export const mediaRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string().uuid().optional(),
        cursor: z.string().uuid().optional(),
        limit: z.number().min(1).max(50).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(media.userId, ctx.user.id)];
      if (input.projectId) {
        conditions.push(eq(media.projectId, input.projectId));
      }

      const items = await db
        .select()
        .from(media)
        .where(and(...conditions))
        .orderBy(desc(media.createdAt))
        .limit(input.limit + 1);

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        const next = items.pop()!;
        nextCursor = next.id;
      }

      return { items, nextCursor };
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [item] = await db
        .select()
        .from(media)
        .where(and(eq(media.id, input.id), eq(media.userId, ctx.user.id)))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Media not found" });
      }

      const downloadUrl = await storageService.getPresignedDownloadUrl(
        item.storageKey
      );

      return { ...item, downloadUrl };
    }),

  getUploadUrl: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        mimeType: z.string().min(1),
        size: z.number().positive(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      storageService.validateFile(input.mimeType, input.size);

      const storageKey = storageService.generateStorageKey(
        ctx.user.id,
        input.filename
      );
      const uploadUrl = await storageService.getPresignedUploadUrl(
        storageKey,
        input.mimeType
      );

      return { uploadUrl, storageKey };
    }),

  create: protectedProcedure
    .input(
      z.object({
        filename: z.string().min(1).max(255),
        mimeType: z.string().min(1),
        size: z.number().positive(),
        storageKey: z.string().min(1),
        title: z.string().min(1).max(255),
        projectId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [item] = await db
        .insert(media)
        .values({
          userId: ctx.user.id,
          filename: input.filename,
          mimeType: input.mimeType,
          size: input.size,
          storageKey: input.storageKey,
          title: input.title,
          projectId: input.projectId,
        })
        .returning();

      return item;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        projectId: z.string().uuid().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      const [item] = await db
        .update(media)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(media.id, id), eq(media.userId, ctx.user.id)))
        .returning();

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Media not found" });
      }

      return item;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [item] = await db
        .select()
        .from(media)
        .where(and(eq(media.id, input.id), eq(media.userId, ctx.user.id)))
        .limit(1);

      if (!item) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Media not found" });
      }

      await storageService.deleteObject(item.storageKey);
      await db
        .delete(media)
        .where(and(eq(media.id, input.id), eq(media.userId, ctx.user.id)));

      return { success: true };
    }),
});
