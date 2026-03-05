import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc.js";
import { db } from "../db/index.js";
import { media } from "../db/schema.js";
import { aiService } from "../services/ai.service.js";
import { storageService } from "../services/storage.service.js";
import { searchService } from "../services/search.service.js";

async function getMediaItem(mediaId: string, userId: string) {
  const [item] = await db
    .select()
    .from(media)
    .where(and(eq(media.id, mediaId), eq(media.userId, userId)))
    .limit(1);

  if (!item) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Media not found" });
  }
  return item;
}

export const aiRouter = router({
  analyze: protectedProcedure
    .input(z.object({ mediaId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await getMediaItem(input.mediaId, ctx.user.id);
      let analysis: string;

      try {
        const buffer = await storageService.getObjectBuffer(item.storageKey);

        if (item.mimeType.startsWith("image/")) {
          analysis = await aiService.analyzeImage(buffer, item.mimeType);
        } else if (item.mimeType === "application/pdf") {
          analysis = await aiService.extractTextFromPdf(buffer);
          analysis = await aiService.summarizeText(analysis);
        } else {
          const text = buffer.toString("utf-8");
          analysis = await aiService.summarizeText(text);
        }

        const [updated] = await db
          .update(media)
          .set({
            aiAnalysis: analysis,
            status: "analyzed",
            updatedAt: new Date(),
          })
          .where(eq(media.id, item.id))
          .returning();

        await searchService.indexMedia(updated);
        return updated;
      } catch (error) {
        await db
          .update(media)
          .set({ status: "failed", updatedAt: new Date() })
          .where(eq(media.id, item.id));

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI analysis failed",
        });
      }
    }),

  summarize: protectedProcedure
    .input(z.object({ mediaId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await getMediaItem(input.mediaId, ctx.user.id);
      const buffer = await storageService.getObjectBuffer(item.storageKey);

      let text: string;
      if (item.mimeType === "application/pdf") {
        text = await aiService.extractTextFromPdf(buffer);
      } else if (item.mimeType.startsWith("image/")) {
        text = item.aiAnalysis || (await aiService.analyzeImage(buffer, item.mimeType));
      } else {
        text = buffer.toString("utf-8");
      }

      const summary = await aiService.summarizeText(text);
      return { summary };
    }),

  tag: protectedProcedure
    .input(z.object({ mediaId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const item = await getMediaItem(input.mediaId, ctx.user.id);

      let content: string;
      if (item.aiAnalysis) {
        content = item.aiAnalysis;
      } else {
        const buffer = await storageService.getObjectBuffer(item.storageKey);
        if (item.mimeType.startsWith("image/")) {
          content = await aiService.analyzeImage(buffer, item.mimeType);
        } else if (item.mimeType === "application/pdf") {
          content = await aiService.extractTextFromPdf(buffer);
        } else {
          content = buffer.toString("utf-8");
        }
      }

      const tags = await aiService.generateTags(content, item.mimeType);

      const [updated] = await db
        .update(media)
        .set({ tags, updatedAt: new Date() })
        .where(eq(media.id, item.id))
        .returning();

      await searchService.indexMedia(updated);
      return updated;
    }),

  ask: protectedProcedure
    .input(
      z.object({
        mediaId: z.string().uuid(),
        question: z.string().min(1).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const item = await getMediaItem(input.mediaId, ctx.user.id);
      const buffer = await storageService.getObjectBuffer(item.storageKey);

      let content = item.aiAnalysis || "";
      if (!content) {
        if (item.mimeType.startsWith("image/")) {
          content = await aiService.analyzeImage(buffer, item.mimeType);
        } else if (item.mimeType === "application/pdf") {
          content = await aiService.extractTextFromPdf(buffer);
        } else {
          content = buffer.toString("utf-8");
        }
      }

      const answer = await aiService.askQuestion(
        content,
        item.mimeType,
        input.question,
        item.mimeType.startsWith("image/") ? buffer : undefined
      );

      return { answer };
    }),
});
