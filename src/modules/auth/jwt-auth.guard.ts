import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    if (err || !user) {
      // info?.message có thể là 'No auth token', 'jwt expired', 'invalid signature', ...
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
