import type { NexusEntity } from "@audiotool/nexus/document"
import { useCallback, useContext, useEffect, useRef, useState } from "react"
import { Chessboard } from "./chess/board/Chessboard"
import type { ChessboardRef } from "./chess/Chessboard"
import { AudiotoolContext } from "./context"
import { useDialog } from "./dialog/useDialog"
import { useAuth } from "./hooks/useAuth"
import {
  AUDIOTOOL_STUDIO_BASE,
  extractProjectId,
} from "./ProjectSelector/projectId"

const buildAudiotoolUrl = (projectUrl: string): string =>
  `${AUDIOTOOL_STUDIO_BASE}${extractProjectId(projectUrl)}`
import { trimUsername } from "./utils/username"

type GameMode = "autoplay" | "vsComputer" | "vsLocal" | "vsCollaborator"

export const Game = (props: {
  projectUrl: string
  tonematrix: NexusEntity<"tonematrix">
}) => {
  const { client } = useContext(AudiotoolContext)
  const { loginStatus } = useAuth()
  const { showDialog, closeDialog } = useDialog()
  const chessboardRef = useRef<ChessboardRef>(null)

  const [mode, setMode] = useState<GameMode>("vsLocal")
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState<
    boolean | undefined
  >(undefined)
  const [whitePlayerName, setWhitePlayerName] = useState<string | undefined>(
    undefined,
  )
  const [blackPlayerName, setBlackPlayerName] = useState<string | undefined>(
    undefined,
  )

  const isVsCollaborator = mode === "vsCollaborator"
  const userPlaysAs =
    isVsCollaborator && isCurrentUserOwner !== undefined
      ? isCurrentUserOwner
        ? "w"
        : "b"
      : undefined

  const checkCollaboratorMode = useCallback(async () => {
    if (!client || !loginStatus?.loggedIn) return
    const projectId = extractProjectId(props.projectUrl)
    const parent = `projects/${projectId}`
    const [rolesResponse, projectResponse] = await Promise.all([
      client.api.projectRoleService.listProjectRoles({
        parent,
        pageSize: 50,
        pageToken: "",
        filter: "",
        orderBy: "",
      }),
      client.api.projectService.getProject({ name: parent }),
    ])

    const collaborators = (
      rolesResponse instanceof Error ? [] : rolesResponse.projectRoles ?? []
    ).map((role) => ({ userName: role.userName, roleType: role.roleType }))
    const owner =
      projectResponse instanceof Error
        ? null
        : projectResponse.project?.creatorName ?? null

    const hasMultipleCollaborators = collaborators.length >= 2 && owner
    if (hasMultipleCollaborators) {
      const currentUserNameResult = await loginStatus.getUserName()
      const currentUserName =
        currentUserNameResult instanceof Error ? null : currentUserNameResult
      setMode("vsCollaborator")
      setIsCurrentUserOwner(currentUserName === owner)
      setWhitePlayerName(trimUsername(owner))
      const blackUser = collaborators.find((c) => c.userName !== owner)
        ?.userName
      setBlackPlayerName(blackUser ? trimUsername(blackUser) : undefined)
      return true
    }
    return false
  }, [client, loginStatus, props.projectUrl])

  // Auto-detect vsCollaborator when opening shared link (so black player sees flipped board)
  useEffect(() => {
    void checkCollaboratorMode()
  }, [checkCollaboratorMode])

  const showShareDialog = useCallback(() => {
    const shareUrl = window.location.href
    showDialog({
      id: "vs-collaborator-share-link",
      title: "Ready to play!",
      content: (
        <div className="column small-gap">
          <p>
            Your collaborator can jump into this game with this link
          </p>
          <div className="row small-gap full-width">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="share-link-input"
              onClick={(e) =>
                (e.target as HTMLInputElement).select()
              }
            />
            <button
              onClick={() =>
                void navigator.clipboard.writeText(shareUrl)
              }
              className="hug"
            >
              <span className="material-symbols">content_copy</span> Copy
            </button>
          </div>
        </div>
      ),
      buttons: [
        {
          label: "Close",
          variant: "default",
          onClick: () => closeDialog("vs-collaborator-share-link"),
        },
      ],
    })
  }, [showDialog, closeDialog])

  const getRestartButton = () => (
    <button
      className="hug"
      onClick={() => {
        const id = "restart-confirmation"
        showDialog({
          id,
          title: "Restart game",
          content: <p>Are you sure you want to restart the game?</p>,
          buttons: [
            {
              label: "Cancel",
              onClick: () => closeDialog(id),
            },
            {
              label: "Restart",
              variant: "primary",
              onClick: () => {
                if (!isVsCollaborator) setMode("vsLocal")
                chessboardRef.current?.restart()
                closeDialog(id)
              },
            },
          ],
        })
      }}
    >
      <span className="material-symbols">refresh</span>
      Restart
    </button>
  )

  return (
    <div className="column center grow game-component">
      <Chessboard
        ref={chessboardRef}
        tonematrix={props.tonematrix}
        autoPlay={mode === "autoplay"}
        computerPlaysAs={mode === "vsComputer" ? "b" : undefined}
        userPlaysAs={userPlaysAs}
        whitePlayerName={whitePlayerName}
        blackPlayerName={blackPlayerName}
      />

      <div className="column full-width game-controls">
        <div className="row small-gap wrap center">
          {!isVsCollaborator && (
            <>
              <button
                className={` ${mode === "autoplay" ? "active" : ""} hug`}
                onClick={() =>
                  setMode((m) => (m === "autoplay" ? "vsLocal" : "autoplay"))
                }
              >
                AI vs AI
              </button>
              <button
                className={` ${mode === "vsComputer" ? "active" : ""} hug`}
                onClick={() =>
                  setMode((m) =>
                    m === "vsComputer" ? "vsLocal" : "vsComputer",
                  )
                }
              >
                Player vs AI
              </button>
              <button
                className={` ${mode === "vsLocal" ? "active" : ""} hug`}
                onClick={() => setMode("vsLocal")}
              >
                Player vs Local Player
              </button>
              <button
                className="hug"
                onClick={async () => {
                  const id = "vs-collaborator-instructions"
                  showDialog({
                    id,
                    title: "Player vs Collaborator",
                    content: (
                      <>
                        <p>
                          To play against an Audiotool project collaborator. In{" "}
                          <a href={props.projectUrl} target="_blank" rel="noreferrer">
                            Audiotool
                          </a>
                          , add a collaborator to the project.
                        </p>
                        <p>
                          The collaborator options are accessed via the{" "}
                          <span className="material-symbols">group</span> button on
                          top right of the Audiotool.
                        </p>
                      </>
                    ),
                    buttons: [
                      {
                        label: "Cancel",
                        onClick: () => closeDialog(id),
                      },
                      {
                        label: "Done",
                        variant: "primary",
                        onClick: () => {
                          closeDialog(id)
                          void (async () => {
                            const switched = await checkCollaboratorMode()
                            if (switched) {
                              showShareDialog()
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
                }}
              >
                Player vs Collaborator
              </button>
            </>
          )}
          {isVsCollaborator && (
            <button className="hug" onClick={showShareDialog}>
              <span className="material-symbols">share</span>
              Share Link
            </button>
          )}
          {getRestartButton()}
        </div>
      </div>

      <p>
        Press <span className="material-symbols">play_arrow</span> in{" "}
        <a
          href={buildAudiotoolUrl(props.projectUrl)}
          target="_blank"
          rel="noreferrer"
        >
          Audiotool
        </a>{" "}
        to start the music.
      </p>
    </div>
  )
}
