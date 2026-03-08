import {
  createSportradarDraftProviderAdapter,
  createMockDraftProviderAdapter,
  type DraftProviderAdapter,
} from "@nfl-draft-watcher/draft-provider";

import { getProspectProviderMode, getSportradarConfig } from "@/lib/env";

// Providers are registered explicitly so ingestion stays behind internal adapters.
export function getProspectProviderAdapters(): DraftProviderAdapter[] {
  const providerMode = getProspectProviderMode();

  if (providerMode === "mock") {
    return [createMockDraftProviderAdapter()];
  }

  if (providerMode === "sportradar") {
    const config = getSportradarConfig();

    if (!config) {
      return [];
    }

    return [createSportradarDraftProviderAdapter(config)];
  }

  return [];
}
