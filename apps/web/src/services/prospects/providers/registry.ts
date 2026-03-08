import type { DraftProviderAdapter } from "@nfl-draft-watcher/draft-provider";

// Providers are registered explicitly so ingestion stays behind internal adapters.
export function getProspectProviderAdapters(): DraftProviderAdapter[] {
  return [];
}
