import "./PlayerCard.css"

const formatSignedScore = (value: number): string => {
  if (value === 0) return ""
  if (value > 0) return `+${value}`
  return `-${Math.abs(value)}`
}

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
    <div className={`player-card player-card ${variant} row`}>
      <div className={`player-name ${turnToMove === true ? "waiting" : ""}`}>
        {name}
      </div>
      <div className="player-score">{formatSignedScore(score)}</div>
    </div>
  )
}
