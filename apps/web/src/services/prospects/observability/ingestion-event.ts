import type {
  IngestionEntityType,
  SyncRunCounters,
  SyncRunStatus,
} from "@nfl-draft-watcher/domain";

export type IngestionEvent = {
  sourceName: string;
  entityType: IngestionEntityType;
  startedAt: string;
  finishedAt?: string;
  status: SyncRunStatus;
  counters: SyncRunCounters;
  errorMessage?: string | null;
};

export function createIngestionEvent(
  sourceName: string,
  entityType: IngestionEntityType,
): IngestionEvent {
  return {
    sourceName,
    entityType,
    startedAt: new Date().toISOString(),
    status: "running",
    counters: {
      fetched: 0,
      staged: 0,
      inserted: 0,
      updated: 0,
      skipped: 0,
      conflicts: 0,
    },
  };
}
