"use client";

import { FrameState } from "@/lib/types";

interface FormFieldsProps {
  state: FrameState;
  onNameChange: (name: string) => void;
  onRoleChange: (role: string) => void;
  onTitleChange: (title: string) => void;
  onDiceClick: () => void;
  visible: boolean;
}

export default function FormFields({
  state,
  onNameChange,
  onRoleChange,
  onTitleChange,
  onDiceClick,
  visible,
}: FormFieldsProps) {
  if (!visible) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div className="field">
        <label>Name</label>
        <input
          type="text"
          value={state.fields.name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={28}
          placeholder="e.g. Ananya Rao"
        />
      </div>
      <div className="field">
        <label>Stack / role</label>
        <input
          type="text"
          value={state.fields.role}
          onChange={(e) => onRoleChange(e.target.value)}
          maxLength={34}
          placeholder="e.g. React · Solidity · Vibes"
        />
      </div>
      <div className="field">
        <label>Builder title</label>
        <div className="title-row">
          <input
            type="text"
            value={state.fields.title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={32}
            placeholder="Generated for you"
          />
          <button
            className="dice"
            onClick={onDiceClick}
            type="button"
            title="Shuffle title"
          >
            🎲
          </button>
        </div>
        <div className="helper">
          Auto-generated — hit the dice for another one, or type your own.
        </div>
      </div>
    </div>
  );
}
