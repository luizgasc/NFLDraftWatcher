import type { DraftProviderAdapter } from "./index";
import type { FetchDraftProspectsInput, RawProspectRecord } from "./types";

type SportradarDraftProviderConfig = {
  apiKey: string;
  accessLevel?: "trial" | "official";
  language?: string;
  baseUrl?: string;
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
  const response = await fetch(url, {
    headers: {
      "x-api-key": apiKey,
      accept: "application/json",
    },
    signal,
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Sportradar request failed with ${response.status}: ${text.slice(0, 200)}`,
    );
  }

  return (await response.json()) as T;
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
        ).catch(() => createEmptyProspectsResponse()),
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

      return Array.from(byId.values());
    },
  };
}
