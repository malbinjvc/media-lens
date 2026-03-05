import { z } from "zod";
import { router, protectedProcedure } from "../trpc.js";
import { searchService } from "../services/search.service.js";

export const searchRouter = router({
  query: protectedProcedure
    .input(
      z.object({
        q: z.string().min(1).max(200),
        filters: z
          .object({
            projectId: z.string().uuid().optional(),
            mimeType: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/).optional(),
            status: z.enum(["pending", "analyzed", "failed"]).optional(),
            tags: z.array(z.string().max(50).regex(/^[a-zA-Z0-9\s_-]+$/)).max(20).optional(),
          })
          .optional(),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const results = await searchService.search(
        ctx.user.id,
        input.q,
        input.filters,
        input.limit
      );

      return {
        hits: results.hits,
        estimatedTotalHits: results.estimatedTotalHits,
        processingTimeMs: results.processingTimeMs,
      };
    }),
});
