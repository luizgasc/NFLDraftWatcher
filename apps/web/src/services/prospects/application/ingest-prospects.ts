import {
  type DraftProviderAdapter,
  type RawProspectRecord,
} from "@nfl-draft-watcher/draft-provider";
import { syncRunSummarySchema, type SyncRunSummary } from "@nfl-draft-watcher/domain";

import { normalizeProspectRecord } from "@/services/prospects/mappers/normalize-prospect";
import { createIngestionEvent } from "@/services/prospects/observability/ingestion-event";
import type { ProspectRepository } from "@/services/prospects/repositories/prospect-repository";
import { withRetry } from "@/services/prospects/retries/with-retry";
import { createStagedRawRecord } from "@/services/prospects/staging/staged-record";

type RunProspectIngestionInput = {
  adapters: DraftProviderAdapter[];
  repository: ProspectRepository;
  draftYear: number;
};

function requiresManualReview(record: RawProspectRecord) {
  return !record.fullName.trim() || !record.position.trim() || !record.college.trim();
}

export async function runProspectIngestion({
  adapters,
  repository,
  draftYear,
}: RunProspectIngestionInput): Promise<SyncRunSummary[]> {
  if (adapters.length === 0) {
    throw new Error("No prospect provider adapters are registered.");
  }

  const summaries: SyncRunSummary[] = [];

  for (const adapter of adapters) {
    const event = createIngestionEvent(adapter.providerName, "prospect");
    const runId = await repository.startSyncRun(adapter.providerName);

    try {
      const rawRecords = await withRetry(
        () => adapter.fetchProspects({ draftYear }),
        {
          retries: 2,
          delayMs: 500,
        },
      );

      event.counters.fetched = rawRecords.length;

      const stagedRecords = rawRecords.map((record) =>
        createStagedRawRecord(
          adapter.providerName,
          "prospect",
          record.externalId,
          record,
        ),
      );

      await repository.stageRecords(stagedRecords);
      event.counters.staged = stagedRecords.length;

      for (const record of rawRecords) {
        if (requiresManualReview(record)) {
          event.counters.conflicts += 1;

          await repository.queueReviewItem({
            provider: adapter.providerName,
            entityType: "prospect",
            externalId: record.externalId,
            reason: "Missing one or more canonical identity fields.",
            payload: record,
            status: "open",
          });

          continue;
        }

        const normalized = normalizeProspectRecord(adapter.providerName, record);
        const matchResult = await repository.matchProspect(normalized);

        if (matchResult.kind === "ambiguous") {
          event.counters.conflicts += 1;

          await repository.queueReviewItem({
            provider: adapter.providerName,
            entityType: "prospect",
            externalId: record.externalId,
            reason:
              "Ambiguous identity match. Multiple internal prospects matched strict identity fields.",
            payload: {
              record,
              candidateIds: matchResult.candidateIds,
            },
            status: "open",
          });

          continue;
        }

        const result = await repository.upsertProspectBundle(
          normalized,
          matchResult.kind === "matched" ? matchResult.prospectId : undefined,
        );

        if (result === "inserted") {
          event.counters.inserted += 1;
        } else if (result === "updated") {
          event.counters.updated += 1;
        } else {
          event.counters.skipped += 1;
        }
      }

      const summary = syncRunSummarySchema.parse({
        sourceName: adapter.providerName,
        entityType: "prospect",
        startedAt: event.startedAt,
        finishedAt: new Date().toISOString(),
        status: "completed",
        counters: event.counters,
        errorMessage: null,
      });

      await repository.completeSyncRun(runId, summary);
      summaries.push(summary);
    } catch (error) {
      const summary = syncRunSummarySchema.parse({
        sourceName: adapter.providerName,
        entityType: "prospect",
        startedAt: event.startedAt,
        finishedAt: new Date().toISOString(),
        status: "failed",
        counters: event.counters,
        errorMessage: error instanceof Error ? error.message : "Unknown error",
      });

      await repository.failSyncRun(runId, summary);
      throw error;
    }
  }

  return summaries;
}
