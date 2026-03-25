import type { PieceSymbol } from "./chess"

/** Standard piece values (opening / middlegame material; king excluded). */
const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 0,
}

export type MaterialTotal = { white: number; black: number }

export const materialFromBoard = (
  board: ({ type: PieceSymbol; color: "w" | "b" } | null)[][],
): MaterialTotal => {
  let white = 0
  let black = 0
  for (const row of board) {
    for (const cell of row) {
      if (!cell) continue
      const v = PIECE_VALUES[cell.type] ?? 0
      if (cell.color === "w") white += v
      else black += v
    }
  }
  return { white, black }
}

/** Signed integer, + prefix only for positives (e.g. +2, 0, -1). */
export const formatMaterialLead = (lead: number): string => {
  if (lead === 0) return "0"
  if (lead > 0) return `+${lead}`
  return `-${Math.abs(lead)}`
}
