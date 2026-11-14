import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Attaches the user when a bearer token is valid. Missing or bad tokens still allow the request. */
@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers?: { authorization?: unknown };
    }>();
    const header = request.headers?.authorization;
    if (typeof header !== 'string' || !/^bearer\s+\S+/i.test(header)) {
      return true;
    }
    try {
      await super.canActivate(context);
    } catch {
      // A free tool still runs when the token cannot be read.
    }
    return true;
  }

  handleRequest<TUser>(err: Error | null, user: TUser): TUser | null {
    if (err || !user) return null;
    return user;
  }
}
