import { z } from "zod";

export const prospectStatusSchema = z.enum(["active", "declared", "archived"]);
export const measurementEventTypeSchema = z.enum([
  "combine",
  "pro_day",
  "school",
  "reported",
  "unknown",
]);
export const sourceTypeSchema = z.enum([
  "official",
  "licensed",
  "reported",
  "manual",
  "derived",
]);
export const sourceConfidenceSchema = z.enum([
  "official",
  "high",
  "medium",
  "low",
  "manual_review",
]);
export const rankingTypeSchema = z.enum([
  "overall",
  "position",
  "consensus",
  "grade",
]);

export const prospectSchema = z.object({
  id: z.string().uuid().optional(),
  fullName: z.string().min(1),
  slug: z.string().min(1),
  position: z.string().min(1),
  college: z.string().min(1),
  heightInches: z.number().int().positive().nullable(),
  weightPounds: z.number().positive().nullable(),
  age: z.number().positive().nullable(),
  hometown: z.string().nullable(),
  bio: z.string().nullable(),
  draftYear: z.number().int().min(2000),
  status: prospectStatusSchema,
  imageUrl: z.string().url().nullable(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export const prospectExternalIdSchema = z.object({
  id: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  provider: z.string().min(1),
  externalId: z.string().min(1),
  externalType: z.string().min(1),
  createdAt: z.string().datetime().optional(),
});

export const prospectMeasurementSchema = z.object({
  id: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  metricType: z.string().min(1),
  metricValue: z.number(),
  metricUnit: z.string().min(1),
  eventType: measurementEventTypeSchema,
  sourceType: sourceTypeSchema,
  sourceName: z.string().min(1),
  confidence: sourceConfidenceSchema,
  recordedAt: z.string().datetime().nullable(),
  draftYear: z.number().int().min(2000),
  createdAt: z.string().datetime().optional(),
});

export const prospectCollegeStatSchema = z.object({
  id: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  season: z.number().int().min(1900),
  teamName: z.string().min(1),
  statCategory: z.string().min(1),
  statName: z.string().min(1),
  statValue: z.number(),
  sourceName: z.string().min(1),
  confidence: sourceConfidenceSchema,
  createdAt: z.string().datetime().optional(),
});

export const prospectRankingSchema = z.object({
  id: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  sourceName: z.string().min(1),
  rankingType: rankingTypeSchema,
  rankingValue: z.number().nullable(),
  gradeValue: z.number().nullable(),
  draftYear: z.number().int().min(2000),
  createdAt: z.string().datetime().optional(),
});

export const prospectReportSchema = z.object({
  id: z.string().uuid().optional(),
  prospectId: z.string().uuid().optional(),
  sourceName: z.string().min(1),
  summary: z.string().nullable(),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  projection: z.string().nullable(),
  createdAt: z.string().datetime().optional(),
});

export const normalizedProspectBundleSchema = z.object({
  prospect: prospectSchema,
  externalIds: z.array(prospectExternalIdSchema),
  measurements: z.array(prospectMeasurementSchema),
  collegeStats: z.array(prospectCollegeStatSchema),
  rankings: z.array(prospectRankingSchema),
  reports: z.array(prospectReportSchema),
});

export type Prospect = z.infer<typeof prospectSchema>;
export type ProspectExternalId = z.infer<typeof prospectExternalIdSchema>;
export type ProspectMeasurement = z.infer<typeof prospectMeasurementSchema>;
export type ProspectCollegeStat = z.infer<typeof prospectCollegeStatSchema>;
export type ProspectRanking = z.infer<typeof prospectRankingSchema>;
export type ProspectReport = z.infer<typeof prospectReportSchema>;
export type NormalizedProspectBundle = z.infer<
  typeof normalizedProspectBundleSchema
>;
export type ProspectStatus = z.infer<typeof prospectStatusSchema>;
export type MeasurementEventType = z.infer<typeof measurementEventTypeSchema>;
export type SourceType = z.infer<typeof sourceTypeSchema>;
export type SourceConfidence = z.infer<typeof sourceConfidenceSchema>;
export type RankingType = z.infer<typeof rankingTypeSchema>;
