import type { LoginScreenProps } from "./login";

export const LoginScreen = ({
  loginStatus,
  authStatus,
  loading,
  authError,
}: LoginScreenProps) => {
  const handleLogin = () => {
    if (loginStatus?.loggedIn === false) {
      loginStatus.login();
    }
  };

  if (loading && authStatus === "checking") {
    return (
      <div className="column center">
        <br />
        <br />
        <br />
        <p>Checking authentication...</p>
      </div>
    );
  }

  if (authStatus === "logged-out") {
    return (
      <div className="column center">
        <p>You need to authorize this application to continue</p>
        <button className="hug" onClick={handleLogin} disabled={loading}>
          <span className="material-symbols">login</span>
          {loading ? "Redirecting..." : "Log in with Audiotool"}
        </button>
        {authError && <p className="error">{authError}</p>}
      </div>
    );
  }

  return null;
};
