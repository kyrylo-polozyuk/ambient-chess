import type { LoginStatus } from "@audiotool/nexus"
import { Icons } from "./components/Icon"
import { type AuthStatus } from "./hooks/useAuth"

type LoginScreenProps = {
  loginStatus: LoginStatus | undefined
  authStatus: AuthStatus
  loading: boolean
  authError: string | undefined
}

export const LoginScreen = ({
  loginStatus,
  authStatus,
  loading,
  authError,
}: LoginScreenProps) => {
  const handleLogin = () => {
    if (loginStatus?.loggedIn === false) {
      loginStatus.login()
    }
  }

  // Show loading state while checking auth
  if (loading && authStatus === "checking") {
    return (
      <div className="column center small-gap">
        <Icons.Loader className="loading-spinner" />
        <p>Checking authentication...</p>
      </div>
    )
  }

  // Show login screen if not authenticated
  if (authStatus === "logged-out") {
    return (
      <div className="column center">
        <p>You need to authorize this application to continue</p>
        <button
          className={`hug ${loading ? "loading" : ""}`}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <Icons.Loader className="loading-spinner" />
          ) : (
            <Icons.LogIn />
          )}
          {loading ? "Redirecting..." : "Log in with Audiotool"}
        </button>
        {authError && <p className="error">{authError}</p>}
      </div>
    )
  }

  // If logged in, don't render anything (parent will handle logged-in state)
  return null
}
