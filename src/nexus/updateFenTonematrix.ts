import type { SyncedDocument } from "@audiotool/nexus"
import type { SafeTransactionBuilder } from "@audiotool/nexus/document"
import type { ChessBoard } from "../chess/chess"
import { fenToPatterns, patternsToFen } from "./fenEncoding"
import { FEN_TONEMATRIX_NAME } from "./projectSetup"
import {
  updateAmbientChessTonematrixInTransaction,
  updateOrCreatePatternSlot,
  type UpdateTonematrixOptions,
} from "./updateTonematrix"

/**
 * Reads the stored FEN from tonematrix pattern slots 1 and 2.
 */
export const getStoredFen = async (
  nexus: SyncedDocument,
): Promise<string | null> => {
  let result: string | null = null
  await nexus.modify((t) => {
    const fenTonematrix = t.entities
      .ofTypes("tonematrix")
      .get()
      .find((tm) => tm.fields.displayName.value === FEN_TONEMATRIX_NAME)

    if (!fenTonematrix) return

    const slots = fenTonematrix.fields.patternSlots.array
    if (slots.length < 3) return

    const slot1Loc = slots[1].location
    const slot2Loc = slots[2].location
    const patterns1 = t.entities
      .ofTypes("tonematrixPattern")
      .pointingTo.locations(slot1Loc)
      .get()
    const patterns2 = t.entities
      .ofTypes("tonematrixPattern")
      .pointingTo.locations(slot2Loc)
      .get()

    const p1 = patterns1[0]
    const p2 = patterns2[0]
    if (!p1 || !p2) return

    const grid1: boolean[][] & { length: 16 }[] = Array.from(
      { length: 16 },
      (_, col) =>
        Array.from(
          { length: 16 },
          (_, row) => p1.fields.steps.array[col].fields.notes.array[row].value,
        ) as boolean[] & { length: 16 },
    ) as boolean[][] & { length: 16 }[]
    const grid2: boolean[][] & { length: 16 }[] = Array.from(
      { length: 16 },
      (_, col) =>
        Array.from(
          { length: 16 },
          (_, row) => p2.fields.steps.array[col].fields.notes.array[row].value,
        ) as boolean[] & { length: 16 },
    ) as boolean[][] & { length: 16 }[]

    result = patternsToFen(grid1, grid2)
  })
  return result
}

/** Writes binary FEN encoding to slots 0–1 of the FEN tonematrix. */
export const updateFenTonematrixInTransaction = (
  t: SafeTransactionBuilder,
  fen: string,
): void => {
  const [fenPattern1, fenPattern2] = fenToPatterns(fen)

  const fenTonematrix = t.entities
    .ofTypes("tonematrix")
    .get()
    .find((tm) => tm.fields.displayName.value === FEN_TONEMATRIX_NAME)
  if (!fenTonematrix) return

  const fenSlots = fenTonematrix.fields.patternSlots.array
  updateOrCreatePatternSlot(t, fenSlots, 0, fenPattern1)
  updateOrCreatePatternSlot(t, fenSlots, 1, fenPattern2)
}

/**
 * Updates the Ambient Chess tonematrix (board view) and the FEN tonematrix
 * (encoded position) in one transaction.
 */
export const updateTonematrixFromChessBoard = async (
  nexus: SyncedDocument,
  board: ChessBoard,
  fen: string,
  options?: UpdateTonematrixOptions,
): Promise<void> => {
  await nexus.modify((t) => {
    updateAmbientChessTonematrixInTransaction(t, board, options)
    updateFenTonematrixInTransaction(t, fen)
  })
}
