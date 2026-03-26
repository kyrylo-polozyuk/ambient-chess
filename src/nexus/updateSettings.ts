import type { SyncedDocument } from "@audiotool/nexus"
import { FEN_TONEMATRIX_NAME } from "./projectSetup"

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
    const fenTonematrix = t.entities
      .ofTypes("tonematrix")
      .get()
      .find((tm) => tm.fields.displayName.value === FEN_TONEMATRIX_NAME)

    if (!fenTonematrix) return

    const slots = fenTonematrix.fields.patternSlots.array
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
    const fenTonematrix = t.entities
      .ofTypes("tonematrix")
      .get()
      .find((tm) => tm.fields.displayName.value === FEN_TONEMATRIX_NAME)

    if (!fenTonematrix) return

    const slots = fenTonematrix.fields.patternSlots.array
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
      const blankSteps = Array.from({ length: 16 }, () => ({
        ...blankStep,
      })) as {
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
