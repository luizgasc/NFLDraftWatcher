import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

export async function createSupabaseServerClient() {
  if (!clientEnv.success) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(
    clientEnv.data.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );
}
