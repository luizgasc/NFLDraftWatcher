import type { DraftProviderAdapter } from "./index";
import type { FetchDraftProspectsInput, RawProspectRecord } from "./types";

type SportradarDraftProviderConfig = {
  apiKey: string;
  accessLevel?: "trial" | "official";
  language?: string;
  baseUrl?: string;
  enrichNcaaStats?: boolean;
  profileConcurrency?: number;
  profileLimit?: number | null;
  requestDelayMs?: number;
};

type SportradarProspect = {
  id?: string;
  source_id?: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  position?: string;
  school?: string;
  college?: string;
  height?: number | string | null;
  weight?: number | string | null;
  rank?: number | null;
  position_rank?: number | null;
  status?: string | null;
  updated?: string | null;
  prospect_updated?: string | null;
  player?: {
    id?: string;
    source_id?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    position?: string;
    school?: string;
    college?: string;
    height?: number | string | null;
    weight?: number | string | null;
  };
};

type SportradarProspectsResponse = {
  generated?: string;
  prospects?: SportradarProspect[];
};

type SportradarPlayerProfileSeasonTeam = {
  id?: string;
  name?: string;
  market?: string;
  alias?: string;
  statistics?: Record<string, unknown>;
};

type SportradarPlayerProfileSeason = {
  year?: number;
  type?: string;
  teams?: SportradarPlayerProfileSeasonTeam[];
};

type SportradarPlayerProfileResponse = {
  id?: string;
  seasons?: SportradarPlayerProfileSeason[];
};

function toFullName(prospect: SportradarProspect) {
  const firstName = prospect.first_name ?? prospect.player?.first_name;
  const lastName = prospect.last_name ?? prospect.player?.last_name;
  const composed = [firstName, lastName].filter(Boolean).join(" ").trim();

  return composed || prospect.name || prospect.player?.name || "Unknown Prospect";
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
  }

  return null;
}

function mapStatus(value: string | null | undefined): "active" | "declared" | "archived" {
  if (!value) {
    return "active";
  }

  const normalized = value.trim().toLowerCase();

  if (normalized.includes("archive")) {
    return "archived";
  }

  if (normalized.includes("declare")) {
    return "declared";
  }

  return "active";
}

function isNumericStatValue(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function flattenStatistics(
  category: string,
  value: unknown,
  currentPath: string[] = [],
): Array<{ statCategory: string; statName: string; statValue: number }> {
  if (isNumericStatValue(value)) {
    return [
      {
        statCategory: category,
        statName: currentPath.join("_"),
        statValue: value,
      },
    ];
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) =>
    flattenStatistics(category, nestedValue, [...currentPath, key]),
  );
}

function toTeamName(team: SportradarPlayerProfileSeasonTeam) {
  return [team.market, team.name].filter(Boolean).join(" ").trim() || team.alias || "Unknown";
}

function mapCollegeStatsFromProfile(
  profile: SportradarPlayerProfileResponse,
): RawProspectRecord["collegeStats"] {
  const records =
    profile.seasons?.flatMap((season) => {
      if (season.type !== "REG" || !season.year) {
        return [];
      }

      return (season.teams ?? []).flatMap((team) => {
        const statistics = team.statistics;

        if (!statistics || typeof statistics !== "object") {
          return [];
        }

        return Object.entries(statistics).flatMap(([category, value]) =>
          flattenStatistics(category, value).map((stat) => ({
            season: season.year as number,
            teamName: toTeamName(team),
            statCategory: stat.statCategory,
            statName: stat.statName,
            statValue: stat.statValue,
            confidence: "high" as const,
          })),
        );
      });
    }) ?? [];

  return records;
}

async function mapWithConcurrency<TInput, TOutput>(
  items: TInput[],
  concurrency: number,
  mapper: (item: TInput, index: number) => Promise<TOutput>,
): Promise<TOutput[]> {
  if (items.length === 0) {
    return [];
  }

  const results: TOutput[] = new Array(items.length);
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < items.length) {
      const index = currentIndex;
      currentIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.max(1, concurrency) }, () => worker()),
  );

  return results;
}

function mapProspect(
  prospect: SportradarProspect,
  draftYear: number,
  sourceUpdatedAt?: string,
): RawProspectRecord {
  const fullName = toFullName(prospect);
  const position = prospect.position ?? prospect.player?.position ?? "UNK";
  const college = prospect.school ?? prospect.college ?? prospect.player?.school ?? prospect.player?.college ?? "Unknown";
  const height = toNumber(prospect.height ?? prospect.player?.height);
  const weight = toNumber(prospect.weight ?? prospect.player?.weight);
  const externalId = prospect.id ?? prospect.player?.id ?? prospect.source_id ?? prospect.player?.source_id;

  if (!externalId) {
    throw new Error(`Sportradar prospect ${fullName} is missing an external id.`);
  }

  return {
    externalId,
    externalType: "sportradar_prospect_id",
    externalIds: [
      ...(prospect.source_id
        ? [
            {
              provider: "sportradar-ncaa",
              externalId: prospect.source_id,
              externalType: "sportradar_source_id",
            },
          ]
        : []),
      ...(prospect.player?.source_id
        ? [
            {
              provider: "sportradar-ncaa",
              externalId: prospect.player.source_id,
              externalType: "sportradar_player_source_id",
            },
          ]
        : []),
    ],
    fullName,
    slug: slugify(`${fullName}-${draftYear}`),
    position,
    college,
    draftYear,
    status: mapStatus(prospect.status),
    measurements: [
      ...(height !== null
        ? [
            {
              metricType: "height",
              metricValue: height,
              metricUnit: "in",
              sourceType: "licensed" as const,
              confidence: "high" as const,
              eventType: "unknown" as const,
              recordedAt: sourceUpdatedAt ?? null,
            },
          ]
        : []),
      ...(weight !== null
        ? [
            {
              metricType: "weight",
              metricValue: weight,
              metricUnit: "lb",
              sourceType: "licensed" as const,
              confidence: "high" as const,
              eventType: "unknown" as const,
              recordedAt: sourceUpdatedAt ?? null,
            },
          ]
        : []),
    ],
    rankings: [
      ...(prospect.rank != null
        ? [
            {
              rankingType: "overall" as const,
              rankingValue: prospect.rank,
            },
          ]
        : []),
      ...(prospect.position_rank != null
        ? [
            {
              rankingType: "position" as const,
              rankingValue: prospect.position_rank,
            },
          ]
        : []),
    ],
    sourceUpdatedAt:
      prospect.updated ?? prospect.prospect_updated ?? sourceUpdatedAt ?? null,
  };
}

