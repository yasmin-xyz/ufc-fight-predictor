import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const supabaseState = vi.hoisted(() => ({
  rpcImpl: async (name: string, _params?: any): Promise<{ data: any; error: any }> => {
    if (name === "acquire_sync_lock") return { data: true, error: null };
    if (name === "release_sync_lock") return { data: null, error: null };
    return { data: [{ allowed: true, current_count: 1, retry_after_seconds: 0 }], error: null };
  },
}));

vi.mock("../app/lib/ufcEvent", () => ({
  fetchCurrentUfcEvent: async () => ({
    eventName: "Test Event",
    fights: [{ fighterA: "Fighter One", fighterB: "Fighter Two" }],
  }),
}));

vi.mock("../app/lib/fighterSync", () => ({
  peekFighterMetrics: async () => ({ status: "cached", needsRefresh: false, providerSlug: "fighter-one" }),
  peekFighterHistory: async () => ({ status: "cached", needsRefresh: false, history: [] }),
  syncFighter: async () => ({
    metrics: { cacheStatus: "cached" },
    history: { cacheStatus: "cached" },
  }),
}));

vi.mock("../app/lib/citoProvider", () => ({
  resetCitoCallCount: () => {},
  getCitoCallCount: () => 0,
}));

vi.mock("../app/lib/supabaseAdmin", () => ({
  supabaseAdmin: { rpc: async (name: string, params: any) => supabaseState.rpcImpl(name, params) },
}));

import * as routeModule from "../app/api/admin/fighter-sync/route";

const SECRET = "test-only-secret-value-not-real";

function postRequest(headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/admin/fighter-sync", { method: "POST", headers });
}

beforeEach(() => {
  vi.stubEnv("FIGHTER_SYNC_SECRET", SECRET);
  supabaseState.rpcImpl = async (name: string) => {
    if (name === "acquire_sync_lock") return { data: true, error: null };
    if (name === "release_sync_lock") return { data: null, error: null };
    return { data: [{ allowed: true, current_count: 1, retry_after_seconds: 0 }], error: null };
  };
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/admin/fighter-sync — authorization", () => {
  test("rejects a request with no Authorization header", async () => {
    const res = await routeModule.POST(postRequest());
    expect(res.status).toBe(401);
  });

  test("rejects the old x-fighter-sync-secret header style (migrated off it)", async () => {
    const res = await routeModule.POST(postRequest({ "x-fighter-sync-secret": SECRET }));
    expect(res.status).toBe(401);
  });

  test("rejects an incorrect bearer token", async () => {
    const res = await routeModule.POST(postRequest({ Authorization: "Bearer wrong-value" }));
    expect(res.status).toBe(401);
  });

  test("fails closed when FIGHTER_SYNC_SECRET is not configured, even with a matching-looking header", async () => {
    vi.stubEnv("FIGHTER_SYNC_SECRET", "");
    const res = await routeModule.POST(postRequest({ Authorization: "Bearer anything" }));
    expect(res.status).toBe(401);
  });

  test("accepts a correct bearer token", async () => {
    const res = await routeModule.POST(postRequest({ Authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(200);
  });

  test("does not leak the configured secret in an error response", async () => {
    const res = await routeModule.POST(postRequest({ Authorization: "Bearer wrong-value" }));
    const text = await res.text();
    expect(text).not.toContain(SECRET);
  });
});

describe("POST /api/admin/fighter-sync — rate limiting and locking", () => {
  test("returns 429 with Retry-After when rate-limited", async () => {
    supabaseState.rpcImpl = async (name: string) => {
      if (name === "check_rate_limit") {
        return { data: [{ allowed: false, current_count: 11, retry_after_seconds: 900 }], error: null };
      }
      return { data: true, error: null };
    };

    const res = await routeModule.POST(postRequest({ Authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("900");
  });

  test("returns 409 when a sync is already in progress", async () => {
    supabaseState.rpcImpl = async (name: string) => {
      if (name === "acquire_sync_lock") return { data: false, error: null };
      return { data: [{ allowed: true, current_count: 1, retry_after_seconds: 0 }], error: null };
    };

    const res = await routeModule.POST(postRequest({ Authorization: `Bearer ${SECRET}` }));
    expect(res.status).toBe(409);
  });
});
