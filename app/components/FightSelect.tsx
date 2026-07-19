"use client";

import Dropdown from "./Dropdown";

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

function fightLabel(fight: Fight) {
  return `${fight.fighterA} vs. ${fight.fighterB}`;
}

// Thin wrapper around the generic Dropdown, keeping the same external
// API this had before Dropdown.tsx was extracted (fights/selectedId/
// onSelect) so app/page.tsx didn't need to change.
export default function FightSelect({ fights, selectedId, onSelect }: FightSelectProps) {
  return (
    <Dropdown
      id="fight-select"
      ariaLabel="Select a matchup to analyze"
      placeholder="Select a matchup"
      options={fights.map((fight) => ({ key: String(fight.id), label: fightLabel(fight), value: fight }))}
      selectedKey={selectedId != null ? String(selectedId) : null}
      onSelect={(option) => onSelect(option.value)}
    />
  );
}
