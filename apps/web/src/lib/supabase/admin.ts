import { createClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

export function createSupabaseAdminClient() {
  if (!env.success || !env.data.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return createClient(
    env.data.NEXT_PUBLIC_SUPABASE_URL,
    env.data.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}
