import { Icons } from "../../components/Icon"
import { BOT_DISPLAY_NAME } from "../gameMode"
import "./PlayerCard.css"

export type PlayerCardProps = {
  variant: "white" | "black"
  /** Display name: account, collaborator, `Bot`, or default `"Player"`. */
  name: string
  score: number
  turnToMove: boolean
}

export const PlayerCard = ({
  variant,
  name,
  score,
  turnToMove,
}: PlayerCardProps) => {
  return (
    <div className={`player-card ${variant} row`}>
      <div className={`player-name ${!turnToMove ? "waiting" : ""}`}>
        {name === BOT_DISPLAY_NAME ? (
          <Icons.Bot size="1em" />
        ) : (
          <Icons.User size="1em" />
        )}
        <span className="player-name__label">{name}</span>
      </div>
      {score > 0 && <div className="player-score">+{score}</div>}
    </div>
  )
}
