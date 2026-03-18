import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { useCallback, useEffect, useState } from "react"
import { Footer } from "./components/Footer"
import { Icons } from "./components/Icon"
import { AudiotoolContext } from "./context"
import { useDialog } from "./dialog/useDialog"
import { useAuth } from "./hooks/useAuth"
import { LoginScreen } from "./LoginScreen"
import {
  AUDIOTOOL_STUDIO_BASE,
  extractProjectId,
} from "./ProjectSelector/projectId"
import { ProjectSelector } from "./ProjectSelector/ProjectSelector"
import { ProjectSyncedComponent } from "./ProjectSyncedComponent"
import { SettingsProvider } from "./settings/SettingsProvider"

export const App = () => {
  const { loginStatus, authStatus, loading, authError, handleLogin } = useAuth()
  const { showDialog, closeDialog } = useDialog()

  const [client, setClient] = useState<AudiotoolClient | undefined>(undefined)
  const [nexus, setNexus] = useState<
    SyncedDocument | undefined
  >(undefined)
  const [projectUrl, setProjectUrl] = useState<string>("")

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const urlParam = params.get("projectUrl")
    if (urlParam) setProjectUrl(urlParam)
  }, [])

  const handleLogout = async () => {
    if (loginStatus?.loggedIn !== true) return
    setNexus(undefined)
    setClient(undefined)
    setProjectUrl("")
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
    if (nexus !== undefined) await nexus.stop()
    setClient(undefined)
    setNexus(undefined)
  }, [nexus])

  const getAppContents = (): React.ReactNode => {
    if (authStatus !== "logged-in") return null
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
    return (
      <ProjectSyncedComponent
        projectUrl={projectUrl}
        onClose={handleCloseProject}
      />
    )
  }

  return (
    <AudiotoolContext.Provider value={{ client, nexus: nexus }}>
      <SettingsProvider>
        <div className="column app-container">
          <div className="row full-width top-bar">
            <div className="title-container">
              <button
                type="button"
                className="title hug tertiary"
                onClick={() => {
                  if (nexus === undefined) return
                  const id = "exit-confirmation"
                  showDialog({
                    id,
                    title: "Exit game",
                    content: <p>Are you sure?</p>,
                    buttons: [
                      { label: "Cancel", onClick: () => closeDialog(id) },
                      {
                        label: "Exit",
                        variant: "warning",
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
              {authStatus === "logged-in" &&
                nexus &&
                client &&
                projectUrl && (
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
                  if (authStatus === "logged-in") void handleLogout()
                  else handleLogin()
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
                    <span>
                      {loading ? "Redirecting..." : "Log in"}
                    </span>
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
      </SettingsProvider>
    </AudiotoolContext.Provider>
  )
}
