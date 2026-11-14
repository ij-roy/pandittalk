import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class DetailedKundliGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      body?: { detailed?: unknown };
      headers?: { authorization?: unknown };
    }>();
    if (request.body?.detailed === true) {
      return (await super.canActivate(context)) as boolean;
    }
    const header = request.headers?.authorization;
    if (typeof header !== 'string' || !/^bearer\s+\S+/i.test(header)) {
      return true;
    }
    try {
      await super.canActivate(context);
    } catch {
      // Free Kundli still runs when the token cannot be read.
    }
    return true;
  }

  handleRequest<TUser>(
    err: Error | null,
    user: TUser,
    _info: unknown,
    context: ExecutionContext,
  ): TUser | null {
    const request = context
      .switchToHttp()
      .getRequest<{ body?: { detailed?: unknown } }>();
    if (request.body?.detailed === true) {
      if (err || !user) {
        throw err ?? new UnauthorizedException();
      }
      return user;
    }
    if (err || !user) return null;
    return user;
  }
}
