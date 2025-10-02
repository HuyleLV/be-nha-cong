// src/config/app.config.ts
import { registerAs } from '@nestjs/config';
export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '5000', 10), // <-- default 5000
}));
