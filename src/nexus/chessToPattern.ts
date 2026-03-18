import type { ChessBoard } from "../chess/chess"
import {
  BISHOP,
  BLACK,
  KING,
  KNIGHT,
  PAWN,
  QUEEN,
  ROOK,
  WHITE,
} from "../chess/engine/chessAdapter"

/** Empty square pattern (all 0s) */
const EMPTY_PATTERN: [[number, number], [number, number]] = [
  [0, 0],
  [0, 0],
]

/**
 * Converts an 8x8 chess board to a 16x16 tonematrix pattern.
 * Each chess square maps to a 2x2 block using the piece's pattern from CHESS_PIECE_TO_PATTERN.
 * Returns a 16x16 grid as [col][row] to match tonematrix steps (columns) and notes (rows).
 * When piecesSoundAfterMoveOnly is true, only pieces that have moved from their starting square
 * contribute to the pattern (squaresWithMovedPieces should be the set of such squares).
 */
export const chessBoardToTonematrixPattern = (
  board: ChessBoard,
  options?: {
    piecesSoundAfterMoveOnly?: boolean
    squaresWithMovedPieces?: Set<string>
  },
): boolean[][] & { length: 16 }[] => {
  const grid: boolean[][] = Array.from({ length: 16 }, () =>
    Array.from({ length: 16 }, () => false),
  )

  const excludeUnmoved =
    options?.piecesSoundAfterMoveOnly && options?.squaresWithMovedPieces

  for (let cr = 0; cr < 8; cr++) {
    for (let cc = 0; cc < 8; cc++) {
      const piece = board[cr]?.[cc]
      const rank = 8 - cr
      const file = String.fromCharCode(97 + cc)
      const square = `${file}${rank}`

      if (excludeUnmoved && piece && !options.squaresWithMovedPieces!.has(square)) {
        continue
      }

      const pattern = piece
        ? (CHESS_PIECE_TO_PATTERN[piece.color]?.[piece.type] ?? EMPTY_PATTERN)
        : EMPTY_PATTERN

      for (let pr = 0; pr < 2; pr++) {
        for (let pc = 0; pc < 2; pc++) {
          const tmRow = cr * 2 + pr
          const tmCol = cc * 2 + pc
          grid[tmCol][tmRow] = pattern[pr][pc] === 1
        }
      }
    }
  }

  return grid as boolean[][] & { length: 16 }[]
}

export const CHESS_PIECE_TO_PATTERN = {
  [WHITE]: {
    [PAWN]: [
      [0, 0],
      [0, 1],
    ],
    [KNIGHT]: [
      [1, 1],
      [1, 0],
    ],
    [BISHOP]: [
      [0, 1],
      [1, 0],
    ],
    [ROOK]: [
      [1, 0],
      [1, 0],
    ],
    [QUEEN]: [
      [1, 1],
      [0, 1],
    ],
    [KING]: [
      [1, 1],
      [0, 0],
    ],
  },
  [BLACK]: {
    [PAWN]: [
      [1, 0],
      [0, 0],
    ],
    [KNIGHT]: [
      [0, 1],
      [1, 1],
    ],
    [BISHOP]: [
      [1, 0],
      [0, 1],
    ],
    [ROOK]: [
      [0, 1],
      [0, 1],
    ],
    [QUEEN]: [
      [1, 0],
      [1, 1],
    ],
    [KING]: [
      [0, 0],
      [1, 1],
    ],
  },
}
