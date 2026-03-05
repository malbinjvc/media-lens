import { MeiliSearch } from "meilisearch";
import { env } from "../lib/env.js";
import type { Media } from "../db/schema.js";

const client = new MeiliSearch({
  host: env.MEILISEARCH_HOST,
  apiKey: env.MEILISEARCH_API_KEY,
});

const INDEX_NAME = "media";

export const searchService = {
  async ensureIndex(): Promise<void> {
    try {
      await client.getIndex(INDEX_NAME);
    } catch {
      await client.createIndex(INDEX_NAME, { primaryKey: "id" });
      const index = client.index(INDEX_NAME);
      await index.updateFilterableAttributes([
        "userId",
        "projectId",
        "mimeType",
        "status",
        "tags",
      ]);
      await index.updateSearchableAttributes([
        "title",
        "description",
        "aiAnalysis",
        "tags",
        "filename",
      ]);
    }
  },

  async indexMedia(mediaItem: Media): Promise<void> {
    await this.ensureIndex();
    const index = client.index(INDEX_NAME);
    await index.addDocuments([
      {
        id: mediaItem.id,
        userId: mediaItem.userId,
        projectId: mediaItem.projectId,
        filename: mediaItem.filename,
        mimeType: mediaItem.mimeType,
        title: mediaItem.title,
        description: mediaItem.description,
        aiAnalysis: mediaItem.aiAnalysis,
        tags: mediaItem.tags,
        status: mediaItem.status,
        createdAt: mediaItem.createdAt.toISOString(),
      },
    ]);
  },

  async removeMedia(mediaId: string): Promise<void> {
    const index = client.index(INDEX_NAME);
    await index.deleteDocument(mediaId);
  },

  async search(
    userId: string,
    query: string,
    filters?: {
      projectId?: string;
      mimeType?: string;
      status?: string;
      tags?: string[];
    },
    limit = 20
  ) {
    await this.ensureIndex();
    const index = client.index(INDEX_NAME);

    const escapeFilter = (val: string) => val.replace(/["\\]/g, "\\$&");

    const filterParts: string[] = [`userId = "${escapeFilter(userId)}"`];
    if (filters?.projectId) {
      filterParts.push(`projectId = "${escapeFilter(filters.projectId)}"`);
    }
    if (filters?.mimeType) {
      filterParts.push(`mimeType = "${escapeFilter(filters.mimeType)}"`);
    }
    if (filters?.status) {
      filterParts.push(`status = "${escapeFilter(filters.status)}"`);
    }
    if (filters?.tags?.length) {
      const tagFilters = filters.tags
        .map((t) => `tags = "${escapeFilter(t)}"`)
        .join(" AND ");
      filterParts.push(`(${tagFilters})`);
    }

    return index.search(query, {
      filter: filterParts.join(" AND "),
      limit,
      attributesToHighlight: ["title", "description", "aiAnalysis"],
    });
  },
};
