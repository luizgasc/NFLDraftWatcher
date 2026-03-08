import { AlertCircle, Database, LayoutGrid, ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { LoadingSkeleton } from "@/components/shared/LoadingSkeleton";
import { PageContainer } from "@/components/shared/PageContainer";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getEnvErrorMessage, isSupabaseConfigured } from "@/lib/env";

const foundationCards = [
  {
    title: "Clean UI system",
    description:
      "Shared primitives and restrained visual tokens establish a readable foundation before product features land.",
    icon: LayoutGrid,
  },
  {
    title: "Supabase scaffolding",
    description:
      "Client and server helpers are prepared behind internal utilities so future features stay provider-safe.",
    icon: Database,
  },
  {
    title: "Auth-aware baseline",
    description:
      "The structure anticipates auth and future RLS concerns without coupling early UI to implementation details.",
    icon: ShieldCheck,
  },
];

export default function Home() {
  const envErrorMessage = getEnvErrorMessage();
  const supabaseConfigured = isSupabaseConfigured();

  return (
    <PageContainer className="space-y-10">
      <section className="space-y-6">
        <SectionHeader
          eyebrow="M0 Foundation"
          title="NFL Draft Watcher"
          description="A modern, data-first foundation for prospects, boards, community, and news. This first milestone establishes the system without jumping into feature delivery."
          action={<Button variant="secondary">Foundation Ready</Button>}
        />

        <div className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr]">
          <Card className="bg-card/85 backdrop-blur">
            <CardHeader>
              <CardTitle>Current build state</CardTitle>
              <CardDescription>
                The app shell, design tokens, shared states, import aliases, and
                Supabase utilities are in place for the next milestone.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {foundationCards.map(({ title, description, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-lg border border-border/70 bg-background/70 p-4"
                >
                  <Icon className="mb-3 h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {description}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          {supabaseConfigured ? (
            <EmptyState
              title="Supabase configuration detected"
              description="Environment variables are available, so the foundation is ready to support authenticated server-first flows in the next milestone."
            />
          ) : (
            <ErrorState
              title="Supabase environment variables missing"
              description={
                envErrorMessage ??
                "Add the public Supabase URL and anon key before enabling authenticated or data-backed flows."
              }
            />
          )}
        </div>
      </section>

      <Separator />

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Shared state primitives</CardTitle>
            <CardDescription>
              Every roadmap feature must ship with loading, empty, and error
              handling. These primitives are ready for reuse.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <LoadingSkeleton rows={3} />
            <EmptyState
              title="No feature data yet"
              description="Foundation mode intentionally avoids prospect, news, board, or chat functionality."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What happens next</CardTitle>
            <CardDescription>
              The roadmap now points next to normalized prospect ingestion, then
              Prospect Hub delivery on top of internal models.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <div className="rounded-lg border border-border/70 bg-muted/20 p-4">
              <p className="font-medium text-foreground">Next milestone: M1</p>
              <p className="mt-1">
                Introduce crawler entrypoints, internal prospect schemas,
                normalization rules, and persistence boundaries.
              </p>
            </div>
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p>
                  Prospect Hub, comparison views, boards, news, and chat remain
                  intentionally out of scope for this milestone.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </PageContainer>
  );
}
