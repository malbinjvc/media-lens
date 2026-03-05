import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router.js";
import { createContext } from "./trpc.js";
import { env } from "./lib/env.js";

const app = express();

// Request logging
app.use(
  morgan(env.NODE_ENV === "production" ? "combined" : "dev")
);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", `${env.MINIO_USE_SSL ? "https" : "http"}://${env.MINIO_ENDPOINT}:${env.MINIO_PORT}`],
        connectSrc: ["'self'", env.CORS_ORIGIN],
      },
    },
  })
);

// Permissions-Policy header (not built into helmet)
app.use((_req, res, next) => {
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()"
  );
  next();
});
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: "2mb" }));

// Global rate limit: 200 requests per minute per IP
app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many authentication attempts, please try again later",
});
app.use("/trpc/auth.", authLimiter);

// Stricter rate limit for AI endpoints
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: "Too many AI requests, please try again later",
});
app.use("/trpc/ai.", aiLimiter);

// Rate limit for upload endpoints
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: "Too many uploads, please try again later",
});
app.use("/trpc/media.getUploadUrl", uploadLimiter);
app.use("/trpc/media.create", uploadLimiter);

// Rate limit for search endpoints
const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  message: "Too many search requests, please try again later",
});
app.use("/trpc/search.", searchLimiter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  })
);

app.listen(env.PORT, () => {
  console.log(`MediaLens server running on http://localhost:${env.PORT}`);
});

export type { AppRouter } from "./router.js";
