import { createBrowserClient } from "@supabase/ssr";
import { requireSupabaseEnv } from "./config";
import type { Database } from "./types";

export function createClient() {
  const { url, key } = requireSupabaseEnv();
  return createBrowserClient<Database>(url, key);
}
