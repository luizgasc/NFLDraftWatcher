import {
  normalizedProspectBundleSchema,
  type MeasurementEventType,
  type NormalizedProspectBundle,
  type SourceConfidence,
  type SourceType,
} from "@nfl-draft-watcher/domain";
import type { RawProspectRecord } from "@nfl-draft-watcher/draft-provider";

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeMeasurementUnit(metricType: string, unit: string) {
  if (metricType === "height" && unit === "ft-in") {
    return "in";
  }

  return unit.toLowerCase();
}

function normalizeMeasurementValue(metricType: string, value: number, unit: string) {
  if (metricType === "height" && unit === "ft-in") {
    return value;
  }

  return value;
}

function mapSourceType(sourceType?: SourceType): SourceType {
  return sourceType ?? "licensed";
}

function mapConfidence(confidence?: SourceConfidence): SourceConfidence {
  return confidence ?? "high";
}

function mapEventType(eventType?: MeasurementEventType): MeasurementEventType {
  return eventType ?? "unknown";
}

export function normalizeProspectRecord(
  providerName: string,
  rawRecord: RawProspectRecord,
): NormalizedProspectBundle {
  const bundle: NormalizedProspectBundle = {
    prospect: {
      fullName: rawRecord.fullName.trim(),
      slug: rawRecord.slug ?? slugify(`${rawRecord.fullName}-${rawRecord.draftYear}`),
      position: rawRecord.position.trim().toUpperCase(),
      college: rawRecord.college.trim(),
      heightInches: null,
      weightPounds: null,
      age: rawRecord.age ?? null,
      hometown: rawRecord.hometown ?? null,
      bio: rawRecord.bio ?? null,
      draftYear: rawRecord.draftYear,
      status: rawRecord.status ?? "active",
      imageUrl: rawRecord.imageUrl ?? null,
    },
    externalIds: [
      {
        provider: providerName,
        externalId: rawRecord.externalId,
        externalType: rawRecord.externalType,
      },
    ],
    measurements: (rawRecord.measurements ?? []).map((measurement) => ({
      metricType: measurement.metricType,
      metricValue: normalizeMeasurementValue(
        measurement.metricType,
        measurement.metricValue,
        measurement.metricUnit,
      ),
      metricUnit: normalizeMeasurementUnit(
        measurement.metricType,
        measurement.metricUnit,
      ),
      eventType: mapEventType(measurement.eventType),
      sourceType: mapSourceType(measurement.sourceType),
      sourceName: providerName,
      confidence: mapConfidence(measurement.confidence),
      recordedAt: measurement.recordedAt ?? rawRecord.sourceUpdatedAt ?? null,
      draftYear: rawRecord.draftYear,
    })),
    collegeStats: (rawRecord.collegeStats ?? []).map((stat) => ({
      season: stat.season,
      teamName: stat.teamName.trim(),
      statCategory: stat.statCategory,
      statName: stat.statName,
      statValue: stat.statValue,
      sourceName: providerName,
      confidence: mapConfidence(stat.confidence),
    })),
    rankings: (rawRecord.rankings ?? []).map((ranking) => ({
      sourceName: providerName,
      rankingType: ranking.rankingType,
      rankingValue: ranking.rankingValue ?? null,
      gradeValue: ranking.gradeValue ?? null,
      draftYear: rawRecord.draftYear,
    })),
    reports: rawRecord.report
      ? [
          {
            sourceName: providerName,
            summary: rawRecord.report.summary ?? null,
            strengths: rawRecord.report.strengths ?? [],
            weaknesses: rawRecord.report.weaknesses ?? [],
            projection: rawRecord.report.projection ?? null,
          },
        ]
      : [],
  };

  const parsedBundle = normalizedProspectBundleSchema.parse(bundle);

  const heightMeasurement = parsedBundle.measurements.find(
    (measurement) => measurement.metricType === "height",
  );
  const weightMeasurement = parsedBundle.measurements.find(
    (measurement) => measurement.metricType === "weight",
  );

  parsedBundle.prospect.heightInches = heightMeasurement?.metricValue ?? null;
  parsedBundle.prospect.weightPounds = weightMeasurement?.metricValue ?? null;

  return parsedBundle;
}
