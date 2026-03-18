import { useState } from "react"
import type { Settings } from "./settings-context"

export const SettingsDialogContent = (props: {
  initialValue: Settings
  onChange: (value: Settings) => void
}) => {
  const [piecesSoundAfterMoveOnly, setPiecesSoundAfterMoveOnly] = useState(
    props.initialValue.piecesSoundAfterMoveOnly,
  )

  const handleChange = (checked: boolean) => {
    setPiecesSoundAfterMoveOnly(checked)
    props.onChange({ piecesSoundAfterMoveOnly: checked })
  }

  return (
    <div className="column small-gap">
      <label className="row small-gap">
        <input
          type="checkbox"
          checked={piecesSoundAfterMoveOnly}
          onChange={(e) => handleChange(e.target.checked)}
        />
        <span>Pieces only make a sound after moving</span>
      </label>
    </div>
  )
}
