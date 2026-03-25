import type { NexusEntity } from "@audiotool/nexus/document"
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  AUDIOTOOL_STUDIO_BASE,
  extractProjectId,
  openAudiotoolInWindow,
} from "../ProjectSelector/projectId"
import type { ChessboardRef, GameStatus } from "../chess/Chessboard"
import { Chessboard } from "../chess/board/Chessboard"
import { Icons } from "../components/Icon"
import { AudiotoolContext } from "../context"
import { useDialog } from "../dialog/useDialog"
import { useAuth } from "../hooks/useAuth"
import { SettingsDialogContent } from "../settings/SettingsDialogContent"
import type { Settings } from "../settings/settings-context"
import { useSettings } from "../settings/useSettings"
import { trimUsername } from "../utils/username"
import { GameModeButton } from "./GameModeButton"
import { PlayerCard } from "./PlayerCard/PlayerCard"
import {
  BOT_DISPLAY_NAME,
  DEFAULT_GAME_MODE,
  DEFAULT_PLAYER_DISPLAY_NAME,
  type GameMode,
} from "./gameMode"

const buildAudiotoolUrl = (projectUrl: string): string =>
  `${AUDIOTOOL_STUDIO_BASE}${extractProjectId(projectUrl)}`

const playerCardDisplayNames = (input: {
  mode: GameMode | undefined
  localDisplayName: string | undefined
  whitePlayerName: string | undefined
  blackPlayerName: string | undefined
}): { white: string; black: string } => {
  const { mode, localDisplayName, whitePlayerName, blackPlayerName } = input
  const p = DEFAULT_PLAYER_DISPLAY_NAME
  if (mode === undefined) return { white: p, black: p }
  if (mode === "autoplay")
    return { white: BOT_DISPLAY_NAME, black: BOT_DISPLAY_NAME }
  if (mode === "vsComputer")
    return {
      white: localDisplayName ?? p,
      black: BOT_DISPLAY_NAME,
    }
  if (mode === "vsCollaborator")
    return {
      white: whitePlayerName ?? p,
      black: blackPlayerName ?? p,
    }
  return { white: p, black: p }
}

