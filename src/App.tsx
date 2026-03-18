import { type AudiotoolClient, type SyncedDocument } from "@audiotool/nexus"
import { useCallback, useEffect, useState } from "react"
import { Footer } from "./components/Footer"
import { Icons } from "./components/Icon"
import { AudiotoolContext } from "./context"
import { DialogProvider } from "./dialog/DialogContext"
import { SettingsProvider } from "./SettingsProvider"
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

const AppContentInner = (props: {
  loginStatus: ReturnType<typeof useAuth>["loginStatus"]
  authStatus: ReturnType<typeof useAuth>["authStatus"]
  loading: boolean
  authError: string | undefined
  handleLogin: () => void
  handleLogout: () => Promise<void>
  client: AudiotoolClient | undefined
  nexus: SyncedDocument | undefined
  projectUrl: string
  setProjectUrl: (url: string) => void
  handleProjectConnected: (
    client: AudiotoolClient,
    doc: SyncedDocument,
    url: string,
  ) => Promise<void>
  handleCloseProject: () => Promise<void>
}) => {
  const { showDialog, closeDialog } = useDialog()

  const getAppContents = (): React.ReactNode => {
    if (props.authStatus !== "logged-in") return null
    if (props.nexus === undefined) {
      return (
        <ProjectSelector
          loginStatus={props.loginStatus}
          onProjectConnected={props.handleProjectConnected}
          projectUrl={props.projectUrl}
          onProjectUrlChange={props.setProjectUrl}
        />
      )
    }
    return (
      <ProjectSyncedComponent
        projectUrl={props.projectUrl}
        onClose={props.handleCloseProject}
      />
    )
  }

  return (
    <div className="column app-container">
      <div className="row full-width top-bar">
        <div className="title-container">
          <button
            type="button"
            className="title hug tertiary"
            title="Exit game"
            onClick={() => {
              if (props.nexus === undefined) return
              const id = "exit-confirmation"
              showDialog({
                id,
                title: "Exit game",
                content: <p>Are you sure?</p>,
                buttons: [
                  { label: "Cancel", onClick: () => closeDialog(id) },
                  {
                    label: "Exit",
                    variant: "primary",
                    onClick: () => {
                      closeDialog(id)
                      void props.handleCloseProject()
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
          {props.authStatus === "logged-in" &&
            props.nexus &&
            props.client &&
            props.projectUrl && (
              <button
                className="hug"
                onClick={() => {
                  const projectId = extractProjectId(props.projectUrl)
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
            className={`hug responsive ${props.loading ? "loading" : ""}`}
            onClick={() => {
              if (props.authStatus === "logged-in") {
                void props.handleLogout()
              } else {
                props.handleLogin()
              }
            }}
            disabled={props.loading}
          >
            {props.authStatus === "logged-in" ? (
              <>
                <Icons.LogOut />
                <span>Log out</span>
              </>
            ) : (
              <>
                {props.loading ? (
                  <Icons.Loader className="loading-spinner" />
                ) : (
                  <Icons.LogIn />
                )}
                <span>
                  {props.loading ? "Redirecting..." : "Log in"}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="column grow full-width">
        <LoginScreen
          authStatus={props.authStatus}
          loading={props.loading}
          authError={props.authError}
          handleLogin={props.handleLogin}
        />
        {getAppContents()}
      </div>
      <Footer />
    </div>
  )
}

const AppContent = () => {
  const { loginStatus, authStatus, loading, authError, handleLogin } = useAuth()

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

  return (
    <AudiotoolContext.Provider value={{ client, nexus: nexus }}>
      <SettingsProvider>
        <DialogProvider>
          <ErrorHandler />
          <ErrorBoundary>
            <AppContentInner
              loginStatus={loginStatus}
              authStatus={authStatus}
              loading={loading}
              authError={authError}
              handleLogin={handleLogin}
              handleLogout={handleLogout}
              client={client}
              nexus={nexus}
              projectUrl={projectUrl}
              setProjectUrl={setProjectUrl}
              handleProjectConnected={handleProjectConnected}
              handleCloseProject={handleCloseProject}
            />
          </ErrorBoundary>
        </DialogProvider>
      </SettingsProvider>
    </AudiotoolContext.Provider>
  )
}

export const App = () => <AppContent />
