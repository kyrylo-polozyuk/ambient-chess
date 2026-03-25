import type { PieceSymbol } from "./chess"

type NonKing = Exclude<PieceSymbol, "k">

type PieceCounts = Record<NonKing, number>

const INITIAL_ARMY: PieceCounts = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
}

const countSide = (
  board: ({ type: PieceSymbol; color: "w" | "b" } | null)[][],
  color: "w" | "b",
): PieceCounts => {
  const c: PieceCounts = { p: 0, n: 0, b: 0, r: 0, q: 0 }
  for (const row of board) {
    for (const cell of row) {
      if (!cell || cell.color !== color) continue
      const t = cell.type
      if (t === "k") continue
      c[t]++
    }
  }
  return c
}

/**
 * Opponent pieces removed by capture (not promotion), inferred from the board.
 * `victimColor` is the side whose losses we measure (e.g. `"b"` for pieces White took).
 */
export const capturedPiecesForVictimColor = (
  board: ({ type: PieceSymbol; color: "w" | "b" } | null)[][],
  victimColor: "w" | "b",
): PieceSymbol[] => {
  const c = countSide(board, victimColor)
  const promoQ = Math.max(0, c.q - INITIAL_ARMY.q)
  const promoR = Math.max(0, c.r - INITIAL_ARMY.r)
  const promoB = Math.max(0, c.b - INITIAL_ARMY.b)
  const promoN = Math.max(0, c.n - INITIAL_ARMY.n)
  const promotions = promoQ + promoR + promoB + promoN

  const capP = Math.max(0, INITIAL_ARMY.p - c.p - promotions)
  const capN = Math.max(0, INITIAL_ARMY.n - (c.n - promoN))
  const capB = Math.max(0, INITIAL_ARMY.b - (c.b - promoB))
  const capR = Math.max(0, INITIAL_ARMY.r - (c.r - promoR))
  const capQ = Math.max(0, INITIAL_ARMY.q - (c.q - promoQ))

  const out: PieceSymbol[] = []
  const push = (t: NonKing, n: number) => {
    for (let i = 0; i < n; i++) out.push(t)
  }
  push("q", capQ)
  push("r", capR)
  push("b", capB)
  push("n", capN)
  push("p", capP)
  return out
}
