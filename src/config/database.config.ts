import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  type: 'mysql' as const,
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),

  // Hỗ trợ cả DB_USERNAME/DB_PASSWORD và DB_USER/DB_PASS
  username: process.env.DB_USERNAME ?? process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? process.env.DB_PASS ?? '',

  database: process.env.DB_NAME || 'db_nhacong',
  // Chỉ bật khi dev; prod nên để false và dùng migrations
  synchronize: (process.env.DB_SYNCHRONIZE ?? 'true') === 'true',
  logging: (process.env.DB_LOGGING ?? 'true') === 'true',
}));
