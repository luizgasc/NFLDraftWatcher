import type { FetchDraftProspectsInput, RawProspectRecord } from "./types";

export interface DraftProviderAdapter {
  readonly providerName: string;
  fetchProspects(input: FetchDraftProspectsInput): Promise<RawProspectRecord[]>;
}

export * from "./http-draft-provider";
export * from "./mock-draft-provider";
export * from "./sportradar-draft-provider";
export * from "./types";
