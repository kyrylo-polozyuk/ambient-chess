/**
 * Removes the "users/" prefix from a username string (e.g. "users/john" → "john").
 */
export const trimUsername = (username: string): string =>
  username.replace(/^users\//, "")
