import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  GOOGLE_REDIRECT_URI: z.string().url(),

  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  GITHUB_REDIRECT_URI: z.string().url(),

  SESSION_SECRET: z.string().min(32),

  MINIO_ENDPOINT: z.string().default("localhost"),
  MINIO_PORT: z.coerce.number().default(9000),
  MINIO_ACCESS_KEY: z.string().min(1),
  MINIO_SECRET_KEY: z.string().min(1),
  MINIO_BUCKET: z.string().default("medialens"),
  MINIO_USE_SSL: z
    .string()
    .transform((v) => v === "true")
    .default("false"),

  MEILISEARCH_HOST: z.string().default("http://localhost:7700"),
  MEILISEARCH_API_KEY: z.string().min(1),

  GEMINI_API_KEY: z.string().min(1),
});

export type Env = z.infer<typeof envSchema>;

const WEAK_DEFAULTS = ["minioadmin", "medialens", "your_meilisearch_master_key"];

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const fields = Object.keys(result.error.flatten().fieldErrors);
    console.error(`Invalid environment variables: ${fields.join(", ")}`);
    process.exit(1);
  }

  const env = result.data;

  // Reject weak defaults and unsafe config in production
  if (env.NODE_ENV === "production") {
    const weakFields: string[] = [];
    if (WEAK_DEFAULTS.includes(env.MINIO_ACCESS_KEY)) weakFields.push("MINIO_ACCESS_KEY");
    if (WEAK_DEFAULTS.includes(env.MINIO_SECRET_KEY)) weakFields.push("MINIO_SECRET_KEY");
    if (WEAK_DEFAULTS.includes(env.MEILISEARCH_API_KEY)) weakFields.push("MEILISEARCH_API_KEY");
    if (env.CORS_ORIGIN === "*") weakFields.push("CORS_ORIGIN (must not be *)");
    if (!env.MINIO_USE_SSL) weakFields.push("MINIO_USE_SSL (should be true)");

    if (weakFields.length > 0) {
      console.error(
        `SECURITY: Weak/unsafe configuration in production: ${weakFields.join(", ")}. ` +
          "Change these values before deploying."
      );
      process.exit(1);
    }
  }

  return env;
}

export const env = validateEnv();
