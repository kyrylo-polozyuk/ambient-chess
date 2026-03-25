import "./PlayerCard.css"

export type PlayerCardProps = {
  variant: "white" | "black"
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
        {name}
      </div>
      {score > 0 && <div className="player-score">+{score}</div>}
    </div>
  )
}
