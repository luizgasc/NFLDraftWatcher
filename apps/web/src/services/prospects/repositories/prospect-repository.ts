import type {
  ManualReviewItem,
  NormalizedProspectBundle,
  StagedRawRecord,
  SyncRunSummary,
} from "@nfl-draft-watcher/domain";

export type ProspectUpsertResult = "inserted" | "updated" | "skipped";
export type ProspectMatchResult =
  | { kind: "matched"; prospectId: string }
  | { kind: "none" }
  | { kind: "ambiguous"; candidateIds: string[] };

export interface ProspectRepository {
  startSyncRun(sourceName: string): Promise<string>;
  stageRecords(records: StagedRawRecord[]): Promise<void>;
  matchProspect(bundle: NormalizedProspectBundle): Promise<ProspectMatchResult>;
  upsertProspectBundle(
    bundle: NormalizedProspectBundle,
    matchedProspectId?: string,
  ): Promise<ProspectUpsertResult>;
  queueReviewItem(item: ManualReviewItem): Promise<void>;
  completeSyncRun(runId: string, summary: SyncRunSummary): Promise<void>;
  failSyncRun(runId: string, summary: SyncRunSummary): Promise<void>;
}
