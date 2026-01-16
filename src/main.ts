import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { loggerConfig } from './config/logger.config';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger(loggerConfig),
  });

  // Security Headers
  app.use(helmet());

  // Response Compression
  app.use(compression());

  // CORS Configuration - Secure
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 3600, // Cache preflight requests for 1 hour
  });

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Friendly defaults for root/health checks
  const adapter = app.getHttpAdapter();
  const httpServer = adapter?.getInstance?.();
  const defaultPayload = {
    name: 'Nhà Cộng API',
    version: process.env.npm_package_version ?? 'dev',
    docs: '/docs',
    health: '/api/health',
  };

  // Safe approach to add routes for Express
  if (httpServer && typeof httpServer.get === 'function') {
    httpServer.get('/', (_req: any, res: any) => {
      res.json({
        ...defaultPayload,
        message: 'Welcome to the Nhà Cộng API',
        timestamp: new Date().toISOString(),
      });
    });
    httpServer.get('/api', (_req: any, res: any) => {
      res.json({
        ...defaultPayload,
        timestamp: new Date().toISOString(),
      });
    });
    httpServer.get('/api/health', (_req: any, res: any) => {
      res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      });
    });
  }

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Nhà Cộng API')
    .setDescription(
      'API documentation for Nhà Cộng property rental management platform',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management (Admin)')
    .addTag('Apartments', 'Apartment/room management')
    .addTag('Buildings', 'Building management')
    .addTag('Locations', 'Location management')
    .addTag('Beds', 'Bed management')
    .addTag('Assets', 'Asset management')
    .addTag('Services', 'Service management')
    .addTag('Service Providers', 'Service provider management')
    .addTag('Advertisements', 'Advertisement management')
    .addTag('Categories', 'Category management')
    .addTag('Upload', 'File upload endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const cfg = app.get(ConfigService);
  const port = cfg.get<number>('app.port') ?? 5000;
  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📘 Swagger on http://localhost:${port}/docs`);
}
bootstrap();