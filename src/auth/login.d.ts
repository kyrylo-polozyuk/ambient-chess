import type { LoginStatus } from "@audiotool/nexus";
import type { AuthStatus } from "../auth/auth";

export type LoginScreenProps = {
  loginStatus: LoginStatus | undefined;
  authStatus: AuthStatus;
  loading: boolean;
  authError: string | undefined;
};
