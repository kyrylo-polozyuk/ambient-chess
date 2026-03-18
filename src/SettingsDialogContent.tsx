import { useSettings } from "./useSettings"

export const SettingsDialogContent = () => {
  const { piecesSoundAfterMoveOnly, setPiecesSoundAfterMoveOnly } = useSettings()

  return (
    <div className="column small-gap">
      <label className="row small-gap">
        <input
          type="checkbox"
          checked={piecesSoundAfterMoveOnly}
          onChange={(e) => setPiecesSoundAfterMoveOnly(e.target.checked)}
        />
        <span>Pieces only make a sound after moving</span>
      </label>
    </div>
  )
}
