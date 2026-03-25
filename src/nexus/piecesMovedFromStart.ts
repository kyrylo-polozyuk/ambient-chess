import type { ChessBoard } from "../chess/chess"

/** Starting squares by color and piece type (standard initial position) */
const START_SQUARES: Record<"w" | "b", Record<string, Set<string>>> = {
  w: {
    p: new Set(["a2", "b2", "c2", "d2", "e2", "f2", "g2", "h2"]),
    n: new Set(["b1", "g1"]),
    b: new Set(["c1", "f1"]),
    r: new Set(["a1", "h1"]),
    q: new Set(["d1"]),
    k: new Set(["e1"]),
  },
  b: {
    p: new Set(["a7", "b7", "c7", "d7", "e7", "f7", "g7", "h7"]),
    n: new Set(["b8", "g8"]),
    b: new Set(["c8", "f8"]),
    r: new Set(["a8", "h8"]),
    q: new Set(["d8"]),
    k: new Set(["e8"]),
  },
}

const boardIndicesToSquare = (row: number, col: number): string => {
  const file = String.fromCharCode(97 + col)
  const rank = 8 - row
  return `${file}${rank}`
}

/**
 * Squares that should contribute sound in "after move only" mode: every piece
 * that is not on a standard starting-square for its color and type.
 *
 * Uses the board only so it stays correct when the game was loaded from a FEN
 * (no full move history): partial replay from the initial setup would mark
 * almost all pieces as unmoved and collapse the pattern to the last move.
 */
export const getSquaresWithMovedPieces = (board: ChessBoard): Set<string> => {
  const result = new Set<string>()

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const piece = board[row]?.[col]
      if (!piece) continue
      const square = boardIndicesToSquare(row, col)
      const startSquares = START_SQUARES[piece.color]?.[piece.type]
      if (startSquares && !startSquares.has(square)) {
        result.add(square)
      }
    }
  }

  return result
}
