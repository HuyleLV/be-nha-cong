import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy danh sách roles được yêu cầu từ metadata
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

      // Nếu route không gắn @Roles() → cho phép luôn
      if (!requiredRoles || requiredRoles.length === 0) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('Chưa đăng nhập hoặc không có quyền truy cập');
    }

      // Quyền admin: có thể truy cập tất cả các API (bỏ qua kiểm tra @Roles)
      if (String(user.role).toLowerCase() === 'admin') {
        return true;
      }

    // So khớp role (case-insensitive)
    const hasRole = requiredRoles.some(
      (r) => r.toLowerCase() === user.role.toLowerCase(),
    );

    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    return true;
  }
}