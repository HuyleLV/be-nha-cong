import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard attempts JWT auth but never throws on missing/invalid tokens.
// It returns `null` user when not authenticated, allowing public access.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    if (err || !user) {
      return null;
    }

    return user;
  }
}
