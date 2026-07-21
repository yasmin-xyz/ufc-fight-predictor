import "server-only";
import { supabaseAdmin } from "./supabaseAdmin";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

// Backed by the check_rate_limit() Postgres function (see
// supabase/migrations/0004_rate_limits.sql) rather than an in-memory Map,
// since Vercel serverless instances don't share memory reliably — a
// per-instance counter would let an attacker get a fresh limit on every
// cold start / new instance.
export async function checkRateLimit(
  key: string,
  windowSeconds: number,
  limit: number
): Promise<RateLimitResult> {
  const { data, error } = await supabaseAdmin.rpc("check_rate_limit", {
    p_key: key,
    p_window_seconds: windowSeconds,
    p_limit: limit,
  });

  if (error) {
    console.error(`[rateLimit] check failed for key "${key}":`, error.message);
    // Fail open: consistent with how this app already treats Supabase
    // outages elsewhere (e.g. the prediction cache read) — an
    // infrastructure hiccup here shouldn't take the whole API down.
    // Residual abuse risk during a Supabase outage is accepted; each
    // provider call is still bounded by its own upstream quota/timeout.
    return { allowed: true, retryAfterSeconds: 0 };
  }

  const row = Array.isArray(data) ? data[0] : data;
  return {
    allowed: row?.allowed ?? true,
    retryAfterSeconds: row?.retry_after_seconds ?? 0,
  };
}

// Vercel's edge appends the connecting client's IP to the end of
// x-forwarded-for (any earlier entries came from the client itself, or a
// further upstream proxy, and are attacker-controllable) — so the last
// entry is the one Vercel itself observed and is what should be trusted
// for rate-limit bucketing. Falls back to x-real-ip, then a fixed bucket
// shared by all callers if neither header is present (e.g. local dev),
// which degrades to a single shared limit rather than no limit at all.
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim());
    const last = parts[parts.length - 1];
    if (last) return last;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

export function rateLimitResponse(retryAfterSeconds: number): Response {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(retryAfterSeconds),
    },
  });
}
