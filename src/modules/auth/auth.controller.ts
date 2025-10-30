import { Body, Controller, Post, Get, Req, UseGuards,  } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RegisterDto } from './dto/register.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { LoginGoogleDto } from './dto/login-google.dto';
import { LoginGoogleCodeDto } from './dto/login-google-code.dto';
import { CompleteProfileDto } from './dto/complete-profile.dto';
import { SendPhoneOtpDto, VerifyPhoneDto } from './dto';

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
        return this.authService.login(user);
    }

        @Post('register')
        async register(@Body() dto: RegisterDto) {
            const res = await this.authService.register(dto);
            return res; // { message: 'Đã gửi mã xác thực tới email...' }
        }

        @Post('verify-email')
        async verifyEmail(@Body() dto: VerifyEmailDto) {
            return this.authService.verifyEmail(dto.email, dto.code);
        }

    // Bắt đầu đăng ký bằng số điện thoại: tạo/ghi OTP và gửi qua Zalo/ZNS (nếu cấu hình), fallback log server
    @Post('start-register-phone')
    async startRegisterByPhone(@Body() dto: SendPhoneOtpDto) {
        return this.authService.startRegisterByPhone(dto.phone);
    }

    // Xác minh OTP điện thoại; thành công sẽ trả về token đăng nhập
    @Post('verify-phone')
    async verifyPhone(@Body() dto: VerifyPhoneDto) {
        return this.authService.verifyPhone(dto.phone, dto.code);
    }

    // Đăng nhập bằng Google ID token
    @Post('login-google')
    async loginGoogle(@Body() dto: LoginGoogleDto) {
        return this.authService.loginWithGoogle(dto.idToken);
    }

    // Đăng nhập bằng Google Authorization Code (sử dụng cả CLIENT_ID và CLIENT_SECRET)
    @Post('login-google-code')
    async loginGoogleCode(@Body() dto: LoginGoogleCodeDto) {
        return this.authService.loginWithGoogleCode(dto.code, dto.redirectUri);
    }

    // Cho phép người dùng social (google) mới hoàn thiện hồ sơ và đặt mật khẩu
    @UseGuards(JwtAuthGuard)
    @Post('complete-profile')
    async completeProfile(@Req() req: any, @Body() dto: CompleteProfileDto) {
        // JwtStrategy.validate() returns { id, name, email, role }
        // so prefer id and fallback to sub if strategy changes
        const userId = req.user?.id ?? req.user?.sub;
        return this.authService.completeProfile(userId, dto);
    }

    // Route chuyên cho admin (bắt buộc role admin)
    @Post('login-admin')
    async loginAdmin(@Body() dto: LoginDto) {
        return this.authService.adminLogin(dto.email, dto.password_hash);
    }
}