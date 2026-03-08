import {
  createMockDraftProviderAdapter,
  type DraftProviderAdapter,
} from "@nfl-draft-watcher/draft-provider";

import { getProspectProviderMode } from "@/lib/env";

// Providers are registered explicitly so ingestion stays behind internal adapters.
export function getProspectProviderAdapters(): DraftProviderAdapter[] {
  const providerMode = getProspectProviderMode();

  if (providerMode === "mock") {
    return [createMockDraftProviderAdapter()];
  }

  return [];
}
