import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { useEffect, useState } from "react"
import { useShowAboutDialog } from "./about"
import { Footer } from "./components/Footer"
import { Icons } from "./components/Icon"
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

const AppContent = () => {
  const { loginStatus, authStatus, loading, authError, handleLogin } = useAuth()
  const showAboutDialog = useShowAboutDialog()

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
    <AudiotoolContext.Provider value={{ client, nexus: syncedDocument }}>
          <div className="column app-container">
            <div className="row full-width top-bar">
              <div className="title-container">
                <button
                  type="button"
                  className="title hug tertiary"
                  title="About Ambient Chess"
                  onClick={() => showAboutDialog()}
                >
                  <Icons.ChessQueen />
                  <span>Ambient Chess</span>
                </button>
              </div>
              <div className="user-info">
                {authStatus === "logged-in" && syncedDocument && client && projectUrl && (
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
                    <Icons.Play />
                    <span>Open Studio</span>
                  </button>
                )}
                <button
                  className={`hug responsive ${loading ? "loading" : ""}`}
                  onClick={() => {
                    if (authStatus === "logged-in") {
                      void handleLogout()
                    } else {
                      handleLogin()
                    }
                  }}
                  disabled={loading}
                >
                  {authStatus === "logged-in" ? (
                    <>
                      <Icons.LogOut />
                      <span>Log out</span>
                    </>
                  ) : (
                    <>
                      {loading ? (
                        <Icons.Loader className="loading-spinner" />
                      ) : (
                        <Icons.LogIn />
                      )}
                      <span>{loading ? "Redirecting..." : "Log in"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="column grow full-width">
              <LoginScreen
                authStatus={authStatus}
                loading={loading}
                authError={authError}
                handleLogin={handleLogin}
              />
              {getAppContents()}
            </div>
            <Footer />
          </div>
    </AudiotoolContext.Provider>
  )
}

export const App = () => (
  <DialogProvider>
    <ErrorHandler />
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  </DialogProvider>
)
