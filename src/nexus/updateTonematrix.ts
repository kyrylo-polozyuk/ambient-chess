import type {
  NexusEntity,
  SafeTransactionBuilder,
} from "@audiotool/nexus/document"
import type { ChessBoard } from "../chess/chess"
import { chessBoardToTonematrixPattern } from "./chessToPattern"
import { getSquaresWithMovedPieces } from "./piecesMovedFromStart"
import { AMBIENT_CHESS_TONEMATRIX_NAME } from "./projectSetup"

const blankSteps = () => {
  const blankStep = {
    notes: Array.from({ length: 16 }, () => false) as boolean[] & {
      length: 16
    },
  }
  return Array.from({ length: 16 }, () => ({ ...blankStep })) as {
    notes: boolean[] & { length: 16 }
  }[] & { length: 16 }
}

export type UpdateTonematrixOptions = {
  /** When true, only pieces that have moved from their starting square add sound. */
  piecesSoundAfterMoveOnly?: boolean
}

export type TonematrixPatternSlots =
  NexusEntity<"tonematrix">["fields"]["patternSlots"]["array"]

/** Used by the Ambient Chess tonematrix and the FEN tonematrix when writing pattern slots. */
export const updateOrCreatePatternSlot = (
  t: SafeTransactionBuilder,
  slots: TonematrixPatternSlots,
  slotIndex: number,
  gridData: boolean[][] & { length: 16 }[],
): void => {
  if (slotIndex >= slots.length) return
  const slotLocation = slots[slotIndex].location
  const patterns = t.entities
    .ofTypes("tonematrixPattern")
    .pointingTo.locations(slotLocation)
    .get()

  let pattern = patterns[0]
  if (!pattern) {
    t.create("tonematrixPattern", {
      slot: slotLocation,
      steps: blankSteps(),
    })
    const created = t.entities
      .ofTypes("tonematrixPattern")
      .pointingTo.locations(slotLocation)
      .get()
    pattern = created[0]
  }
  if (!pattern) return

  for (let col = 0; col < 16; col++) {
    for (let row = 0; row < 16; row++) {
      const step = pattern.fields.steps.array[col]
      const noteField = step.fields.notes.array[row]
      const value = gridData[col][row]
      if (noteField.value !== value) {
        t.update(noteField, value)
      }
    }
  }
}

/**
 * Writes the visual board pattern to slot 0 of the "Ambient Chess" tonematrix.
 * When piecesSoundAfterMoveOnly is true, only pieces not on their standard
 * starting square contribute, so initial setup is silent after a FEN load.
 */
export const updateAmbientChessTonematrixInTransaction = (
  t: SafeTransactionBuilder,
  board: ChessBoard,
  options?: UpdateTonematrixOptions,
): void => {
  const squaresWithMovedPieces = options?.piecesSoundAfterMoveOnly
    ? getSquaresWithMovedPieces(board)
    : undefined

  const grid = chessBoardToTonematrixPattern(board, {
    piecesSoundAfterMoveOnly: options?.piecesSoundAfterMoveOnly,
    squaresWithMovedPieces,
  })

  const tonematrix = t.entities
    .ofTypes("tonematrix")
    .get()
    .find((tm) => tm.fields.displayName.value === AMBIENT_CHESS_TONEMATRIX_NAME)
  if (!tonematrix) return

  const slots = tonematrix.fields.patternSlots.array
  updateOrCreatePatternSlot(t, slots, 0, grid)
}
