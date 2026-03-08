import { z } from "zod";

const positiveIntegerStringSchema = z
  .string()
  .regex(/^\d+$/)
  .transform((value) => Number(value))
  .pipe(z.number().int().positive());

const serverEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  INTERNAL_INGEST_TOKEN: z.string().min(16).optional(),
  SPORTRADAR_API_KEY: z.string().min(24).optional(),
  SPORTRADAR_ACCESS_LEVEL: z.enum(["trial", "production", "official"]).optional(),
  SPORTRADAR_LANGUAGE: z.string().min(2).optional(),
  SPORTRADAR_API_BASE_URL: z.url().optional(),
  SPORTRADAR_ENRICH_NCAA_STATS: z.enum(["true", "false"]).optional(),
  SPORTRADAR_PROFILE_CONCURRENCY: positiveIntegerStringSchema.optional(),
  SPORTRADAR_PROFILE_LIMIT: positiveIntegerStringSchema.optional(),
  SPORTRADAR_REQUEST_DELAY_MS: positiveIntegerStringSchema.optional(),
});

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const env = serverEnvSchema.safeParse(process.env);
export const clientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export function getEnvErrorMessage() {
  if (env.success) {
    return null;
  }

  return env.error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");
}

export function isSupabaseConfigured() {
  return clientEnv.success;
}

export function hasSupabaseAdminAccess() {
  return env.success && Boolean(env.data.SUPABASE_SERVICE_ROLE_KEY);
}

export function getInternalIngestToken() {
  if (!env.success) {
    return null;
  }

  return env.data.INTERNAL_INGEST_TOKEN ?? null;
}

export function getProspectProviderMode() {
  if (process.env.PROSPECT_PROVIDER_MODE === "mock") {
    return "mock";
  }

  if (process.env.PROSPECT_PROVIDER_MODE === "sportradar") {
    return "sportradar";
  }

  return "none";
}

export function getSportradarConfig() {
  if (!env.success || !env.data.SPORTRADAR_API_KEY) {
    return null;
  }

  return {
    apiKey: env.data.SPORTRADAR_API_KEY,
    accessLevel:
      env.data.SPORTRADAR_ACCESS_LEVEL === "production"
        ? "official"
        : (env.data.SPORTRADAR_ACCESS_LEVEL ?? "trial"),
    language: env.data.SPORTRADAR_LANGUAGE ?? "en",
    baseUrl: env.data.SPORTRADAR_API_BASE_URL ?? "https://api.sportradar.com",
    enrichNcaaStats: env.data.SPORTRADAR_ENRICH_NCAA_STATS === "true",
    profileConcurrency: env.data.SPORTRADAR_PROFILE_CONCURRENCY ?? 4,
    profileLimit: env.data.SPORTRADAR_PROFILE_LIMIT ?? null,
    requestDelayMs: env.data.SPORTRADAR_REQUEST_DELAY_MS ?? 250,
  } as const;
}
