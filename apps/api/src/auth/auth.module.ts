import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { PrismaModule } from '../prisma/prisma.module';
import { TenantModule } from '../common/tenant.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'dev-secret-change-me'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') },
      }),
    }),
  ],
  controllers: [AuthController, RolesController],
  providers: [AuthService, RolesService, JwtStrategy],
  exports: [AuthService, RolesService, JwtModule],
})
export class AuthModule {}
