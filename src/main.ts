import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 👉 Bật CORS ở đây
  app.enableCors({
    origin: [
      'http://localhost:3000',       // FE local
      'http://127.0.0.1:3000',       // fallback
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, X-Requested-With',
    credentials: true,
  });

  const cfg = app.get(ConfigService);
  const port = cfg.get<number>('app.port') ?? 5000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📘 Swagger on http://localhost:${port}/docs`);
}
bootstrap();