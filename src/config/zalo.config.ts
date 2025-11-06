import { registerAs } from '@nestjs/config';

export default registerAs('zalo', () => ({
  oaId: process.env.ZALO_OA_ID || '',
  token: process.env.ZALO_OA_TOKEN || process.env.ZNS_ACCESS_TOKEN || '',
  templateIdOtp: process.env.ZNS_TEMPLATE_ID_OTP || '',
  enabled: (process.env.ZNS_ENABLED || 'true').toLowerCase() === 'true',
  // OAuth2-style credentials and endpoints (optional; required if you want auto refresh)
  clientId: process.env.ZALO_CLIENT_ID || '',
  clientSecret: process.env.ZALO_CLIENT_SECRET || '',
  tokenUrl: process.env.ZALO_TOKEN_URL || '',
  refreshUrl: process.env.ZALO_REFRESH_URL || '',
  // Bootstrap a refresh_token the first time (preferred over static access token)
  initialRefreshToken: process.env.ZALO_INITIAL_REFRESH_TOKEN || process.env.ZALO_REFRESH_TOKEN || '',
  // Safety margin seconds before expiry to refresh proactively
  refreshSkewSec: Number(process.env.ZALO_REFRESH_SKEW_SEC || 60),
}));
