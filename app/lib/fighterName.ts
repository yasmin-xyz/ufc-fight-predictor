export function normalizeFighterName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, "-")
    .trim();
}

// For comparing two display names for an exact match (case/whitespace/basic
// punctuation insensitive) without attempting nickname/alias resolution.
export function namesMatchExactly(a: string, b: string) {
  const clean = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  return clean(a) === clean(b);
}
