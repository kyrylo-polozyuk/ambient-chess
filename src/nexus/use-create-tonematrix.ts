import type { SyncedDocument } from "@audiotool/nexus";
import type { NexusEntity } from "@audiotool/nexus/document";
import { useEffect, useRef, useState } from "react";

/**
 * Gets or creates a tonematrix named "Ambient Chess" with a blank pattern once the project is connected.
 * Returns the tonematrix entity (existing or newly created).
 */
export const useCreateTonematrix = (
  syncedDocument: SyncedDocument | undefined,
): NexusEntity<"tonematrix"> | undefined => {
  const [tonematrix, setTonematrix] = useState<
    NexusEntity<"tonematrix"> | undefined
  >(undefined);
  const createdForDocument = useRef<SyncedDocument | null>(null);

  useEffect(() => {
    if (!syncedDocument) {
      setTonematrix(undefined);
      createdForDocument.current = null;
      return;
    }
    if (createdForDocument.current === syncedDocument) {
      return;
    }

    const getOrCreateTonematrix = async () => {
      const result = await syncedDocument.modify((t) => {
        const allTonematrices = t.entities.ofTypes("tonematrix").get();
        let tonematrix = allTonematrices.find(
          (tm) => tm.fields.displayName.value === "Ambient Chess",
        );
        const isNewTonematrix = tonematrix === undefined;

        if (tonematrix === undefined) {
          tonematrix = t.create("tonematrix", {
            displayName: "Ambient Chess",
            positionX: 0,
            positionY: 300,
          });

          const slotLocation = tonematrix.fields.patternSlots.array[0].location;

          const blankStep = {
            notes: Array.from({ length: 16 }, () => false) as boolean[] & {
              length: 16;
            },
          };
          const blankSteps = Array.from({ length: 16 }, () => ({
            ...blankStep,
          })) as { notes: boolean[] & { length: 16 } }[] & { length: 16 };

          t.create("tonematrixPattern", {
            slot: slotLocation,
            steps: blankSteps,
          });
        } else {
          // Ensure pattern exists for existing tonematrix (e.g. from previous session)
          const slotLocation = tonematrix.fields.patternSlots.array[0].location;
          const existingPatterns = t.entities
            .ofTypes("tonematrixPattern")
            .pointingTo.locations(slotLocation)
            .get();

          if (existingPatterns.length === 0) {
            const blankStep = {
              notes: Array.from({ length: 16 }, () => false) as boolean[] & {
                length: 16;
              },
            };
            const blankSteps = Array.from({ length: 16 }, () => ({
              ...blankStep,
            })) as { notes: boolean[] & { length: 16 } }[] & { length: 16 };

            t.create("tonematrixPattern", {
              slot: slotLocation,
              steps: blankSteps,
            });
          }
        }

        // Only connect to mixer when we created the tonematrix; leave existing ones as-is
        if (isNewTonematrix) {
          const existingCables = t.entities
            .ofTypes("desktopAudioCable")
            .pointingTo.locations(tonematrix.fields.audioOutput.location)
            .get();
          if (existingCables.length === 0) {
            t.entities.ofTypes("mixerMaster").getOne() ??
              t.create("mixerMaster", { limiterEnabled: true });

            const channel = t.create("mixerChannel", {
              displayParameters: {
                displayName: "Ambient Chess",
                orderAmongStrips: 0,
              },
            });

            t.create("desktopAudioCable", {
              fromSocket: tonematrix.fields.audioOutput.location,
              toSocket: channel.fields.audioInput.location,
            });
          }
        }

        return tonematrix;
      });

      setTonematrix(result);
      createdForDocument.current = syncedDocument;
    };

    void getOrCreateTonematrix();
  }, [syncedDocument]);

  return tonematrix;
};
