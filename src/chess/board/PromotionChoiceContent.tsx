import { Icons } from "../../components/Icon"
import type { PieceSymbol } from "../chess"
import "./PromotionChoiceContent.css"

const PROMOTION_PIECES = ["q", "r", "n", "b"] as const

const PIECE_TITLE: Record<(typeof PROMOTION_PIECES)[number], string> = {
  q: "Queen",
  r: "Rook",
  n: "Knight",
  b: "Bishop",
}

export type PromotionChoiceContentProps = {
  color: "w" | "b"
  onChoose: (piece: PieceSymbol) => void
}

export const PromotionChoiceContent = ({
  color,
  onChoose,
}: PromotionChoiceContentProps) => (
  <div className={`promotion-choice-content promotion-choice-content-${color}`}>
    {PROMOTION_PIECES.map((piece) => (
      <button
        key={piece}
        type="button"
        className="promotion-choice-option hug"
        onClick={() => onChoose(piece)}
        title={PIECE_TITLE[piece]}
      >
        <span className="promotion-choice-icon">
          <Icons.ChessPiece piece={piece} color={color} size="1.75rem" />
        </span>
      </button>
    ))}
  </div>
)
