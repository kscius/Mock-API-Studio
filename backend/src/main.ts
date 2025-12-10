// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers
  app.use(helmet());

  // CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3000;
  const analyticsEnabled = process.env.ANALYTICS_ENABLED === 'true';

  await app.listen(port);
  
  console.log(`🚀 Mock API Studio Backend running on http://localhost:${port}`);
  console.log(`📚 Mock Runtime: http://localhost:${port}/mock/:apiSlug/*`);
  console.log(`🔐 Auth endpoints: http://localhost:${port}/auth/*`);
  console.log(`📊 Analytics: ${analyticsEnabled ? 'ENABLED' : 'DISABLED'}`);
}
bootstrap();

