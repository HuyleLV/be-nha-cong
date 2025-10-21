import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// This guard attempts JWT auth but never throws on missing/invalid tokens.
// It returns `null` user when not authenticated, allowing public access.
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    // If there's an error or no user, treat as anonymous instead of throwing.
    if (err || !user) {
      return null;
    }
    return user;
  }
}
