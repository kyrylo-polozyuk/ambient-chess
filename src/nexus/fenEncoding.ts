/**
 * Encodes/decodes FEN to binary patterns for storage in tonematrix pattern slots.
 * Uses 2 patterns: slot 1 = piece placement (256 bits), slot 2 = game state (32 bits).
 *
 * Piece encoding (4 bits per square): 0=empty, 1-6=white P,N,B,R,Q,K, 7-12=black p,n,b,r,q,k
 */

const FEN_PIECE_TO_CODE: Record<string, number> = {
  P: 1,
  N: 2,
  B: 3,
  R: 4,
  Q: 5,
  K: 6,
  p: 7,
  n: 8,
  b: 9,
  r: 10,
  q: 11,
  k: 12,
}

const CODE_TO_FEN_PIECE: Record<number, string> = {
  1: "P",
  2: "N",
  3: "B",
  4: "R",
  5: "Q",
  6: "K",
  7: "p",
  8: "n",
  9: "b",
  10: "r",
  11: "q",
  12: "k",
}

type PatternGrid = boolean[][] & { length: 16 }[]

const bitToGrid = (bits: boolean[]): PatternGrid => {
  const grid: boolean[][] = Array.from({ length: 16 }, () =>
    Array.from({ length: 16 }, () => false),
  )
  for (let i = 0; i < bits.length && i < 256; i++) {
    const col = Math.floor(i / 16)
    const row = i % 16
    grid[col][row] = bits[i]
  }
  return grid as PatternGrid
}

const gridToBits = (grid: PatternGrid): boolean[] => {
  const bits: boolean[] = []
  for (let col = 0; col < 16; col++) {
    for (let row = 0; row < 16; row++) {
      bits.push(grid[col][row])
    }
  }
  return bits
}

const getBits = (bits: boolean[], start: number, count: number): number => {
  let value = 0
  for (let i = 0; i < count; i++) {
    if (bits[start + i]) value |= 1 << i
  }
  return value
}

const setBits = (
  bits: boolean[],
  start: number,
  count: number,
  value: number,
): void => {
  for (let i = 0; i < count; i++) {
    bits[start + i] = ((value >> i) & 1) === 1
  }
}

/**
 * Parses FEN piece placement into 64 squares (row 0 = rank 8, row 7 = rank 1).
 */
const parseFenPieces = (fenPlacement: string): (number | null)[][] => {
  const board: (number | null)[][] = Array.from({ length: 8 }, () =>
    Array(8).fill(null),
  )
  const ranks = fenPlacement.split("/")
  if (ranks.length !== 8) return board

  for (let r = 0; r < 8; r++) {
    let col = 0
    for (const char of ranks[r]) {
      if (char >= "1" && char <= "8") {
        col += parseInt(char, 10)
      } else {
        const code = FEN_PIECE_TO_CODE[char]
        if (code !== undefined && col < 8) {
          board[r][col] = code
          col++
        }
      }
    }
  }
  return board
}

/**
 * Encodes FEN to two 16x16 pattern grids (for slot 1 and slot 2).
 */
export const fenToPatterns = (fen: string): [PatternGrid, PatternGrid] => {
  const parts = fen.trim().split(/\s+/)
  const placement = parts[0] ?? ""
  const turn = parts[1] ?? "w"
  const castling = parts[2] ?? "-"
  const enPassant = parts[3] ?? "-"
  const halfmove = parseInt(parts[4] ?? "0", 10) || 0
  const fullmove = parseInt(parts[5] ?? "1", 10) || 1

  const pieceBits: boolean[] = []
  const board = parseFenPieces(placement)
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const code = board[row][col] ?? 0
      setBits(pieceBits, (row * 8 + col) * 4, 4, code)
    }
  }
  const pattern1 = bitToGrid(pieceBits)

  const stateBits: boolean[] = []
  setBits(stateBits, 0, 1, turn === "b" ? 1 : 0)
  setBits(stateBits, 1, 1, castling.includes("K") ? 1 : 0)
  setBits(stateBits, 2, 1, castling.includes("Q") ? 1 : 0)
  setBits(stateBits, 3, 1, castling.includes("k") ? 1 : 0)
  setBits(stateBits, 4, 1, castling.includes("q") ? 1 : 0)
  const epFile =
    enPassant === "-" ? 0 : enPassant.charCodeAt(0) - 96
  setBits(stateBits, 5, 4, Math.min(epFile, 15))
  setBits(stateBits, 9, 7, Math.min(halfmove, 127))
  setBits(stateBits, 16, 16, Math.min(fullmove, 65535))
  const pattern2 = bitToGrid(stateBits)

  return [pattern1, pattern2]
}

/**
 * Decodes two pattern grids back to FEN string.
 */
export const patternsToFen = (
  pattern1: PatternGrid,
  pattern2: PatternGrid,
): string | null => {
  try {
    const pieceBits = gridToBits(pattern1)
    const stateBits = gridToBits(pattern2)

    const ranks: string[] = []
    for (let row = 0; row < 8; row++) {
      let rank = ""
      let emptyCount = 0
      for (let col = 0; col < 8; col++) {
        const code = getBits(pieceBits, (row * 8 + col) * 4, 4)
        if (code === 0) {
          emptyCount++
        } else {
          if (emptyCount > 0) {
            rank += emptyCount
            emptyCount = 0
          }
          const piece = CODE_TO_FEN_PIECE[code]
          if (piece) rank += piece
        }
      }
      if (emptyCount > 0) rank += emptyCount
      ranks.push(rank)
    }
    const placement = ranks.join("/")

    const turn = getBits(stateBits, 0, 1) === 1 ? "b" : "w"
    const k = getBits(stateBits, 1, 1) === 1 ? "K" : ""
    const q = getBits(stateBits, 2, 1) === 1 ? "Q" : ""
    const k2 = getBits(stateBits, 3, 1) === 1 ? "k" : ""
    const q2 = getBits(stateBits, 4, 1) === 1 ? "q" : ""
    const castling = k || q || k2 || q2 ? `${k}${q}${k2}${q2}` : "-"
    const epFile = getBits(stateBits, 5, 4)
    const enPassant =
      epFile === 0
        ? "-"
        : `${String.fromCharCode(96 + epFile)}${turn === "w" ? "6" : "3"}`
    const halfmove = getBits(stateBits, 9, 7)
    const fullmove = Math.max(1, getBits(stateBits, 16, 16))

    return `${placement} ${turn} ${castling} ${enPassant} ${halfmove} ${fullmove}`
  } catch (e) {
    console.error("FEN encoding error:", e)
    return null
  }
}
