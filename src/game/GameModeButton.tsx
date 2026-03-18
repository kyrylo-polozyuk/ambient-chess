import { Icons } from "../components/Icon"
import { useDialog } from "../dialog/useDialog"
import {
  type GameMode,
  GAME_MODE_LABELS,
  GAME_MODES,
} from "./gameMode"

type GameModeButtonProps = {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  projectUrl: string
  onCheckCollaborator: () => Promise<boolean | undefined>
  onShareDialog: () => void
}

export const GameModeButton = ({
  mode,
  onModeChange,
  projectUrl,
  onCheckCollaborator,
  onShareDialog,
}: GameModeButtonProps) => {
  const { showDialog, closeDialog } = useDialog()

  const handleClick = () => {
    const id = "game-mode-select"
    showDialog({
      id,
      title: "Mode",
      content: (
        <div className="row wrap center small-gap">
          {GAME_MODES.map((m) => (
            <button
              key={m}
              className={`hug full-width ${mode === m ? "active" : ""}`}
              onClick={() => {
                closeDialog(id)
                if (m === "vsCollaborator") {
                  const collabId = "vs-collaborator-instructions"
                  showDialog({
                    id: collabId,
                    title: "Player vs Collaborator",
                    content: (
                      <>
                        <p>
                          To play against an Audiotool project collaborator. In{" "}
                          <a
                            href={projectUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Audiotool
                          </a>
                          , add a collaborator to the project.
                        </p>
                        <p>
                          The collaborator options are accessed via the{" "}
                          <Icons.Users /> button on top right of the Audiotool.
                        </p>
                      </>
                    ),
                    buttons: [
                      {
                        label: "Cancel",
                        onClick: () => closeDialog(collabId),
                      },
                      {
                        label: "Done",
                        variant: "primary",
                        onClick: () => {
                          closeDialog(collabId)
                          void (async () => {
                            const switched = await onCheckCollaborator()
                            if (switched) {
                              onShareDialog()
                            } else {
                              showDialog({
                                id: "vs-collaborator-error",
                                title: "No collaborator found",
                                content: (
                                  <p>
                                    Make sure a collaborator is added and try
                                    again.
                                  </p>
                                ),
                                buttons: [
                                  {
                                    label: "OK",
                                    variant: "primary",
                                    onClick: () =>
                                      closeDialog("vs-collaborator-error"),
                                  },
                                ],
                              })
                            }
                          })()
                        },
                      },
                    ],
                  })
                } else {
                  onModeChange(m)
                }
              }}
            >
              {GAME_MODE_LABELS[m]}
            </button>
          ))}
        </div>
      ),
      dismissible: true,
    })
  }

  return (
    <button className="primary hug" onClick={handleClick}>
      {GAME_MODE_LABELS[mode]}
    </button>
  )
}
