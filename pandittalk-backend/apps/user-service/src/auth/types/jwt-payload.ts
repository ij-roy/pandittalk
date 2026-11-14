/** Shape of the signed JWT payload issued by `verifyOtp`. */
export interface JwtPayload {
  /** User id (Postgres uuid). */
  sub: string;
  phoneNumber: string;
}

/** Request-attached representation of the authenticated user. */
export interface AuthenticatedUser {
  sub: string;
  phoneNumber: string;
}
