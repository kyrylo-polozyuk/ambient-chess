import { Icons } from "../components/Icon"
import { useDialog } from "../dialog/useDialog"
import { openAudiotoolInWindow } from "../ProjectSelector/projectId"
import {
  type GameMode,
  type GameModeIconKey,
  GAME_MODE_ICONS,
  GAME_MODE_LABELS,
  GAME_MODES,
} from "./gameMode"

type IconComponent = () => React.ReactElement
const ICON_MAP: Record<GameModeIconKey, IconComponent> = {
  Bot: Icons.Bot,
  User: Icons.User,
  Users: Icons.Users,
  Globe: Icons.Globe,
}

type GameModeButtonProps = {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  projectUrl: string
  onCheckCollaborator: () => Promise<boolean | undefined>
  onShareDialog: () => void
  variant?: "primary" | "default" | "warning" | "tertiary" | ""
}

export const GameModeButton = ({
  mode,
  onModeChange,
  projectUrl,
  onCheckCollaborator,
  onShareDialog,
  variant,
}: GameModeButtonProps) => {
  const { showDialog, closeDialog } = useDialog()

  const handleClick = () => {
    const id = "game-mode-select"
    showDialog({
      id,
      title: "Mode",
      content: (
        <div className="row wrap center small-gap">
          {GAME_MODES.map((m) => {
            const ModeIcon = ICON_MAP[GAME_MODE_ICONS[m]]
            return (
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
                            To play against an Audiotool project collaborator.
                            In{" "}
                            <a
                              href={projectUrl}
                              onClick={(e) => {
                                e.preventDefault()
                                openAudiotoolInWindow(projectUrl)
                              }}
                              rel="noreferrer"
                            >
                              Audiotool
                            </a>
                            , add a collaborator to the project.
                          </p>
                          <p>
                            The collaborator options are accessed via the{" "}
                            <Icons.Users /> button on top right of the
                            Audiotool.
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
                <ModeIcon />
                {GAME_MODE_LABELS[m]}
              </button>
            )
          })}
        </div>
      ),
      dismissible: true,
    })
  }

  const ModeIcon = ICON_MAP[GAME_MODE_ICONS[mode]]

  return (
    <button className={`${variant} hug`} onClick={handleClick}>
      <ModeIcon />
      {GAME_MODE_LABELS[mode]}
    </button>
  )
}
