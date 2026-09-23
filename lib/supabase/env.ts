/**
 * Utility to resolve and sanitize Supabase environment variables.
 * Accepts either NEXT_PUBLIC_ prefixed names or unprefixed names (e.g. on Vercel),
 * and strips any accidental trailing slashes or /rest/v1 paths.
 */
export function getSupabaseEnv() {
  const rawUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    '';

  const cleanUrl = rawUrl
    ? rawUrl.trim().replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '')
    : '';

  const anonKey = (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  ).trim();

  const serviceRoleKey = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  ).trim();

  return {
    url: cleanUrl || undefined,
    anonKey: anonKey || undefined,
    serviceRoleKey: serviceRoleKey || undefined,
  };
}
