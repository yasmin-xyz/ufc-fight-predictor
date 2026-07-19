"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface Fight {
  id: string | number;
  fighterA: string;
  fighterB: string;
}

interface FightSelectProps {
  fights: Fight[];
  selectedId: string | number | null | undefined;
  onSelect: (fight: Fight) => void;
}

const VIEWPORT_MARGIN = 12;
const PANEL_GAP = 6;

function fightLabel(fight: Fight) {
  return `${fight.fighterA} vs. ${fight.fighterB}`;
}

// Replaces a native <select> so the open/close transition is a small,
// deliberate fade instead of iOS Safari's own picker-sheet morph
// animation — which is OS-rendered chrome for native form controls and
// can't be restyled or disabled via CSS, only avoided by not using a
// native <select> at all. Follows the WAI-ARIA "select-only combobox"
// pattern: focus stays on the trigger button, the active option is
// tracked via aria-activedescendant rather than moving focus into the
// listbox.
//
// The panel is portaled into document.body — same reasoning as
// InfoTooltip.tsx: an ancestor several levels up (the card grid's own
// reveal/entrance animation) ends up establishing a stacking context
// that paints above a same-DOM-position absolutely-positioned panel
// regardless of z-index, since z-index only competes within a shared
// stacking context. Portaling to body sidesteps that entirely.
export default function FightSelect({ fights, selectedId, onSelect }: FightSelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();

  const selectedIndex = fights.findIndex((f) => String(f.id) === String(selectedId));
  const selectedFight = selectedIndex >= 0 ? fights[selectedIndex] : null;

  useEffect(() => setMounted(true), []);

  function reposition() {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();

    const minLeft = window.scrollX + VIEWPORT_MARGIN;
    const maxLeft = window.scrollX + window.innerWidth - VIEWPORT_MARGIN - rect.width;
    const left = Math.min(Math.max(rect.left + window.scrollX, minLeft), maxLeft);
    const top = rect.bottom + window.scrollY + PANEL_GAP;

    setCoords({ top, left, width: rect.width });
  }

  function openList() {
    if (fights.length === 0) return;
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    reposition();
    setOpen(true);
  }

  function closeList() {
    setOpen(false);
    buttonRef.current?.focus();
  }

  function commitSelection(index: number) {
    const fight = fights[index];
    if (!fight) return;
    onSelect(fight);
    setOpen(false);
    buttonRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;

    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);

    function handlePointerDown(e: MouseEvent | TouchEvent) {
      const target = e.target as Node;
      if (wrapRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const activeEl = panelRef.current?.querySelector(`[data-index="${activeIndex}"]`);
    activeEl?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  function handleButtonKeyDown(e: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, fights.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(fights.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commitSelection(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeList();
        break;
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className="fight-select-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        id="fight-select"
        className="fight-select-trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && fights[activeIndex] ? `fight-option-${fights[activeIndex].id}` : undefined}
        onClick={() => (open ? closeList() : openList())}
        onKeyDown={handleButtonKeyDown}
      >
        {selectedFight ? fightLabel(selectedFight) : "Select a matchup"}
      </button>

      {mounted &&
        createPortal(
          <ul
            ref={panelRef}
            id={listboxId}
            role="listbox"
            aria-label="Select a matchup to analyze"
            className={`fight-select-panel ${open ? "fight-select-panel-open" : ""}`}
            style={{ top: coords.top, left: coords.left, width: coords.width }}
          >
            {fights.map((fight, index) => {
              const isSelected = String(fight.id) === String(selectedId);
              const isActive = index === activeIndex;
              return (
                <li
                  key={fight.id}
                  id={`fight-option-${fight.id}`}
                  role="option"
                  aria-selected={isSelected}
                  data-index={index}
                  className={`fight-select-option ${isActive ? "fight-select-option-active" : ""} ${isSelected ? "fight-select-option-selected" : ""}`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => commitSelection(index)}
                >
                  {fightLabel(fight)}
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </div>
  );
}
