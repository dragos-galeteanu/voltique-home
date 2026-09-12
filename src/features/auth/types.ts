/**
 * The two customer roles. The role decides which navigation shell mounts and which
 * data the API returns, so it is treated as part of the session, never as a screen
 * level flag.
 */
export type UserRole = 'consumer' | 'installer';

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: AuthUser;
  tokens: AuthTokens;
};
