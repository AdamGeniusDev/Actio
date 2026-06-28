import { z } from "zod";

// Fail fast au démarrage plutôt qu'au premier appel en prod.
const envSchema = z.object({
  DATABASE_URL: z.url(),
  PORT: z.string().default("8000").transform(Number),
  LOG_LEVEL: z.enum(["info", "warn", "error", "debug", "trace", "fatal"]).default("info"),
  PUBLIC_BASE_URL: z.url().default("http://localhost:8000"),
  ALLOWED_ORIGIN: z.string().optional(),

  BETTER_AUTH_SECRET: z.string().min(16, "BETTER_AUTH_SECRET doit faire au moins 16 caractères — génère une vraie valeur avec `openssl rand -base64 32`"),

  // Liste séparée par des virgules : Google émet un client ID par plateforme.
  GOOGLE_CLIENT_ID: z.string().min(1).transform((value) => value.split(",").map((id) => id.trim())),
  GOOGLE_CLIENT_SECRET: z.string().min(1),

  OPENROUTER_API_KEY: z.string().min(1),
  LLM_MODEL: z.string().default("openai/gpt-oss-20b:free"),
  // Doit accepter l'audio en entrée + le tool calling, pas juste LLM_MODEL.
  LLM_AUDIO_MODEL: z.string().default("nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free"),

  MONEROO_API_KEY: z.string().min(1),
  MONEROO_WEBHOOK_SECRET: z.string().min(1),

  // LemonSqueezy (Europe/Amérique) — optionnel, retombe sur Moneroo si absent.
  LEMONSQUEEZY_API_KEY: z.string().optional(),
  LEMONSQUEEZY_STORE_ID: z.string().optional(),
  LEMONSQUEEZY_PRODUCT_ID: z.string().optional(),
  LEMONSQUEEZY_VARIANT_ID_MONTHLY: z.string().optional(),
  LEMONSQUEEZY_VARIANT_ID_YEARLY: z.string().optional(),
  LEMONSQUEEZY_WEBHOOK_SECRET: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // Termii (SMS + WhatsApp) — optionnel, ces canaux échouent explicitement
  // tant que non configuré (cf. lib/termii.ts).
  TERMII_API_KEY: z.string().optional(),
  TERMII_SENDER_ID: z.string().optional(),
  TERMII_BASE_URL: z.url().optional(), // vérifie ta valeur exacte dans le dashboard Termii
});

export type Env = z.infer<typeof envSchema>;

let env: Env;
try {
  env = envSchema.parse(process.env);
} catch (error) {
  console.error("❌ Variables d'environnement invalides ou manquantes :");
  console.error(error);
  process.exit(1);
}

export default env;
