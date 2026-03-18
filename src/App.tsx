import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { useCallback, useEffect, useState } from "react"
import { Footer } from "./components/Footer"
import { Icons } from "./components/Icon"
import { AudiotoolContext } from "./context"
import { DialogProvider } from "./dialog/DialogContext"
import { useDialog } from "./dialog/useDialog"
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
  const { showDialog, closeDialog } = useDialog()

  const [client, setClient] = useState<AudiotoolClient | undefined>(undefined)
  const [nexus, setNexus] = useState<
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
    setNexus(undefined)
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
    setNexus(newDocument)
    setProjectUrl(projectUrl)
  }

  const handleCloseProject = useCallback(async () => {
    const params = new URLSearchParams(window.location.search)
    params.delete("projectUrl")
    window.history.replaceState(
      {},
      "",
      params.toString()
        ? `${window.location.pathname}?${params.toString()}`
        : window.location.pathname,
    )
    if (nexus !== undefined) {
      await nexus.stop()
    }
    setClient(undefined)
    setNexus(undefined)
  }, [nexus])

  const getAppContents = (): React.ReactNode => {
    // Don't show project connection if not logged in (LoginScreen handles that)
    if (authStatus !== "logged-in") {
      return null
    }

    // Show project connection screen if authenticated but not connected
    if (nexus === undefined) {
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
        onClose={handleCloseProject}
      />
    )
  }

  return (
    <AudiotoolContext.Provider value={{ client, nexus: nexus }}>
      <div className="column app-container">
        <div className="row full-width top-bar">
          <div className="title-container">
            <button
              type="button"
              className="title hug tertiary"
              title={
                "Exit game"
              }
              onClick={() => {
                if (nexus === undefined) {
                  return
                }
                const id = "exit-confirmation"
                showDialog({
                  id,
                  title: "Exit game",
                  content: <p>Are you sure?</p>,
                  buttons: [
                    {
                      label: "Cancel",
                      onClick: () => closeDialog(id),
                    },
                    {
                      label: "Exit",
                      variant: "primary",
                      onClick: () => {
                        closeDialog(id)
                        void handleCloseProject()
                      },
                    },
                  ],
                })
              }}
            >
              <Icons.ChessQueen />
              <span>Ambient Chess</span>
            </button>
          </div>
          <div className="user-info">
            {authStatus === "logged-in" && nexus && client && projectUrl && (
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
