import { createRouter } from "@/lib/create-app";
import { authMiddleware } from "@/middlewares/auth.middlewares";
import { rateLimit } from "@/lib/rate-limit";
import { parseTaskAudioHandler, parseTaskHandler } from "./ai.handlers";
import { parseTask, parseTaskAudio } from "./ai.routes";

const aiRouter = createRouter().basePath("/");

// Rate-limité : même gratuit, un quota OpenRouter peut être épuisé en boucle.
aiRouter.use(authMiddleware);
aiRouter.use(rateLimit({ max: 20, windowMs: 10 * 60 * 1000 }));

aiRouter
  .openapi(parseTask, parseTaskHandler)
  .openapi(parseTaskAudio, parseTaskAudioHandler);

export default aiRouter;
