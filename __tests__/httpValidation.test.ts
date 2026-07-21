import { describe, expect, test, vi } from "vitest";
import {
  ValidationError,
  readJsonBody,
  assertPlainObject,
  assertKnownKeys,
  assertRequiredString,
  assertFiniteNumber,
  assertLooseScalar,
  withTimeout,
} from "../app/lib/httpValidation";

function jsonRequest(body: string, contentType = "application/json") {
  return new Request("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
}

describe("readJsonBody", () => {
  test("rejects non-JSON Content-Type", async () => {
    const req = jsonRequest("{}", "text/plain");
    await expect(readJsonBody(req, 1000)).rejects.toThrow(ValidationError);
  });

  test("rejects oversized bodies before parsing", async () => {
    const req = jsonRequest(JSON.stringify({ a: "x".repeat(1000) }));
    await expect(readJsonBody(req, 10)).rejects.toThrow(/too large/);
  });

  test("rejects malformed JSON", async () => {
    const req = jsonRequest("{not valid json");
    await expect(readJsonBody(req, 1000)).rejects.toThrow(/Malformed JSON/);
  });

  test("parses a valid small JSON body", async () => {
    const req = jsonRequest(JSON.stringify({ a: 1 }));
    await expect(readJsonBody(req, 1000)).resolves.toEqual({ a: 1 });
  });
});

describe("assertPlainObject / assertKnownKeys", () => {
  test("rejects arrays and null", () => {
    expect(() => assertPlainObject([], "body")).toThrow(ValidationError);
    expect(() => assertPlainObject(null, "body")).toThrow(ValidationError);
  });

  test("rejects unknown top-level fields", () => {
    const obj = assertPlainObject({ a: 1, evil: "x" }, "body");
    expect(() => assertKnownKeys(obj, ["a"], "body")).toThrow(/unexpected field/);
  });

  test("allows exactly the known fields", () => {
    const obj = assertPlainObject({ a: 1, b: 2 }, "body");
    expect(() => assertKnownKeys(obj, ["a", "b"], "body")).not.toThrow();
  });
});

describe("assertRequiredString", () => {
  test("rejects empty/missing values", () => {
    expect(() => assertRequiredString(undefined, "name")).toThrow(ValidationError);
    expect(() => assertRequiredString("", "name")).toThrow(ValidationError);
  });

  test("rejects strings over the max length", () => {
    expect(() => assertRequiredString("x".repeat(200), "name", 150)).toThrow(/max length/);
  });

  test("accepts a valid string", () => {
    expect(assertRequiredString("Magomed Ankalaev", "name", 150)).toBe("Magomed Ankalaev");
  });
});

describe("assertFiniteNumber", () => {
  test("rejects NaN and Infinity", () => {
    expect(() => assertFiniteNumber(NaN, "odds")).toThrow(ValidationError);
    expect(() => assertFiniteNumber(Infinity, "odds")).toThrow(ValidationError);
    expect(() => assertFiniteNumber(-Infinity, "odds")).toThrow(ValidationError);
  });

  test("rejects out-of-range values", () => {
    expect(() => assertFiniteNumber(999_999_999, "odds", { min: -100_000, max: 100_000 })).toThrow(/out of range/);
  });

  test("rejects non-numeric strings smuggled as numbers", () => {
    expect(() => assertFiniteNumber("100" as unknown as number, "odds")).toThrow(ValidationError);
  });

  test("accepts zero and negative odds", () => {
    expect(assertFiniteNumber(0, "odds")).toBe(0);
    expect(assertFiniteNumber(-550, "odds")).toBe(-550);
  });
});

describe("assertLooseScalar", () => {
  test("allows undefined/null (optional field)", () => {
    expect(() => assertLooseScalar(undefined, "field")).not.toThrow();
    expect(() => assertLooseScalar(null, "field")).not.toThrow();
  });

  test("rejects nested objects and arrays (no prototype-pollution surface)", () => {
    expect(() => assertLooseScalar({ nested: true }, "field")).toThrow(ValidationError);
    expect(() => assertLooseScalar([1, 2, 3], "field")).toThrow(ValidationError);
  });

  test("rejects oversized strings", () => {
    expect(() => assertLooseScalar("x".repeat(400), "field", 300)).toThrow(/exceeds max length/);
  });

  test("rejects non-finite numbers", () => {
    expect(() => assertLooseScalar(NaN, "field")).toThrow(ValidationError);
  });
});

describe("withTimeout", () => {
  test("rejects when the wrapped promise takes longer than the timeout", async () => {
    vi.useFakeTimers();
    const neverResolves = new Promise(() => {});
    const race = withTimeout(neverResolves, 50);
    const assertion = expect(race).rejects.toThrow(/timed out/);
    await vi.advanceTimersByTimeAsync(51);
    await assertion;
    vi.useRealTimers();
  });

  test("resolves normally when the wrapped promise is fast", async () => {
    await expect(withTimeout(Promise.resolve("ok"), 1000)).resolves.toBe("ok");
  });
});
