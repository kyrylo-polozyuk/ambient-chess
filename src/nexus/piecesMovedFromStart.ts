import type { ChessBoard } from "../chess/chess"

/** Starting squares by color and piece type (standard initial position) */
const START_SQUARES: Record<
  "w" | "b",
  Record<string, Set<string>>
> = {
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
 * Computes which board squares contain pieces that have moved from their
 * starting square. Uses move history to track piece identity when available.
 * When history is empty (e.g. loaded from FEN), only treats pieces on their
 * starting square as unmoved; pieces elsewhere are assumed to have moved.
 */
export const getSquaresWithMovedPieces = (
  history: Array<{ from: string; to: string }>,
  board?: ChessBoard,
): Set<string> => {
  const result = new Set<string>()

  if (history.length === 0) {
    if (!board) return result
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

  // Standard starting position: map square -> piece id
  const START_POSITION: Record<string, string> = {
    a1: "R1",
    b1: "N1",
    c1: "B1",
    d1: "Q1",
    e1: "K1",
    f1: "B2",
    g1: "N2",
    h1: "R2",
    a2: "P1",
    b2: "P2",
    c2: "P3",
    d2: "P4",
    e2: "P5",
    f2: "P6",
    g2: "P7",
    h2: "P8",
    a7: "p1",
    b7: "p2",
    c7: "p3",
    d7: "p4",
    e7: "p5",
    f7: "p6",
    g7: "p7",
    h7: "p8",
    a8: "r1",
    b8: "n1",
    c8: "b1",
    d8: "q1",
    e8: "k1",
    f8: "b2",
    g8: "n2",
    h8: "r2",
  }

  const squareToPieceId = new Map<string, string>()
  for (const [sq, id] of Object.entries(START_POSITION)) {
    squareToPieceId.set(sq, id)
  }

  const pieceHasMoved = new Set<string>()

  for (const { from, to } of history) {
    const fromNorm = from.toLowerCase()
    const toNorm = to.toLowerCase()

    const pieceId = squareToPieceId.get(fromNorm)
    if (pieceId) {
      pieceHasMoved.add(pieceId)
      squareToPieceId.delete(fromNorm)
    }

    const capturedId = squareToPieceId.get(toNorm)
    if (capturedId) {
      squareToPieceId.delete(toNorm)
    }

    if (pieceId) {
      squareToPieceId.set(toNorm, pieceId)
    }
  }

  for (const [square, pieceId] of squareToPieceId) {
    if (pieceHasMoved.has(pieceId)) {
      result.add(square)
    }
  }

  return result
}
