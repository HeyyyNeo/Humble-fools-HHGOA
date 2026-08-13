"use client";

import { builderNumber } from "@/lib/renderCanvas";
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

  const currentId = builderNumber(state.fields.name || "builder");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
      <div className="field">
        <label>YOUR NAME</label>
        <input
          type="text"
          value={state.fields.name}
          onChange={(e) => onNameChange(e.target.value)}
          maxLength={28}
          placeholder="e.g. MIRA SEN"
        />
      </div>

      <div className="field">
        <label>BUILDER ID # (AUTO-GENERATED)</label>
        <input
          type="text"
          value={currentId}
          readOnly
          className="read-only-id"
          style={{
            opacity: 0.85,
            cursor: "not-allowed",
            fontFamily: '"IBM Plex Mono", monospace',
            fontWeight: 600,
          }}
        />
      </div>

      <div className="field">
        <label>YOUR STACK / ROLE</label>
        <input
          type="text"
          value={state.fields.role}
          onChange={(e) => onRoleChange(e.target.value)}
          maxLength={34}
          placeholder="e.g. CREATIVE TECHNOLOGIST / FRONTEND"
        />
      </div>

      <div className="field">
        <label>YOUR BUILDER TITLE</label>
        <div className="title-row">
          <input
            type="text"
            value={state.fields.title}
            onChange={(e) => onTitleChange(e.target.value)}
            maxLength={32}
            placeholder="MIDNIGHT SYSTEMS ALCHEMIST"
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
