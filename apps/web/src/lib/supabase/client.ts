import { createBrowserClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

export function createSupabaseBrowserClient() {
  if (!clientEnv.success) {
    return null;
  }

  return createBrowserClient(
    clientEnv.data.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
