import type {
  ManualReviewItem,
  NormalizedProspectBundle,
  StagedRawRecord,
  SyncRunSummary,
} from "@nfl-draft-watcher/domain";
import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ProspectRepository,
  ProspectMatchResult,
  ProspectUpsertResult,
} from "./prospect-repository";

type ProspectRow = {
  id: string;
  slug: string;
  draft_year: number;
};

export class SupabaseProspectRepository implements ProspectRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async startSyncRun(sourceName: string) {
    const { data, error } = await this.supabase
      .from("sync_runs")
      .insert({
        source_name: sourceName,
        entity_type: "prospect",
        status: "running",
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return data.id as string;
  }

  async stageRecords(records: StagedRawRecord[]) {
    if (records.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("staging_prospects_raw").insert(
      records.map((record) => ({
        provider: record.provider,
        entity_type: record.entityType,
        external_id: record.externalId,
        payload: record.payload,
        fetched_at: record.fetchedAt,
      })),
    );

    if (error) {
      throw error;
    }
  }

  async matchProspect(bundle: NormalizedProspectBundle): Promise<ProspectMatchResult> {
    const externalId = bundle.externalIds[0];

    if (externalId) {
      const byExternalId = await this.findProspectByExternalId(
        externalId.provider,
        externalId.externalId,
      );

      if (byExternalId) {
        return {
          kind: "matched",
          prospectId: byExternalId.id,
        };
      }
    }

    const strictCandidates = await this.findProspectsByIdentity(bundle);

    if (strictCandidates.length === 1) {
      return {
        kind: "matched",
        prospectId: strictCandidates[0].id,
      };
    }

    if (strictCandidates.length > 1) {
      return {
        kind: "ambiguous",
        candidateIds: strictCandidates.map((candidate) => candidate.id),
      };
    }

    return { kind: "none" };
  }

  async upsertProspectBundle(
    bundle: NormalizedProspectBundle,
    matchedProspectId?: string,
  ): Promise<ProspectUpsertResult> {
    const currentProspect = matchedProspectId
      ? await this.findProspectById(matchedProspectId)
      : await this.findProspectBySlug(
          bundle.prospect.slug,
          bundle.prospect.draftYear,
        );

    const { data: prospectData, error: prospectError } = await this.supabase
      .from("prospects")
      .upsert(
        {
          id: currentProspect?.id,
          full_name: bundle.prospect.fullName,
          slug: bundle.prospect.slug,
          position: bundle.prospect.position,
          college: bundle.prospect.college,
          height_inches: bundle.prospect.heightInches,
          weight_pounds: bundle.prospect.weightPounds,
          age: bundle.prospect.age,
          hometown: bundle.prospect.hometown,
          bio: bundle.prospect.bio,
          draft_year: bundle.prospect.draftYear,
          status: bundle.prospect.status,
          image_url: bundle.prospect.imageUrl,
        },
        { onConflict: "slug,draft_year" },
      )
      .select("id")
      .single();

    if (prospectError) {
      throw prospectError;
    }

    const prospectId = prospectData.id as string;

    await this.upsertExternalIds(prospectId, bundle);
    await this.upsertMeasurements(prospectId, bundle);
    await this.upsertCollegeStats(prospectId, bundle);
    await this.upsertRankings(prospectId, bundle);
    await this.upsertReports(prospectId, bundle);

    return currentProspect ? "updated" : "inserted";
  }

  async queueReviewItem(item: ManualReviewItem) {
    const { error } = await this.supabase.from("data_review_queue").insert({
      provider: item.provider,
      entity_type: item.entityType,
      external_id: item.externalId,
      reason: item.reason,
      payload: item.payload,
      status: item.status,
    });

    if (error) {
      throw error;
    }
  }

  async completeSyncRun(runId: string, summary: SyncRunSummary) {
    const { error } = await this.supabase
      .from("sync_runs")
      .update({
        finished_at: summary.finishedAt,
        status: summary.status,
        fetched_rows: summary.counters.fetched,
        staged_rows: summary.counters.staged,
        inserted_rows: summary.counters.inserted,
        updated_rows: summary.counters.updated,
        skipped_rows: summary.counters.skipped,
        conflicts: summary.counters.conflicts,
        error_output: summary.errorMessage,
      })
      .eq("id", runId);

    if (error) {
      throw error;
    }
  }

  async failSyncRun(runId: string, summary: SyncRunSummary) {
    await this.completeSyncRun(runId, summary);
  }

  private async findProspectByExternalId(provider: string, externalId: string) {
    const { data, error } = await this.supabase
      .from("prospect_external_ids")
      .select("prospect_id")
      .eq("provider", provider)
      .eq("external_id", externalId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!data?.prospect_id) {
      return null;
    }

    const { data: prospect, error: prospectError } = await this.supabase
      .from("prospects")
      .select("id, slug, draft_year")
      .eq("id", data.prospect_id)
      .maybeSingle();

    if (prospectError) {
      throw prospectError;
    }

    return (prospect as ProspectRow | null) ?? null;
  }

  private async findProspectBySlug(slug: string, draftYear: number) {
    const { data, error } = await this.supabase
      .from("prospects")
      .select("id, slug, draft_year")
      .eq("slug", slug)
      .eq("draft_year", draftYear)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as ProspectRow | null) ?? null;
  }

  private async findProspectById(id: string) {
    const { data, error } = await this.supabase
      .from("prospects")
      .select("id, slug, draft_year")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return (data as ProspectRow | null) ?? null;
  }

  private async findProspectsByIdentity(bundle: NormalizedProspectBundle) {
    const { data, error } = await this.supabase
      .from("prospects")
      .select("id, slug, draft_year")
      .eq("full_name", bundle.prospect.fullName)
      .eq("college", bundle.prospect.college)
      .eq("position", bundle.prospect.position)
      .eq("draft_year", bundle.prospect.draftYear);

    if (error) {
      throw error;
    }

    return (data as ProspectRow[] | null) ?? [];
  }

  private async upsertExternalIds(
    prospectId: string,
    bundle: NormalizedProspectBundle,
  ) {
    if (bundle.externalIds.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("prospect_external_ids").upsert(
      bundle.externalIds.map((externalId) => ({
        prospect_id: prospectId,
        provider: externalId.provider,
        external_id: externalId.externalId,
        external_type: externalId.externalType,
      })),
      { onConflict: "provider,external_id" },
    );

    if (error) {
      throw error;
    }
  }

  private async upsertMeasurements(
    prospectId: string,
    bundle: NormalizedProspectBundle,
  ) {
    if (bundle.measurements.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("prospect_measurements").upsert(
      bundle.measurements.map((measurement) => ({
        prospect_id: prospectId,
        metric_type: measurement.metricType,
        metric_value: measurement.metricValue,
        metric_unit: measurement.metricUnit,
        event_type: measurement.eventType,
        source_type: measurement.sourceType,
        source_name: measurement.sourceName,
        confidence: measurement.confidence,
        recorded_at: measurement.recordedAt,
        draft_year: measurement.draftYear,
      })),
      {
        onConflict:
          "prospect_id,metric_type,metric_unit,event_type,source_name,recorded_at",
      },
    );

    if (error) {
      throw error;
    }
  }

  private async upsertCollegeStats(
    prospectId: string,
    bundle: NormalizedProspectBundle,
  ) {
    if (bundle.collegeStats.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("prospect_college_stats").upsert(
      bundle.collegeStats.map((stat) => ({
        prospect_id: prospectId,
        season: stat.season,
        team_name: stat.teamName,
        stat_category: stat.statCategory,
        stat_name: stat.statName,
        stat_value: stat.statValue,
        source_name: stat.sourceName,
        confidence: stat.confidence,
      })),
      {
        onConflict:
          "prospect_id,season,team_name,stat_category,stat_name,source_name",
      },
    );

    if (error) {
      throw error;
    }
  }

  private async upsertRankings(
    prospectId: string,
    bundle: NormalizedProspectBundle,
  ) {
    if (bundle.rankings.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("prospect_rankings").upsert(
      bundle.rankings.map((ranking) => ({
        prospect_id: prospectId,
        source_name: ranking.sourceName,
        ranking_type: ranking.rankingType,
        ranking_value: ranking.rankingValue,
        grade_value: ranking.gradeValue,
        draft_year: ranking.draftYear,
      })),
      { onConflict: "prospect_id,source_name,ranking_type,draft_year" },
    );

    if (error) {
      throw error;
    }
  }

  private async upsertReports(
    prospectId: string,
    bundle: NormalizedProspectBundle,
  ) {
    if (bundle.reports.length === 0) {
      return;
    }

    const { error } = await this.supabase.from("prospect_reports").upsert(
      bundle.reports.map((report) => ({
        prospect_id: prospectId,
        source_name: report.sourceName,
        summary: report.summary,
        strengths: report.strengths,
        weaknesses: report.weaknesses,
        projection: report.projection,
      })),
      { onConflict: "prospect_id,source_name" },
    );

    if (error) {
      throw error;
    }
  }
}
