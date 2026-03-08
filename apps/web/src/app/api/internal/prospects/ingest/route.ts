import { NextResponse } from "next/server";
import { z } from "zod";

import { getInternalIngestToken, hasSupabaseAdminAccess } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { runProspectIngestion } from "@/services/prospects/application/ingest-prospects";
import { getProspectProviderAdapters } from "@/services/prospects/providers/registry";
import { SupabaseProspectRepository } from "@/services/prospects/repositories/supabase-prospect-repository";

const requestSchema = z.object({
  draftYear: z.number().int().min(2000),
});

export async function POST(request: Request) {
  try {
    const expectedToken = getInternalIngestToken();

    if (!expectedToken) {
      return NextResponse.json(
        {
          error:
            "Prospect ingestion is disabled until INTERNAL_INGEST_TOKEN is set.",
        },
        { status: 503 },
      );
    }

    const authorization = request.headers.get("authorization");

    if (authorization !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!hasSupabaseAdminAccess()) {
      return NextResponse.json(
        {
          error:
            "Supabase admin access is required for ingestion. Configure SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 503 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsedBody = requestSchema.safeParse(body);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: parsedBody.error.flatten() },
        { status: 400 },
      );
    }

    const adapters = getProspectProviderAdapters();

    if (adapters.length === 0) {
      return NextResponse.json(
        {
          error:
            "No prospect provider adapters are registered. Wire an internal adapter before running ingestion.",
        },
        { status: 503 },
      );
    }

    const supabase = createSupabaseAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "Unable to create Supabase admin client." },
        { status: 503 },
      );
    }

    const repository = new SupabaseProspectRepository(supabase);
    const summaries = await runProspectIngestion({
      adapters,
      repository,
      draftYear: parsedBody.data.draftYear,
    });

    return NextResponse.json({ summaries });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected ingestion failure.",
      },
      { status: 500 },
    );
  }
}
