"use client";

import { useEffect, useState } from "react";

// Compact horizontal rail with a marker pinned to the exact confidence
// percentage — not just a filled bar, so the value is legible at a glance
// instead of implied by fill length alone. role="meter" + aria-valuetext
// exposes the number to assistive tech independent of the visual fill.
export default function ConfidenceMeter({
  value,
  tierLabel,
}: {
  value: number;
  tierLabel?: string;
}) {
  const [filledWidth, setFilledWidth] = useState(0);
  const clamped = Math.max(0, Math.min(100, value));

  useEffect(() => {
    // Reset to 0 and re-fill shortly after, so the marker/fill always
    // animate in fresh for this value instead of jumping — but only when
    // `value` itself changes, never on unrelated re-renders. A short
    // setTimeout is used instead of requestAnimationFrame because rAF is
    // suspended entirely in backgrounded/inactive tabs, which would leave
    // the rail stuck at 0% if a fight loads while the tab isn't focused.
    setFilledWidth(0);

    const timer = setTimeout(() => {
      setFilledWidth(clamped);
    }, 50);

    return () => clearTimeout(timer);
  }, [clamped]);

  return (
    <div
      className="confidence-rail"
      role="meter"
      aria-label="Model confidence"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuetext={tierLabel ? `${clamped} percent, ${tierLabel}` : `${clamped} percent`}
    >
      <div className="confidence-rail-track">
        <div className="confidence-rail-fill" style={{ width: `${filledWidth}%` }} />
        <div className="confidence-rail-marker" style={{ left: `${filledWidth}%` }} />
      </div>
      <div className="confidence-rail-scale" aria-hidden="true">
        <span>Low</span>
        <span>Moderate</span>
        <span>High</span>
      </div>
    </div>
  );
}
