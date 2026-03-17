import type { SyncedDocument } from "@audiotool/nexus";
import { useEffect, useRef } from "react";
import { getStoredFen } from "./update-tonematrix-from-chess";

const DEBOUNCE_MS = 100;

/**
 * Subscribes to changes in the tonematrix FEN patterns (slots 1 and 2) and
 * invokes onFenChange when the stored FEN is updated (e.g. from another tab/device).
 */
export const useFenSyncFromNexus = (
  syncedDocument: SyncedDocument | undefined,
  onFenChange: (fen: string | null) => void,
  options?: { patternsReady?: boolean }
): void => {
  const onFenChangeRef = useRef(onFenChange);
  onFenChangeRef.current = onFenChange;

  useEffect(() => {
    if (!syncedDocument || options?.patternsReady === false) return;

    let debounceTimer: ReturnType<typeof setTimeout> | undefined;
    const terminations: { terminate: () => void }[] = [];

    const syncFromStored = () => {
      debounceTimer = undefined;
      void getStoredFen(syncedDocument).then((fen) => {
        onFenChangeRef.current(fen);
      });
    };

    const scheduleSync = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(syncFromStored, DEBOUNCE_MS);
    };

    void syncedDocument.modify((t) => {
      const tonematrix = t.entities
        .ofTypes("tonematrix")
        .get()
        .find((tm) => tm.fields.displayName.value === "Ambient Chess");

      if (!tonematrix) return;

      const slots = tonematrix.fields.patternSlots.array;
      if (slots.length < 3) return;

      const slot1Loc = slots[1].location;
      const slot2Loc = slots[2].location;
      const patterns1 = t.entities
        .ofTypes("tonematrixPattern")
        .pointingTo.locations(slot1Loc)
        .get();
      const patterns2 = t.entities
        .ofTypes("tonematrixPattern")
        .pointingTo.locations(slot2Loc)
        .get();

      const p1 = patterns1[0];
      const p2 = patterns2[0];
      if (!p1 || !p2) return;

      // Subscribe to representative fields so we detect FEN changes from any source
      const fieldsToWatch = [
        p1.fields.steps.array[0].fields.notes.array[0],
        p1.fields.steps.array[8].fields.notes.array[0],
        p2.fields.steps.array[0].fields.notes.array[0],
      ];

      for (const field of fieldsToWatch) {
        const term = syncedDocument.events.onUpdate(field, () => scheduleSync());
        terminations.push(term);
      }
    });

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      for (const term of terminations) {
        term.terminate();
      }
    };
  }, [syncedDocument, options?.patternsReady]);
};