async function fetchJson<T>(
  url: string,
  apiKey: string,
  signal?: AbortSignal,
): Promise<T> {
  const maxAttempts = 4;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        "x-api-key": apiKey,
        accept: "application/json",
      },
      signal,
      next: { revalidate: 0 },
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    if (response.status === 429 && attempt < maxAttempts - 1) {
      const retryAfterHeader = response.headers.get("retry-after");
      const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
      const backoffMs = Number.isFinite(retryAfterSeconds)
        ? retryAfterSeconds * 1000
        : (attempt + 1) * 1000;

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      continue;
    }

    const text = await response.text();
    throw new Error(
      `Sportradar request failed with ${response.status}: ${text.slice(0, 200)}`,
    );
  }

  throw new Error("Sportradar request exhausted retry attempts.");
}

function createEmptyProspectsResponse(): SportradarProspectsResponse {
  return {
    prospects: [],
  };
}

export function createSportradarDraftProviderAdapter(
  config: SportradarDraftProviderConfig,
): DraftProviderAdapter {
  return {
    providerName: "sportradar-draft-provider",
    async fetchProspects(input: FetchDraftProspectsInput) {
      const accessLevel = config.accessLevel ?? "trial";
      const language = config.language ?? "en";
      const baseUrl = config.baseUrl ?? "https://api.sportradar.com";
      const shouldEnrichNcaaStats = config.enrichNcaaStats ?? false;
      const profileConcurrency = config.profileConcurrency ?? 1;
      const profileLimit = config.profileLimit ?? null;
      const requestDelayMs = config.requestDelayMs ?? 250;

      const prospectsUrl = `${baseUrl}/draft/nfl/${accessLevel}/v1/${language}/${input.draftYear}/prospects.json`;
      const topProspectsUrl = `${baseUrl}/draft/nfl/${accessLevel}/v1/${language}/${input.draftYear}/top_prospects.json`;

      const [prospectsResponse, topProspectsResponse] = await Promise.all([
        fetchJson<SportradarProspectsResponse>(
          prospectsUrl,
          config.apiKey,
          input.signal,
        ),
        fetchJson<SportradarProspectsResponse>(
          topProspectsUrl,
          config.apiKey,
          input.signal,
        ).catch<SportradarProspectsResponse>(() => createEmptyProspectsResponse()),
      ]);

      const byId = new Map<string, RawProspectRecord>();

      for (const prospect of prospectsResponse.prospects ?? []) {
        const mapped = mapProspect(
          prospect,
          input.draftYear,
          prospectsResponse.generated,
        );
        byId.set(mapped.externalId, mapped);
      }

      for (const prospect of topProspectsResponse.prospects ?? []) {
        const mapped = mapProspect(
          prospect,
          input.draftYear,
          topProspectsResponse.generated,
        );
        const existing = byId.get(mapped.externalId);

        if (!existing) {
          byId.set(mapped.externalId, mapped);
          continue;
        }

        existing.rankings = [
          ...(existing.rankings ?? []),
          ...(mapped.rankings ?? []),
        ];
      }

      const prospects = Array.from(byId.values());

      if (!shouldEnrichNcaaStats) {
        return prospects;
      }

      const candidates = prospects.filter((prospect) =>
        prospect.externalIds?.some(
          (externalId) =>
            externalId.provider === "sportradar-ncaa" &&
            externalId.externalType.includes("source_id"),
        ),
      );

      const limitedCandidates =
        profileLimit === null ? candidates : candidates.slice(0, profileLimit);

      await mapWithConcurrency(
        limitedCandidates,
        profileConcurrency,
        async (prospect) => {
          const ncaaSourceId = prospect.externalIds?.find(
            (externalId) =>
              externalId.provider === "sportradar-ncaa" &&
              externalId.externalType.includes("source_id"),
          )?.externalId;

          if (!ncaaSourceId) {
            return prospect;
          }

          const profileUrl = `${baseUrl}/ncaafb/${accessLevel}/v7/${language}/players/${ncaaSourceId}/profile.json`;

          try {
            const profile = await fetchJson<SportradarPlayerProfileResponse>(
              profileUrl,
              config.apiKey,
              input.signal,
            );

            prospect.collegeStats = mapCollegeStatsFromProfile(profile);

            if (requestDelayMs > 0) {
              await new Promise((resolve) => setTimeout(resolve, requestDelayMs));
            }
          } catch {
            // Profile enrichment is best-effort so draft ingestion remains available.
          }

          return prospect;
        },
      );

      return prospects;
    },
  };
}
