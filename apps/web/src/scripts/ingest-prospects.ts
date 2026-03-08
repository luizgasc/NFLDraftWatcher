import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runProspectIngestion } from "@/services/prospects/application/ingest-prospects";
import { getProspectProviderAdapters } from "@/services/prospects/providers/registry";
import { SupabaseProspectRepository } from "@/services/prospects/repositories/supabase-prospect-repository";

function parseDraftYear(argv: string[]) {
  const draftYearFlagIndex = argv.findIndex((arg) => arg === "--draft-year");
  const draftYearValue =
    draftYearFlagIndex >= 0 ? argv[draftYearFlagIndex + 1] : process.env.DRAFT_YEAR;
  const numericDraftYear = Number(draftYearValue);

  if (!Number.isInteger(numericDraftYear) || numericDraftYear < 2000) {
    throw new Error(
      "Provide a valid draft year via --draft-year <year> or DRAFT_YEAR=<year>.",
    );
  }

  return numericDraftYear;
}

async function main() {
  const draftYear = parseDraftYear(process.argv.slice(2));
  const adapters = getProspectProviderAdapters();

  if (adapters.length === 0) {
    throw new Error(
      "No prospect provider adapters are registered. Set PROSPECT_PROVIDER_MODE=mock or wire a real adapter.",
    );
  }

  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    throw new Error(
      "Missing Supabase admin configuration. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const repository = new SupabaseProspectRepository(supabase);
  const summaries = await runProspectIngestion({
    adapters,
    repository,
    draftYear,
  });

  console.log(
    JSON.stringify(
      {
        draftYear,
        providers: adapters.map((adapter) => adapter.providerName),
        summaries,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Unexpected ingestion script error.",
  );
  process.exit(1);
});
