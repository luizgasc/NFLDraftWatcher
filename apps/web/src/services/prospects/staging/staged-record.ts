import type {
  IngestionEntityType,
  StagedRawRecord,
} from "@nfl-draft-watcher/domain";

export function createStagedRawRecord(
  provider: string,
  entityType: IngestionEntityType,
  externalId: string,
  payload: unknown,
): StagedRawRecord {
  return {
    provider,
    entityType,
    externalId,
    payload,
    fetchedAt: new Date().toISOString(),
  };
}
