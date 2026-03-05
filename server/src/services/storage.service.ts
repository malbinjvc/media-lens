import * as Minio from "minio";
import { env } from "../lib/env.js";

const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

const BUCKET = env.MINIO_BUCKET;
const PRESIGN_EXPIRY = 5 * 60; // 5 minutes

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "text/csv",
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

export const storageService = {
  async ensureBucket(): Promise<void> {
    const exists = await minioClient.bucketExists(BUCKET);
    if (!exists) {
      await minioClient.makeBucket(BUCKET);
    }
  },

  validateFile(mimeType: string, size: number): void {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new Error(
        `File type '${mimeType}' not allowed. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`
      );
    }
    if (size > MAX_FILE_SIZE) {
      throw new Error(`File exceeds maximum size of 50 MB`);
    }
  },

  async getPresignedUploadUrl(
    storageKey: string,
    mimeType: string
  ): Promise<string> {
    await this.ensureBucket();
    return minioClient.presignedPutObject(BUCKET, storageKey, PRESIGN_EXPIRY);
  },

  async getPresignedDownloadUrl(storageKey: string): Promise<string> {
    return minioClient.presignedGetObject(BUCKET, storageKey, PRESIGN_EXPIRY);
  },

  async deleteObject(storageKey: string): Promise<void> {
    await minioClient.removeObject(BUCKET, storageKey);
  },

  async getObjectBuffer(storageKey: string): Promise<Buffer> {
    const stream = await minioClient.getObject(BUCKET, storageKey);
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  },

  generateStorageKey(userId: string, filename: string): string {
    const timestamp = Date.now();
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    return `${userId}/${timestamp}-${sanitized}`;
  },
};