export const Game = (props: {
  projectUrl: string
  tonematrix: NexusEntity<"tonematrix">
  fenTonematrix: NexusEntity<"tonematrix">
  onExit: () => void | Promise<void>
}) => {
  const { client } = useContext(AudiotoolContext)
  const { loginStatus } = useAuth()
  const { showDialog, closeDialog, showConfirmation } = useDialog()
  const { piecesSoundAfterMoveOnly, setPiecesSoundAfterMoveOnly } =
    useSettings()
  const chessboardRef = useRef<ChessboardRef>(null)

  const [mode, setMode] = useState<GameMode | undefined>(undefined)
  const [status, setStatus] = useState<GameStatus>({
    phase: "ongoing",
    turnToMove: "w",
    whiteLabel: DEFAULT_PLAYER_DISPLAY_NAME,
    blackLabel: DEFAULT_PLAYER_DISPLAY_NAME,
    materialLeadWhite: 0,
    capturedByWhite: [],
    capturedByBlack: [],
    resultMessage: "",
  })
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState<
    boolean | undefined
  >(undefined)
  const [whitePlayerName, setWhitePlayerName] = useState<string | undefined>(
    undefined,
  )
  const [blackPlayerName, setBlackPlayerName] = useState<string | undefined>(
    undefined,
  )
  const [localDisplayName, setLocalDisplayName] = useState<string | undefined>(
    undefined,
  )

  useEffect(() => {
    if (!loginStatus?.loggedIn) {
      setLocalDisplayName(undefined)
      return
    }
    void (async () => {
      const result = await loginStatus.getUserName()
      setLocalDisplayName(
        result instanceof Error ? undefined : trimUsername(result),
      )
    })()
  }, [loginStatus])

  const isVsCollaborator = mode === "vsCollaborator"
  const userPlaysAs =
    isVsCollaborator && isCurrentUserOwner !== undefined
      ? isCurrentUserOwner
        ? "w"
        : "b"
      : undefined

  /** Same rule as Chessboard `boardOrientation`: black at bottom when the collaborator plays black. */
  const boardFacesBlack = userPlaysAs === "b"

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
      rolesResponse instanceof Error ? [] : (rolesResponse.projectRoles ?? [])
    ).map((role) => ({ userName: role.userName, roleType: role.roleType }))
    const owner =
      projectResponse instanceof Error
        ? null
        : (projectResponse.project?.creatorName ?? null)

    const hasMultipleCollaborators = collaborators.length >= 2 && owner
    if (hasMultipleCollaborators) {
      const currentUserNameResult = await loginStatus.getUserName()
      const currentUserName =
        currentUserNameResult instanceof Error ? null : currentUserNameResult
      setMode("vsCollaborator")
      setIsCurrentUserOwner(currentUserName === owner)
      setWhitePlayerName(trimUsername(owner))
      const blackUser = collaborators.find(
        (c) => c.userName !== owner,
      )?.userName
      setBlackPlayerName(blackUser ? trimUsername(blackUser) : undefined)
      return true
    }
    return false
  }, [client, loginStatus, props.projectUrl])

  // Auto-detect vsCollaborator when opening shared link (so black player sees flipped board)
  useEffect(() => {
    if (loginStatus === undefined) return // Still loading auth - wait before deciding
    if (!client || !loginStatus.loggedIn) {
      setMode(DEFAULT_GAME_MODE)
      return
    }
    void checkCollaboratorMode().finally(() => {
      setMode((m) => (m === undefined ? DEFAULT_GAME_MODE : m))
    })
  }, [checkCollaboratorMode, client, loginStatus])

  const showShareDialog = useCallback(() => {
    const shareUrl = window.location.href
    showDialog({
      id: "vs-collaborator-share-link",
      title: "Ready to play!",
      content: (
        <div className="column small-gap">
          <p>Your collaborator can jump into this game with this link</p>
          <div className="row small-gap full-width">
            <input
              type="text"
              readOnly
              value={shareUrl}
              className="share-link-input"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={() => void navigator.clipboard.writeText(shareUrl)}
              className="hug"
            >
              <Icons.Copy /> Copy
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

  const showSettingsDialog = useCallback(() => {
    const id = "settings"
    const pendingSettings: { current: Settings } = {
      current: { piecesSoundAfterMoveOnly },
    }
    showDialog({
      id,
      title: "Settings",
      content: (
        <SettingsDialogContent
          initialValue={{ piecesSoundAfterMoveOnly }}
          onChange={(v: Settings) => {
            pendingSettings.current = v
          }}
        />
      ),
      buttons: [
        {
          label: "Cancel",
          onClick: () => closeDialog(id),
        },
        {
          label: "Save",
          variant: "primary",
          onClick: () => {
            setPiecesSoundAfterMoveOnly(
              pendingSettings.current.piecesSoundAfterMoveOnly,
            )
            closeDialog(id)
          },
        },
      ],
    })
  }, [
    showDialog,
    closeDialog,
    piecesSoundAfterMoveOnly,
    setPiecesSoundAfterMoveOnly,
  ])

  const isFullyReady = mode !== undefined
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (!isFullyReady) {
      setShowContent(false)
      return
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setShowContent(true))
    })
    return () => cancelAnimationFrame(id)
  }, [isFullyReady])

  const { white: whiteCardName, black: blackCardName } = useMemo(
    () =>
      playerCardDisplayNames({
        mode,
        localDisplayName,
        whitePlayerName,
        blackPlayerName,
      }),
    [mode, localDisplayName, whitePlayerName, blackPlayerName],
  )

  const playerCardWhite = (
    <PlayerCard
      variant="white"
      name={whiteCardName}
      score={status.materialLeadWhite}
      turnToMove={status.turnToMove === "w"}
      capturedPieces={status.capturedByWhite}
    />
  )

  const playerCardBlack = (
    <PlayerCard
      variant="black"
      name={blackCardName}
      score={-status.materialLeadWhite}
      turnToMove={status.turnToMove === "b"}
      capturedPieces={status.capturedByBlack}
    />
  )

  return (
    <div className="column center grow game-component ">
      <div
        className={`column center full-width grow small-gap game-content${showContent ? " ready" : ""}`}
      >
        {boardFacesBlack ? playerCardWhite : playerCardBlack}
        <Chessboard
          ref={chessboardRef}
          tonematrix={props.tonematrix}
          autoPlay={mode === "autoplay"}
          computerPlaysAs={mode === "vsComputer" ? "b" : undefined}
          userPlaysAs={userPlaysAs}
          whitePlayerName={whitePlayerName}
          blackPlayerName={blackPlayerName}
          onStatusChange={setStatus}
        />
        {boardFacesBlack ? playerCardBlack : playerCardWhite}
        <div className="column full-width">
          <div className="game-result secondary-text">
            {status.resultMessage}
          </div>
          <div className="row small-gap">
            {mode !== undefined && !isVsCollaborator && (
              <GameModeButton
                mode={mode}
                onModeChange={setMode}
                projectUrl={props.projectUrl}
                onCheckCollaborator={checkCollaboratorMode}
                onShareDialog={showShareDialog}
                variant={status.phase !== "finished" ? "primary" : ""}
              />
            )}
            {isVsCollaborator && (
              <button className="hug responsive" onClick={showShareDialog}>
                <Icons.Link />
                Share Link
              </button>
            )}
            <button className="hug responsive" onClick={showSettingsDialog}>
              <Icons.Settings />
              Settings
            </button>
            <button
              className={`hug responsive${status.phase === "finished" ? " primary" : ""}`}
              onClick={() => {
                showConfirmation({
                  id: "reset-confirmation",
                  title: "Reset game",
                  content: <p>Are you sure you want to reset the game?</p>,
                  confirmLabel: "Reset",
                  confirmVariant: "primary",
                  onConfirm: () => {
                    if (mode === "autoplay" || !isVsCollaborator) {
                      setMode(DEFAULT_GAME_MODE)
                    }
                    chessboardRef.current?.restart()
                  },
                })
              }}
            >
              <Icons.Refresh />
              Reset
            </button>
            <button
              className="hug responsive"
              onClick={() => {
                showConfirmation({
                  id: "exit-confirmation",
                  title: "Exit game",
                  confirmLabel: "Exit",
                  confirmVariant: "warning",
                  onConfirm: () => props.onExit(),
                })
              }}
            >
              <Icons.Close />
              Exit
            </button>
          </div>
        </div>

        <div className="grow fit-content">
          <p>
            Press ▶ in{" "}
            <a
              href={buildAudiotoolUrl(props.projectUrl)}
              onClick={(e) => {
                e.preventDefault()
                openAudiotoolInWindow(buildAudiotoolUrl(props.projectUrl))
              }}
              rel="noreferrer"
            >
              Audiotool
            </a>{" "}
            to start the music.
          </p>
        </div>
      </div>
    </div>
  )
}
