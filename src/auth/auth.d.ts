import type { LoginStatus } from "@audiotool/nexus";

export type AuthStatus = "checking" | "logged-out" | "logged-in";

export type UseAuthReturn = {
  loginStatus: LoginStatus | undefined;
  authStatus: AuthStatus;
  loading: boolean;
  authError: string | undefined;
};
