import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OnboardingService } from './onboarding.service';
import { JwtGuard } from '../auth/jwt.guard';

@ApiTags('onboarding')
@ApiBearerAuth()
@Controller('onboarding')
@UseGuards(JwtGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get('config')
  @ApiOperation({ summary: 'Buscar configuração de onboarding por nicho' })
  async getConfig(@Query('niche') niche: string) {
    return this.onboardingService.getConfig(niche);
  }

  @Post('start')
  @ApiOperation({ summary: 'Iniciar onboarding para o nicho selecionado' })
  async startOnboarding(@Request() req: any, @Body('niche') niche: string) {
    return this.onboardingService.startOnboarding(req.user.organizationId, niche);
  }

  @Post('step')
  @ApiOperation({ summary: 'Completar etapa do onboarding' })
  async completeStep(@Request() req: any, @Body() body: { stepId: string; data: Record<string, any> }) {
    return this.onboardingService.completeStep(req.user.organizationId, body.stepId, body.data);
  }

  @Post('complete')
  @ApiOperation({ summary: 'Finalizar onboarding' })
  async completeOnboarding(@Request() req: any) {
    return this.onboardingService.completeOnboarding(req.user.organizationId);
  }
}
