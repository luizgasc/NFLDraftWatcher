import { z } from "zod";

export const ingestionEntityTypeSchema = z.enum([
  "prospect",
  "measurement",
  "college_stat",
  "ranking",
  "report",
]);
export const syncRunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);
export const reviewQueueStatusSchema = z.enum([
  "open",
  "reviewing",
  "resolved",
]);

export const stagedRawRecordSchema = z.object({
  provider: z.string().min(1),
  entityType: ingestionEntityTypeSchema,
  externalId: z.string().min(1),
  payload: z.unknown(),
  fetchedAt: z.string().datetime(),
});

export const syncRunCountersSchema = z.object({
  fetched: z.number().int().min(0),
  staged: z.number().int().min(0),
  inserted: z.number().int().min(0),
  updated: z.number().int().min(0),
  skipped: z.number().int().min(0),
  conflicts: z.number().int().min(0),
});

export const syncRunSummarySchema = z.object({
  sourceName: z.string().min(1),
  entityType: ingestionEntityTypeSchema,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime(),
  status: syncRunStatusSchema,
  counters: syncRunCountersSchema,
  errorMessage: z.string().nullable(),
});

export const manualReviewItemSchema = z.object({
  provider: z.string().min(1),
  entityType: ingestionEntityTypeSchema,
  externalId: z.string().min(1),
  reason: z.string().min(1),
  payload: z.unknown(),
  status: reviewQueueStatusSchema.default("open"),
});

export type IngestionEntityType = z.infer<typeof ingestionEntityTypeSchema>;
export type StagedRawRecord = z.infer<typeof stagedRawRecordSchema>;
export type SyncRunCounters = z.infer<typeof syncRunCountersSchema>;
export type SyncRunSummary = z.infer<typeof syncRunSummarySchema>;
export type SyncRunStatus = z.infer<typeof syncRunStatusSchema>;
export type ManualReviewItem = z.infer<typeof manualReviewItemSchema>;
