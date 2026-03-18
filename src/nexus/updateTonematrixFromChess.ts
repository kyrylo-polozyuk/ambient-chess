import type { SyncedDocument } from "@audiotool/nexus"
import type { ChessBoard } from "../chess/chess"
import { chessBoardToTonematrixPattern } from "./chessToPattern"
import { fenToPatterns, patternsToFen } from "./fenEncoding"
import { getSquaresWithMovedPieces } from "./piecesMovedFromStart"

/** Slot index for settings pattern (separate from FEN slots 0-2) */
const SETTINGS_SLOT_INDEX = 3

/** Bit index in settings pattern for piecesSoundAfterMoveOnly */
const SETTINGS_BIT_PIECES_SOUND_AFTER_MOVE_ONLY = 0

export type StoredSettings = {
  piecesSoundAfterMoveOnly: boolean
}

/**
 * Reads settings from tonematrix pattern slot 3 (dedicated settings pattern).
 */
export const getStoredSettings = async (
  nexus: SyncedDocument,
): Promise<StoredSettings | null> => {
  let result: StoredSettings | null = null
  await nexus.modify((t) => {
    const tonematrix = t.entities
      .ofTypes("tonematrix")
      .get()
      .find((tm) => tm.fields.displayName.value === "Ambient Chess")

    if (!tonematrix) return

    const slots = tonematrix.fields.patternSlots.array
    if (slots.length <= SETTINGS_SLOT_INDEX) return

    const slotLoc = slots[SETTINGS_SLOT_INDEX].location
    const patterns = t.entities
      .ofTypes("tonematrixPattern")
      .pointingTo.locations(slotLoc)
      .get()

    const p = patterns[0]
    if (!p) return

    const bitIndex = SETTINGS_BIT_PIECES_SOUND_AFTER_MOVE_ONLY
    const col = Math.floor(bitIndex / 16)
    const row = bitIndex % 16
    const value = p.fields.steps.array[col].fields.notes.array[row].value

    result = { piecesSoundAfterMoveOnly: value }
  })
  return result
}

/**
 * Writes settings to tonematrix pattern slot 3 (dedicated settings pattern).
 */
export const updateStoredSettings = async (
  nexus: SyncedDocument,
  settings: StoredSettings,
): Promise<void> => {
  await nexus.modify((t) => {
    const tonematrix = t.entities
      .ofTypes("tonematrix")
      .get()
      .find((tm) => tm.fields.displayName.value === "Ambient Chess")

    if (!tonematrix) return

    const slots = tonematrix.fields.patternSlots.array
    if (slots.length <= SETTINGS_SLOT_INDEX) return

    const slotLoc = slots[SETTINGS_SLOT_INDEX].location
    const patterns = t.entities
      .ofTypes("tonematrixPattern")
      .pointingTo.locations(slotLoc)
      .get()

    let pattern = patterns[0]
    if (!pattern) {
      const blankStep = {
        notes: Array.from({ length: 16 }, () => false) as boolean[] & {
          length: 16
        },
      }
      const blankSteps = Array.from({ length: 16 }, () => ({ ...blankStep })) as {
        notes: boolean[] & { length: 16 }
      }[] & { length: 16 }
      t.create("tonematrixPattern", {
        slot: slotLoc,
        steps: blankSteps,
      })
      const created = t.entities
        .ofTypes("tonematrixPattern")
        .pointingTo.locations(slotLoc)
        .get()
      pattern = created[0]
    }
    if (!pattern) return

    const bitIndex = SETTINGS_BIT_PIECES_SOUND_AFTER_MOVE_ONLY
    const col = Math.floor(bitIndex / 16)
    const row = bitIndex % 16
    const noteField = pattern.fields.steps.array[col].fields.notes.array[row]
    if (noteField.value !== settings.piecesSoundAfterMoveOnly) {
      t.update(noteField, settings.piecesSoundAfterMoveOnly)
    }
  })
}

/**
 * Reads the stored FEN from tonematrix pattern slots 1 and 2.
 */
export const getStoredFen = async (
  nexus: SyncedDocument,
): Promise<string | null> => {
  let result: string | null = null
  await nexus.modify((t) => {
    const tonematrix = t.entities
      .ofTypes("tonematrix")
      .get()
      .find((tm) => tm.fields.displayName.value === "Ambient Chess")

    if (!tonematrix) return

    const slots = tonematrix.fields.patternSlots.array
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
  piecesSoundAfterMoveOnly?: boolean
  moveHistory?: Array<{ from: string; to: string }>
}

/**
 * Updates the "Ambient Chess" tonematrix pattern to reflect the current chess board.
 * Slot 0: visual board. Slots 1-2: binary FEN encoding. Slot 3: settings (separate).
 * When piecesSoundAfterMoveOnly is true, only pieces that have moved from their
 * starting square contribute to the pattern (requires moveHistory).
 */
export const updateTonematrixFromChessBoard = async (
  nexus: SyncedDocument,
  board: ChessBoard,
  fen: string,
  options?: UpdateTonematrixOptions,
): Promise<void> => {
  const squaresWithMovedPieces =
    options?.piecesSoundAfterMoveOnly
      ? getSquaresWithMovedPieces(
          options.moveHistory ?? [],
          options.moveHistory?.length === 0 ? board : undefined,
        )
      : undefined

  const grid = chessBoardToTonematrixPattern(board, {
    piecesSoundAfterMoveOnly: options?.piecesSoundAfterMoveOnly,
    squaresWithMovedPieces,
  })
  const [fenPattern1, fenPattern2] = fenToPatterns(fen)

  await nexus.modify((t) => {
    const tonematrix = t.entities
      .ofTypes("tonematrix")
      .get()
      .find((tm) => tm.fields.displayName.value === "Ambient Chess")

    if (!tonematrix) return

    const slots = tonematrix.fields.patternSlots.array

    const updateOrCreatePattern = (
      slotIndex: number,
      gridData: boolean[][] & { length: 16 }[],
    ) => {
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

    updateOrCreatePattern(0, grid)
    updateOrCreatePattern(1, fenPattern1)
    updateOrCreatePattern(2, fenPattern2)
  })
}
