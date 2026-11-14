import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../types/jwt-payload';

/**
 * Pulls the authenticated user (populated by `JwtAuthGuard`) off the request.
 * Returns the full user object, or a single property when a key is provided
 * (e.g. `@CurrentUser('sub') userId: string`).
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof AuthenticatedUser | undefined,
    ctx: ExecutionContext,
  ): AuthenticatedUser | string | undefined => {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const user = req.user;
    if (!user) {
      return undefined;
    }
    return data ? user[data] : user;
  },
);
