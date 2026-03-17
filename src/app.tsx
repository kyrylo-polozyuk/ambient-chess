import {
  type AudiotoolClient,
  type SyncedDocument,
} from "@audiotool/nexus";
import { useEffect, useRef, useState } from "react";
import { AudiotoolContext } from "./context";
import { LoginScreen } from "./auth/login-screen";
import { extractProjectId } from "./auth/state-persistence";
import { useAuth } from "./auth/use-auth";
import { Chessboard } from "./chess/board/chessboard";
import type { ChessboardRef } from "./chess/chessboard";
import { useDialog } from "./dialog/use-dialog";
import { ProjectSelector } from "./project-selector/project-selector";
import { trimUsername } from "./utils/username";

export const App = () => {
  const { loginStatus, authStatus, loading, authError } = useAuth();
  const { showDialog, closeDialog } = useDialog();

  const [client, setClient] = useState<AudiotoolClient | undefined>(undefined);
  const [nexus, setNexus] = useState<SyncedDocument | undefined>(undefined);
  const [projectUrl, setProjectUrl] = useState<string>("");
  const [mode, setMode] = useState<
    "autoplay" | "vsComputer" | "vsLocal" | "vsCollaborator"
  >("vsLocal");
  const [useStockfish, setUseStockfish] = useState(true);
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState<
    boolean | undefined
  >(undefined);
  const [whitePlayerName, setWhitePlayerName] = useState<string | undefined>(
    undefined
  );
  const [blackPlayerName, setBlackPlayerName] = useState<string | undefined>(
    undefined
  );
  const chessboardRef = useRef<ChessboardRef>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlParam = params.get("projectUrl");
    if (urlParam) {
      setProjectUrl(urlParam);
    }
  }, []);

  const handleLogout = async () => {
    if (loginStatus?.loggedIn !== true) {
      return;
    }

    setNexus(undefined);
    setClient(undefined);
    setProjectUrl("");
    setIsCurrentUserOwner(undefined);
    setWhitePlayerName(undefined);
    setBlackPlayerName(undefined);
    window.history.replaceState({}, "", window.location.pathname);

    loginStatus?.logout();
  };

  const handleProjectConnected = async (
    newClient: AudiotoolClient,
    newDocument: SyncedDocument,
    newProjectUrl: string
  ) => {
    setClient(newClient);
    setNexus(newDocument);
    setProjectUrl(newProjectUrl);

    const projectId = extractProjectId(newProjectUrl);
    const parent = `projects/${projectId}`;

    const [rolesResponse, projectResponse] = await Promise.all([
      newClient.api.projectRoleService.listProjectRoles({
        parent,
        pageSize: 50,
        pageToken: "",
        filter: "",
        orderBy: "",
      }),
      newClient.api.projectService.getProject({ name: parent }),
    ]);

    const collaborators = (rolesResponse instanceof Error ? [] : rolesResponse.projectRoles ?? []).map(
      (role) => ({ userName: role.userName, roleType: role.roleType })
    );
    console.log("Project collaborators:", collaborators);

    const owner =
      projectResponse instanceof Error
        ? null
        : projectResponse.project?.creatorName ?? null;
    if (owner) {
      console.log("Project owner:", owner);
    }

    if (loginStatus?.loggedIn === true) {
      const currentUserNameResult = await loginStatus.getUserName();
      const currentUserName =
        currentUserNameResult instanceof Error ? null : currentUserNameResult;
      const currentUserCollaborator = currentUserName
        ? collaborators.find((c) => c.userName === currentUserName)
        : null;
      console.log(
        "Current logged-in user collaborator:",
        currentUserCollaborator ?? (currentUserName ? "Not a collaborator" : "Unknown")
      );

      const hasMultipleCollaborators = collaborators.length >= 2;
      if (hasMultipleCollaborators && owner) {
        setMode("vsCollaborator");
        setIsCurrentUserOwner(currentUserName === owner);
        setWhitePlayerName(trimUsername(owner));
        const blackUser = collaborators.find((c) => c.userName !== owner)
          ?.userName;
        setBlackPlayerName(blackUser ? trimUsername(blackUser) : undefined);
      } else {
        setMode("vsLocal");
        setIsCurrentUserOwner(undefined);
        setWhitePlayerName(undefined);
        setBlackPlayerName(undefined);
      }
    }
  };

  const getAppContents = (): React.ReactNode => {
    if (authStatus !== "logged-in") {
      return null;
    }

    if (nexus === undefined) {
      return (
        <ProjectSelector
          loginStatus={loginStatus}
          onProjectConnected={handleProjectConnected}
          projectUrl={projectUrl}
        />
      );
    }

    const isVsCollaborator = mode === "vsCollaborator";
    const userPlaysAs =
      isVsCollaborator && isCurrentUserOwner !== undefined
        ? isCurrentUserOwner
          ? "w"
          : "b"
        : undefined;

    const getRestartButton = () => {
      return (
        <button
          className="hug"
          onClick={() => {
            const id = "restart-confirmation";
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
                    if (!isVsCollaborator) setMode("vsLocal");
                    chessboardRef.current?.restart();
                    closeDialog(id);
                  },
                },
              ],
            });
          }}
        >
          <span className="material-symbols">refresh</span>
          Restart
        </button>
      );
    }

    return (
      <div id="app" className="column center">
        <Chessboard
          ref={chessboardRef}
          autoPlay={mode === "autoplay"}
          computerPlaysAs={mode === "vsComputer" ? "b" : undefined}
          useStockfish={useStockfish}
          userPlaysAs={userPlaysAs}
          whitePlayerName={whitePlayerName}
          blackPlayerName={blackPlayerName}
        />

        <div className="row small-gap">
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
                    m === "vsComputer" ? "vsLocal" : "vsComputer"
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
                onClick={() => {
                  const id = "vs-collaborator-instructions";
                  showDialog({
                    id,
                    title: "Player vs Collaborator",
                    content: (
                      <>
                        <p>
                          To play against an Audiotool project collaborator. In <a href={projectUrl} target="_blank">Audiotool</a>, add a collaborator to the project.
                        </p>
                        <p>The collaborator options are acessed via the <span className="material-symbols">group</span> button on top right of the Audiotool.</p>
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
                        onClick: async () => {
                          closeDialog(id);
                          if (!client || !loginStatus?.loggedIn) return;
                          const projectId = extractProjectId(projectUrl);
                          const parent = `projects/${projectId}`;
                          const [rolesResponse, projectResponse] =
                            await Promise.all([
                              client.api.projectRoleService.listProjectRoles({
                                parent,
                                pageSize: 50,
                                pageToken: "",
                                filter: "",
                                orderBy: "",
                              }),
                              client.api.projectService.getProject({
                                name: parent,
                              }),
                            ]);
                          const collaborators = (
                            rolesResponse instanceof Error
                              ? []
                              : rolesResponse.projectRoles ?? []
                          ).map((role) => ({
                            userName: role.userName,
                            roleType: role.roleType,
                          }));
                          const owner =
                            projectResponse instanceof Error
                              ? null
                              : projectResponse.project?.creatorName ?? null;
                          const hasMultipleCollaborators =
                            collaborators.length >= 2 && owner;
                          if (hasMultipleCollaborators) {
                            const currentUserNameResult =
                              await loginStatus.getUserName();
                            const currentUserName =
                              currentUserNameResult instanceof Error
                                ? null
                                : currentUserNameResult;
                            setMode("vsCollaborator");
                            setIsCurrentUserOwner(currentUserName === owner);
                            setWhitePlayerName(trimUsername(owner));
                            const blackUser = collaborators.find(
                              (c) => c.userName !== owner
                            )?.userName;
                            setBlackPlayerName(
                              blackUser ? trimUsername(blackUser) : undefined
                            );
                            const shareUrl = window.location.href;
                            showDialog({
                              id: "vs-collaborator-share-link",
                              title: "Ready to play!",
                              content: (
                                <div className="column small-gap">
                                  <p>All done! Your collaborator can jump into this game with this link</p>
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
                                    <button onClick={void navigator.clipboard.writeText(shareUrl)} className="hug primary"><span className="material-symbols">content_copy</span></button>
                                  </div>
                                </div>
                              ),
                              buttons: [
                                {
                                  label: "Close",
                                  variant: "primary",
                                  onClick: () =>
                                    closeDialog("vs-collaborator-share-link"),
                                },
                              ],
                            });
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
                            });
                          }
                        },
                      },
                    ],
                  });
                }}
              >
                Player vs Collaborator
              </button>
            </>
          )}
          {getRestartButton()}
        </div>

        {!isVsCollaborator && (
          <div className="row small-gap">
            <span>Engine</span>
            <button
              className={` ${useStockfish ? "" : "active"} hug`}
              onClick={() => setUseStockfish(false)}
              title="Use Stockfish engine via chess-api.com (stronger AI)"
            >
              Js Chess Engine
            </button>
            <button
              className={` ${useStockfish ? "active" : ""} hug`}
              onClick={() => setUseStockfish(true)}
              title="Use Stockfish engine via chess-api.com (stronger AI)"
            >
              Stockfish
            </button>
          </div>
        )}

        <p>Press <span className="material-symbols">play_arrow</span> in <a href={`https://beta.audiotool.com/studio?project=${extractProjectId(projectUrl)}`} target="_blank">Audiotool App</a> to start the music.</p>
      </div>
    );
  };

  return (
    <AudiotoolContext.Provider value={{ client, nexus }}>
    <div className="column app-container">
      <div className="row full-width top-bar">
        <div className="title-container">
          <p className="title"><span className="material-symbols">
            chess_queen
          </span> <span>Ambient Chess</span></p>
        </div>
        {authStatus === "logged-in" && (
          <div className="user-info">
            {nexus && client && projectUrl && (
              <>
                <button
                  className="hug"
                  onClick={async () => {
                    const params = new URLSearchParams(
                      window.location.search
                    );
                    params.delete("projectUrl");
                    window.history.replaceState(
                      {},
                      "",
                      `${window.location.pathname}?${params.toString()}`
                    );
                    if (nexus !== undefined) {
                      await nexus.stop();
                    }
                    setClient(undefined);
                    setNexus(undefined);
                    setIsCurrentUserOwner(undefined);
                    setWhitePlayerName(undefined);
                    setBlackPlayerName(undefined);
                  }}
                >
                  <span className="material-symbols">arrow_back</span>
                  <span>Change Project</span>
                </button>
                <button
                  className="hug"
                  onClick={() => {
                    const projectId = extractProjectId(projectUrl);
                    window.open(
                      `https://beta.audiotool.com/studio?project=${projectId}`,
                      "_blank"
                    );
                  }}
                >
                  <span className="material-symbols">play_arrow</span>
                  <span>Open Audiotool</span>
                </button>
              </>
            )}
            <button className="hug" onClick={handleLogout}>
              <span className="material-symbols">logout</span>
              <span>Log out</span>
            </button>
          </div>
        )}
      </div>
      <div className="column grow full-width">
        <LoginScreen
          loginStatus={loginStatus}
          authStatus={authStatus}
          loading={loading}
          authError={authError}
        />
        {getAppContents()}
      </div>
      <div className="full-width footer">
        <p>Created by <a href="https://www.audiotool.com/user/kepz" target="_blank">Kyrylo Polozyuk</a></p>
        <p>Powered by <a href="https://developer.audiotool.com/" target="_blank">Audiotool SDK</a>, <a href="https://github.com/shaack/cm-chessboard" target="_blank">cm-chessboard</a>, <a href="https://chess-api.com/" target="_blank">chess-api.com</a> and <a href="https://github.com/josefjadrny/js-chess-engine" target="_blank">js-chess-engine</a></p>
      </div>
    </div >
    </AudiotoolContext.Provider>
  );
};
