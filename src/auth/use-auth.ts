import { getLoginStatus, type LoginStatus } from "@audiotool/nexus";
import { useEffect, useRef, useState } from "react";
import type { AuthStatus, UseAuthReturn } from "./auth";

export type { AuthStatus } from "./auth";

// OIDC Configuration - same client as technoract for Audiotool ecosystem
const CLIENT_ID = "dbf1d2d6-c267-4bc3-adbd-5aca2d43e6f5";
const REDIRECT_URL =
  import.meta.env.MODE === "development"
    ? "http://127.0.0.1:5173/"
    : (import.meta.env.VITE_REDIRECT_URL ||
        "https://kyrylo-polozyuk.github.io/ambient-chess/");
const SCOPE = "project:write";

export const useAuth = (): UseAuthReturn => {
  const [loginStatus, setLoginStatus] = useState<LoginStatus | undefined>(
    undefined,
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("checking");
  const [authError, setAuthError] = useState<string | undefined>(undefined);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) {
      return;
    }
    hasInitialized.current = true;
    const initializeLoginStatus = async () => {
      const loginStatusResult: LoginStatus = await getLoginStatus({
        clientId: CLIENT_ID,
        redirectUrl: REDIRECT_URL,
        scope: SCOPE,
      });
      setLoginStatus(loginStatusResult);
    };

    initializeLoginStatus();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      if (loginStatus === undefined) {
        return;
      }

      if (loginStatus.loggedIn === false) {
        setAuthStatus("logged-out");
        setLoading(false);
        setAuthError(undefined);
      } else {
        setAuthStatus("logged-in");
        setLoading(false);
        setAuthError(undefined);
      }
    };

    checkAuth();
  }, [loginStatus]);

  return {
    loginStatus,
    authStatus,
    loading,
    authError,
  };
};
