import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, _context: ExecutionContext) {
    if (err || !user) {
      // Chuẩn hoá thông điệp lỗi để FE nhận biết và logout
      const rawMsg = String(info?.message || '').toLowerCase();
      let message = info?.message || 'Unauthorized';
      if (
        rawMsg.includes('jwt expired') ||
        rawMsg.includes('token expired')
      ) {
        message = 'Phiên đăng nhập đã hết hạn';
      } else if (
        rawMsg.includes('no auth token') ||
        rawMsg.includes('no authorization token') ||
        rawMsg.includes('jwt must be provided')
      ) {
        message = 'Thiếu token đăng nhập';
      } else if (
        rawMsg.includes('invalid signature') ||
        rawMsg.includes('jwt malformed') ||
        rawMsg.includes('invalid token')
      ) {
        message = 'Token không hợp lệ';
      }
      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}
