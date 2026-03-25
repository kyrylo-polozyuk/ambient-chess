import type { PieceSymbol } from "../../chess/chess"
import { Icons } from "../../components/Icon"
import { BOT_DISPLAY_NAME } from "../gameMode"
import "./PlayerCard.css"

export type PlayerCardProps = {
  variant: "white" | "black"
  /** Display name: account, collaborator, `Bot`, or default `"Player"`. */
  name: string
  score: number
  turnToMove: boolean
  /** Opponent piece types this player has captured (board order: queen → pawn). */
  capturedPieces: PieceSymbol[]
}

const CAPTURE_ICON_SIZE = "0.95rem"

export const PlayerCard = ({
  variant,
  name,
  score,
  turnToMove,
  capturedPieces,
}: PlayerCardProps) => {
  const captureIconColor = variant === "white" ? "b" : "w"

  return (
    <div className={`player-card ${variant} row full-width wrap start`}>
      <div className={`player-card-inner row no-gap`}>
        <div className={`player-name ${!turnToMove ? "waiting" : ""}`}>
          {name === BOT_DISPLAY_NAME ? (
            <Icons.Bot size="1em" />
          ) : (
            <Icons.User size="1em" />
          )}
          <span>{name}</span>
        </div>
        {capturedPieces.length > 0 && (
          <div
            className="player-captures row no-gap"
            aria-label="Captured pieces"
          >
            {capturedPieces.map((piece, index) => (
              <Icons.ChessPiece
                key={`${piece}-${index}`}
                piece={piece}
                color={captureIconColor}
                size={CAPTURE_ICON_SIZE}
              />
            ))}
          </div>
        )}
      </div>
      {score > 0 && <div className="player-score">+{score}</div>}
    </div>
  )
}
