import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false }),
    { bufferLogs: true },
  );

  const logger = new Logger('BusinessOS');
  app.useLogger(logger);

  // Global prefix
  app.setGlobalPrefix('api/v1', {
    exclude: ['health'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('OpenBusinessOS API')
    .setDescription('API completa para gestão empresarial — Financeiro, CRM, Analytics, Workflow e Onboarding')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Autenticação e autorização')
    .addTag('financial', 'Gestão financeira — transações, CMV, DRE, conciliação')
    .addTag('crm', 'CRM — clientes, LTV, segmentação, churn')
    .addTag('products', 'Produtos e estoque')
    .addTag('analytics', 'Dashboard e métricas')
    .addTag('workflow', 'Automações e workflows')
    .addTag('onboarding', 'Onboarding por nicho')
    .addTag('organizations', 'Gestão da organização')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  // Graceful shutdown
  const prisma = app.get(PrismaService);
  app.enableShutdownHooks();

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3001);

  await app.listen(port, '0.0.0.0');
  Logger.log(`🚀 API running on http://localhost:${port}/api/v1`);
  Logger.log(`📖 Swagger docs at http://localhost:${port}/api/v1/docs`);
}

bootstrap();
