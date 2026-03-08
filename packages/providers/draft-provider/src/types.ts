import type {
  MeasurementEventType,
  RankingType,
  SourceConfidence,
  SourceType,
} from "@nfl-draft-watcher/domain";

export type RawMeasurementRecord = {
  metricType: string;
  metricValue: number;
  metricUnit: string;
  eventType?: MeasurementEventType;
  sourceType?: SourceType;
  confidence?: SourceConfidence;
  recordedAt?: string | null;
};

export type RawCollegeStatRecord = {
  season: number;
  teamName: string;
  statCategory: string;
  statName: string;
  statValue: number;
  confidence?: SourceConfidence;
};

export type RawRankingRecord = {
  rankingType: RankingType;
  rankingValue?: number | null;
  gradeValue?: number | null;
};

export type RawReportRecord = {
  summary?: string | null;
  strengths?: string[];
  weaknesses?: string[];
  projection?: string | null;
};

export type RawProspectRecord = {
  externalId: string;
  externalType: string;
  fullName: string;
  slug?: string;
  position: string;
  college: string;
  draftYear: number;
  status?: "active" | "declared" | "archived";
  hometown?: string | null;
  bio?: string | null;
  age?: number | null;
  imageUrl?: string | null;
  measurements?: RawMeasurementRecord[];
  collegeStats?: RawCollegeStatRecord[];
  rankings?: RawRankingRecord[];
  report?: RawReportRecord | null;
  sourceUpdatedAt?: string | null;
};

export type FetchDraftProspectsInput = {
  draftYear: number;
  signal?: AbortSignal;
};
