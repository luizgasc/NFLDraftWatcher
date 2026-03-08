import type { DraftProviderAdapter } from "./index";
import type { RawProspectRecord } from "./types";

const mockProspects: RawProspectRecord[] = [
  {
    externalId: "mock-qb-alpha",
    externalType: "mock_prospect_id",
    fullName: "Mock Quarterback Alpha",
    slug: "mock-quarterback-alpha",
    position: "QB",
    college: "North Ridge",
    draftYear: 2026,
    status: "active",
    hometown: "Austin, TX",
    bio: "Development-only quarterback profile used to validate normalized ingestion.",
    age: 21.4,
    measurements: [
      {
        metricType: "height",
        metricValue: 75,
        metricUnit: "in",
        eventType: "combine",
        sourceType: "official",
        confidence: "official",
      },
      {
        metricType: "weight",
        metricValue: 219,
        metricUnit: "lb",
        eventType: "combine",
        sourceType: "official",
        confidence: "official",
      },
      {
        metricType: "forty_yard",
        metricValue: 4.71,
        metricUnit: "s",
        eventType: "combine",
        sourceType: "official",
        confidence: "official",
      },
    ],
    collegeStats: [
      {
        season: 2025,
        teamName: "North Ridge",
        statCategory: "passing",
        statName: "passing_yards",
        statValue: 3842,
        confidence: "high",
      },
      {
        season: 2025,
        teamName: "North Ridge",
        statCategory: "passing",
        statName: "passing_touchdowns",
        statValue: 31,
        confidence: "high",
      },
    ],
    rankings: [
      {
        rankingType: "overall",
        rankingValue: 12,
      },
      {
        rankingType: "position",
        rankingValue: 2,
      },
    ],
    report: {
      summary: "Rhythm passer with strong pocket sequencing and clean mechanics.",
      strengths: ["processing", "accuracy", "timing"],
      weaknesses: ["deep velocity", "pressure management"],
      projection: "Top-20 starter traits",
    },
    sourceUpdatedAt: "2026-02-25T15:00:00.000Z",
  },
  {
    externalId: "mock-edge-beta",
    externalType: "mock_prospect_id",
    fullName: "Mock Edge Beta",
    slug: "mock-edge-beta",
    position: "EDGE",
    college: "Lake State",
    draftYear: 2026,
    status: "active",
    hometown: "Detroit, MI",
    bio: "Development-only edge defender profile used to validate measurement and ranking ingestion.",
    age: 22.1,
    measurements: [
      {
        metricType: "height",
        metricValue: 77,
        metricUnit: "in",
        eventType: "combine",
        sourceType: "official",
        confidence: "official",
      },
      {
        metricType: "weight",
        metricValue: 263,
        metricUnit: "lb",
        eventType: "combine",
        sourceType: "official",
        confidence: "official",
      },
      {
        metricType: "three_cone",
        metricValue: 6.98,
        metricUnit: "s",
        eventType: "pro_day",
        sourceType: "reported",
        confidence: "medium",
      },
    ],
    collegeStats: [
      {
        season: 2025,
        teamName: "Lake State",
        statCategory: "defense",
        statName: "sacks",
        statValue: 11.5,
        confidence: "high",
      },
      {
        season: 2025,
        teamName: "Lake State",
        statCategory: "defense",
        statName: "tackles_for_loss",
        statValue: 17,
        confidence: "high",
      },
    ],
    rankings: [
      {
        rankingType: "overall",
        rankingValue: 19,
      },
      {
        rankingType: "position",
        rankingValue: 4,
      },
    ],
    report: {
      summary: "Linear burst rusher with power through contact and a deep pass-rush runway.",
      strengths: ["get-off", "length", "run defense"],
      weaknesses: ["bend consistency", "counter timing"],
      projection: "Day 1 to Day 2 starter upside",
    },
    sourceUpdatedAt: "2026-02-26T15:00:00.000Z",
  },
];

type CreateMockDraftProviderAdapterOptions = {
  providerName?: string;
  records?: RawProspectRecord[];
};

export function createMockDraftProviderAdapter(
  options: CreateMockDraftProviderAdapterOptions = {},
): DraftProviderAdapter {
  return {
    providerName: options.providerName ?? "mock-draft-provider",
    async fetchProspects(input) {
      return (options.records ?? mockProspects).filter(
        (record) => record.draftYear === input.draftYear,
      );
    },
  };
}
