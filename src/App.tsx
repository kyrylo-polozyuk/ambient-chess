import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { useEffect, useState } from "react"
import { AudiotoolContext } from "./context"
import { DialogProvider } from "./dialog/DialogContext"
import { ErrorBoundary } from "./ErrorBoundary"
import { ErrorHandler } from "./ErrorHandler"
import { useAuth } from "./hooks/useAuth"
import { LoginScreen } from "./LoginScreen"
import {
  AUDIOTOOL_STUDIO_BASE,
  extractProjectId,
} from "./ProjectSelector/projectId"
import { ProjectSelector } from "./ProjectSelector/ProjectSelector"
import { ProjectSyncedComponent } from "./ProjectSyncedComponent"

export const App = () => {
  const { loginStatus, authStatus, loading, authError } = useAuth()

  const [client, setClient] = useState<AudiotoolClient | undefined>(undefined)
  const [syncedDocument, setSyncedDocument] = useState<
    SyncedDocument | undefined
  >(undefined)
  const [projectUrl, setProjectUrl] = useState<string>("")

  // Read projectUrl from URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get("projectUrl")
    if (urlParam) {
      setProjectUrl(urlParam)
    }
  }, [])

  const handleLogout = async () => {
    if (loginStatus?.loggedIn !== true) {
      return
    }

    // Clear client and nexus connections
    setSyncedDocument(undefined)
    setClient(undefined)

    // Clear project URL
    setProjectUrl("")

    // Clear URL parameters
    window.history.replaceState({}, "", window.location.pathname)

    loginStatus?.logout()
  }

  const handleProjectConnected = async (
    client: AudiotoolClient,
    newDocument: SyncedDocument,
    projectUrl: string,
  ) => {
    setClient(client)
    setSyncedDocument(newDocument)
    setProjectUrl(projectUrl)
  }

  const getAppContents = (): React.ReactNode => {
    // Don't show project connection if not logged in (LoginScreen handles that)
    if (authStatus !== "logged-in") {
      return null
    }

    // Show project connection screen if authenticated but not connected
    if (syncedDocument === undefined) {
      return (
        <ProjectSelector
          loginStatus={loginStatus}
          onProjectConnected={handleProjectConnected}
          projectUrl={projectUrl}
          onProjectUrlChange={setProjectUrl}
        />
      )
    }

    // connected to a project, start the generator
    return (
      <ProjectSyncedComponent
        projectUrl={projectUrl}
        onClose={async () => {
          const params = new URLSearchParams(window.location.search)
          params.delete("projectUrl")
          window.history.replaceState(
            {},
            "",
            `${window.location.pathname}?${params.toString()}`,
          )
          if (syncedDocument !== undefined) {
            await syncedDocument.stop()
          }
          setClient(undefined)
          setSyncedDocument(undefined)
        }}
      />
    )
  }

  return (
    <DialogProvider>
      <ErrorHandler />
      <ErrorBoundary>
        <AudiotoolContext.Provider value={{ client, nexus: syncedDocument }}>
          <div className="column app-container">
            <div className="row full-width top-bar">
              <div className="title-container">
                <p className="title"><span className="material-symbols">
                  chess_queen
                </span> <span>Ambient Chess</span></p>
              </div>
              {authStatus === "logged-in" && (
                <div className="user-info">
                  {syncedDocument && client && projectUrl && (
                    <>
                      <button
                        className="hug"
                        onClick={() => {
                          const projectId = extractProjectId(projectUrl)
                          window.open(
                            `${AUDIOTOOL_STUDIO_BASE}${projectId}`,
                            "_blank",
                          )
                        }}
                      >
                        <span className="material-symbols">
                          play_arrow
                        </span>
                        <span>Open Studio</span>
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
              <p>Powered by <a href="https://developer.audiotool.com/" target="_blank">Audiotool SDK</a>, <a href="https://github.com/Clariity/react-chessboard" target="_blank">react-chessboard</a>, <a href="https://chess-api.com/" target="_blank">chess-api.com</a> and <a href="https://github.com/josefjadrny/js-chess-engine" target="_blank">js-chess-engine</a></p>
            </div>
          </div>
        </AudiotoolContext.Provider>
      </ErrorBoundary>
    </DialogProvider>
  )
}
