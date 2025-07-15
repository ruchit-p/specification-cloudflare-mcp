import type { JWTPayload } from "jose";

export type UserProps = {
  claims: JWTPayload;
  tokenSet: {
    accessToken: string;
    accessTokenTTL?: number;
    idToken: string;
    refreshToken: string;
  };
}; 