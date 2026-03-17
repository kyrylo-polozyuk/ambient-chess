import type { SyncedDocument } from "@audiotool/nexus"
import type { ChessBoard } from "../chess/chess"
import { chessBoardToTonematrixPattern } from "./chess-to-pattern"
import { fenToPatterns, patternsToFen } from "./fen-encoding"

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

/**
 * Updates the "Ambient Chess" tonematrix pattern to reflect the current chess board.
 * Slot 0: visual board. Slots 1-2: binary FEN encoding for persistence.
 */
export const updateTonematrixFromChessBoard = async (
  nexus: SyncedDocument,
  board: ChessBoard,
  fen: string,
): Promise<void> => {
  const grid = chessBoardToTonematrixPattern(board)
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
