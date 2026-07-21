import { vi } from "vitest";

// The real server-only package throws unless the bundler sets the
// "react-server" condition (which only Next's own build does) — stub it
// out so lib modules that import it can be unit tested with plain Vite.
vi.mock("server-only", () => ({}));
