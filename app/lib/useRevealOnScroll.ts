import { useEffect, useRef, useState } from "react";

// Attach `ref` to a DOM node that's always mounted (not one that swaps
// in/out with a loading state) — the returned `visible` flips true the
// first time that node scrolls into the viewport after `resetKey` last
// changed. Passing a new `resetKey` (e.g. the selected fight's id) resets
// `visible` to false and re-arms the observer, so switching fights
// re-plays the reveal — immediately, without waiting for another scroll,
// if the section is already on screen when the key changes (an
// IntersectionObserver fires its callback once right after `observe()`
// if the element already matches).
export function useRevealOnScroll<T extends HTMLElement>(resetKey: unknown) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion || typeof IntersectionObserver === "undefined") {
      // Skip the scroll-gated reveal entirely rather than delaying content
      // behind a motion preference the user has explicitly opted out of.
      setVisible(true);
      return;
    }

    setVisible(false);

    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: "0px 0px -10% 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [resetKey]);

  return { ref, visible };
}
