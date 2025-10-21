import { SetMetadata } from '@nestjs/common';

/**
 * Gắn metadata ROLE cho route
 * Ví dụ:
 *   @Roles('admin', 'operator')
 *   @UseGuards(JwtAuthGuard, RolesGuard)
 */
export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
