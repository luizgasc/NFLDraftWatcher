import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import { clientEnv } from "@/lib/env";

export function updateSupabaseSession(request: NextRequest) {
  if (!clientEnv.success) {
    return NextResponse.next({
      request,
    });
  }

  const response = NextResponse.next({
    request,
  });

  createServerClient(
    clientEnv.data.NEXT_PUBLIC_SUPABASE_URL,
    clientEnv.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    },
  );

  return response;
}
