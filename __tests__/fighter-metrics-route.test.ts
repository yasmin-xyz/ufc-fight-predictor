import { beforeEach, describe, expect, test } from "vitest";
import { vi } from "vitest";

const supabaseState = vi.hoisted(() => ({
  rpcImpl: async (_name: string, _params?: any): Promise<{ data: any; error: any }> => ({
    data: [{ allowed: true, current_count: 1, retry_after_seconds: 0 }],
    error: null,
  }),
}));

vi.mock("../app/lib/fighterSync", () => ({
  peekFighterMetrics: async (name: string) => ({
    status: "cached",
    needsRefresh: false,
    providerSlug: name.toLowerCase().replace(/\s+/g, "-"),
    metrics: { slpm: "4.0" },
  }),
  peekFighterHistory: async () => ({ status: "cached", needsRefresh: false, history: [] }),
  syncFighter: async () => ({ metrics: { cacheStatus: "cached" }, history: { cacheStatus: "cached" } }),
}));

vi.mock("../app/lib/citoProvider", () => ({
  isCitoConfigured: () => true,
}));

vi.mock("../app/lib/supabaseAdmin", () => ({
  supabaseAdmin: { rpc: async (name: string, params: any) => supabaseState.rpcImpl(name, params) },
}));

import * as routeModule from "../app/api/fighter-metrics/route";

function postRequest(body: unknown, headers: Record<string, string> = { "Content-Type": "application/json" }) {
  return new Request("http://localhost/api/fighter-metrics", {
    method: "POST",
    headers,
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(() => {
  supabaseState.rpcImpl = async () => ({
    data: [{ allowed: true, current_count: 1, retry_after_seconds: 0 }],
    error: null,
  });
});

describe("POST /api/fighter-metrics — validation", () => {
  test("rejects a non-array names field", async () => {
    const res = await routeModule.POST(postRequest({ names: "Fighter One" }));
    expect(res.status).toBe(400);
  });

  test("rejects an empty names array", async () => {
    const res = await routeModule.POST(postRequest({ names: [] }));
    expect(res.status).toBe(400);
  });

  test("rejects a name over the length cap", async () => {
    const res = await routeModule.POST(postRequest({ names: ["x".repeat(200)] }));
    expect(res.status).toBe(400);
  });

  test("rejects malformed JSON", async () => {
    const res = await routeModule.POST(postRequest("{not json"));
    expect(res.status).toBe(400);
  });

  test("caps at 10 names and de-dupes without erroring", async () => {
    const names = Array.from({ length: 15 }, (_, i) => `Fighter ${i}`);
    const res = await routeModule.POST(postRequest({ names }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Object.keys(body.metrics).length).toBeLessThanOrEqual(10);
  });

  test("accepts a well-formed request", async () => {
    const res = await routeModule.POST(postRequest({ names: ["Fighter One", "Fighter Two"] }));
    expect(res.status).toBe(200);
  });
});

describe("POST /api/fighter-metrics — rate limiting", () => {
  test("returns 429 with Retry-After when rate-limited", async () => {
    supabaseState.rpcImpl = async () => ({
      data: [{ allowed: false, current_count: 31, retry_after_seconds: 30 }],
      error: null,
    });

    const res = await routeModule.POST(postRequest({ names: ["Fighter One"] }));
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
  });
});
