import type { SyncedDocument } from "@audiotool/nexus";
import { Ticks } from "@audiotool/nexus/utils";
import { useEffect, useState } from "react";

const DEFAULT_BPM = 120;

/**
 * Subscribes to the project's BPM (tempo) from the config entity.
 * Creates config + groove if the project doesn't have one yet.
 * Returns the current BPM, or DEFAULT_BPM when no synced document.
 */
export const useBpm = (syncedDocument: SyncedDocument | undefined): number => {
  const [bpm, setBpm] = useState(DEFAULT_BPM);

  useEffect(() => {
    if (!syncedDocument) {
      setBpm(DEFAULT_BPM);
      return;
    }

    let unsubscribe: { terminate: () => void } | undefined;

    const setupBpmSubscription = async () => {
      await syncedDocument.modify((t) => {
        // Ensure config exists (create if project is empty)
        const configs = t.entities.ofTypes("config").get();
        if (configs.length === 0) {
          const groove = t.create("groove", {
            displayName: "Default Groove",
            durationTicks: 1920,
            impact: 0.2,
            functionIndex: 1,
          });
          t.create("config", {
            tempoBpm: DEFAULT_BPM,
            baseFrequencyHz: 440,
            signatureNumerator: 4,
            signatureDenominator: 4,
            durationTicks: Ticks.Beat * 4 * 64,
            defaultGroove: groove.location,
          });
        }

        const config = t.entities.ofTypes("config").getOne();
        if (config !== undefined) {
          const tempoBpmField = config.fields.tempoBpm;
          setBpm(tempoBpmField.value);

          unsubscribe?.terminate();
          unsubscribe = syncedDocument.events.onUpdate(
            tempoBpmField,
            (value) => setBpm(value)
          );
        }
      });
    };

    void setupBpmSubscription();

    return () => {
      unsubscribe?.terminate();
    };
  }, [syncedDocument]);

  return bpm;
};
