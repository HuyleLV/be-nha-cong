import { registerAs } from '@nestjs/config';

export default registerAs('zalo', () => ({
  oaId: process.env.ZALO_OA_ID || '',
  token: process.env.ZALO_OA_TOKEN || process.env.ZNS_ACCESS_TOKEN || '',
  templateIdOtp: process.env.ZNS_TEMPLATE_ID_OTP || '',
  enabled: (process.env.ZNS_ENABLED || 'true').toLowerCase() === 'true',
}));
