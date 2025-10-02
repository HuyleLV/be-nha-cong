import { Body, Controller, Post, Get, Req, UseGuards,  } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Req() req: any) {
        return req.user;
    }

    // Đăng nhập chung (trả token)
    @Post('login')
    async login(@Body() dto: LoginDto) {
        const user = await this.authService.validateUser(dto.email, dto.password_hash);
        if (!user) throw new Error('Invalid credentials'); // bạn có thể throw UnauthorizedException
        return this.authService.login(user);
    }

    // Route chuyên cho admin (bắt buộc role admin)
    @Post('login-admin')
    async loginAdmin(@Body() dto: LoginDto) {
        return this.authService.adminLogin(dto.email, dto.password_hash);
    }
}
