import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.router.js";
import { mediaRouter } from "./routers/media.router.js";
import { projectsRouter } from "./routers/projects.router.js";
import { aiRouter } from "./routers/ai.router.js";
import { searchRouter } from "./routers/search.router.js";

export const appRouter = router({
  auth: authRouter,
  media: mediaRouter,
  projects: projectsRouter,
  ai: aiRouter,
  search: searchRouter,
});

export type AppRouter = typeof appRouter;
