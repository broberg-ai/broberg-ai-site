// Runtime config, read once from the environment.
const env = (k: string, fallback = "") => process.env[k] ?? fallback;

export const config = {
  contentDir: env("CONTENT_DIR", "./.content-store"),
  readApiBase: env("READ_API_BASE", "https://webhouse.app/api/cms"),
  site: env("CMS_SITE", "broberg-ai"),
  readToken: env("WH_READ_TOKEN"),
  revalidateSecret: env("REVALIDATE_SECRET"),
  icdMaxAgeMs: Number(env("ICD_MAX_AGE_MS", "300000")),
  port: Number(env("PORT", "3000")),
  isProd: env("NODE_ENV") === "production",
} as const;

export const LOCALES = ["da", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "da";
