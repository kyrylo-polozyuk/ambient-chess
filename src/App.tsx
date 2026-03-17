import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { useEffect, useState } from "react"
import { AudiotoolContext } from "./context"
import { DialogProvider } from "./dialog/DialogContext"
import { ErrorBoundary } from "./ErrorBoundary"
import { ErrorHandler } from "./ErrorHandler"
import { useAuth } from "./hooks/useAuth"
import { LoginScreen } from "./LoginScreen"
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

  // Extract project ID from URL or return as-is if it's already just an ID
  // (kept here for use in "Open Studio" button)
  const extractProjectId = (input: string): string => {
    const trimmed = input.trim()

    // If it's already just an ID (no URL structure), return as-is
    if (
      !trimmed.includes("://") &&
      !trimmed.includes("/") &&
      !trimmed.includes("?")
    ) {
      return trimmed
    }

    try {
      const url = new URL(trimmed)
      // Check for project parameter in query string
      const projectParam = url.searchParams.get("project")
      if (projectParam) {
        return projectParam
      }

      // Check if the pathname contains a project ID (e.g., /studio/PROJECT_ID or /project/PROJECT_ID)
      const pathParts = url.pathname.split("/").filter(Boolean)
      const projectIndex = pathParts.findIndex(
        (part) => part === "studio" || part === "project",
      )
      if (projectIndex !== -1 && pathParts[projectIndex + 1]) {
        return pathParts[projectIndex + 1]
      }

      // If no project found in URL, return the last path segment as fallback
      if (pathParts.length > 0) {
        return pathParts[pathParts.length - 1]
      }
    } catch {
      // If URL parsing fails, assume it's already a project ID
      return trimmed
    }

    // Fallback: return trimmed input
    return trimmed
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
    return <ProjectSyncedComponent projectUrl={projectUrl} ></ProjectSyncedComponent >
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
                        onClick={async () => {
                          const params = new URLSearchParams(
                            window.location.search,
                          )
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
                      >
                        <span className="material-symbols">
                          arrow_back
                        </span>
                        <span>Change Project</span>
                      </button>
                      <button
                        className="hug"
                        onClick={() => {
                          const projectId = extractProjectId(projectUrl)
                          window.open(
                            `https://beta.audiotool.com/studio?project=${projectId}`,
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
            <div className="full-width">
              <p>Created by <a href="https://www.audiotool.com/user/kepz" target="_blank">Kyrylo Polozyuk</a></p>
              <p>Powered by <a href="https://developer.audiotool.com/" target="_blank">Audiotool SDK</a>, <a href="https://github.com/shaack/cm-chessboard" target="_blank">cm-chessboard</a>, <a href="https://chess-api.com/" target="_blank">chess-api.com</a> and <a href="https://github.com/josefjadrny/js-chess-engine" target="_blank">js-chess-engine</a></p>
            </div>
          </div>
        </AudiotoolContext.Provider>
      </ErrorBoundary>
    </DialogProvider>
  )
}
