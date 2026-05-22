import { Controller, Post, Get, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, MfaVerifyDto } from './auth.dto';
import { JwtGuard } from './jwt.guard';
import { Public } from '../common/guards';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar novo usuário e organização' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login com email/senha' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verificar código MFA' })
  async verifyMfa(@Body() dto: MfaVerifyDto) {
    return this.authService.verifyMfa(dto);
  }

  @Get('me')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.id);
  }

  @Post('mfa/enable')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Habilitar MFA para o usuário' })
  async enableMfa(@Request() req: any) {
    return this.authService.enableMfa(req.user.id);
  }

  @Post('mfa/disable')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Desabilitar MFA' })
  async disableMfa(@Request() req: any) {
    return this.authService.disableMfa(req.user.id);
  }
}
