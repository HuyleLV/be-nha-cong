import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZaloTokenEntity } from './zalo-token.entity';
import { createHash } from 'crypto';
import { ConfigService } from '@nestjs/config';

type ZaloTokenResponse = {
	access_token?: string;
	expires_in?: number;
	refresh_token?: string;
	token_type?: string;
	scope?: string;
};

@Injectable()
export class ZaloService {
	private readonly logger = new Logger(ZaloService.name);

		constructor(
			@InjectRepository(ZaloTokenEntity) private readonly repo: Repository<ZaloTokenEntity>,
			private readonly config: ConfigService,
		) {}

	private mask(value?: string | null, visible: number = 4) {
		if (!value) return 'null';
		const v = Math.max(0, Math.min(visible, value.length));
		return value.slice(0, v) + '...' + `(${value.length})`;
	}

		private async getRow(): Promise<ZaloTokenEntity> {
				const rows = await this.repo.find({ take: 1 });
				let row: ZaloTokenEntity | null = rows[0] ?? null;
				if (!row) {
					const created = this.repo.create({} as Partial<ZaloTokenEntity>);
					created.refreshToken = null;
					row = await this.repo.save(created);
				}
				return row;
		}

	/**
	 * Exchange refresh_token -> access_token using Zalo OA OAuth endpoint.
	 * Endpoint: https://oauth.zaloapp.com/v4/oa/access_token
	 * Will persist a rotated refresh_token (if returned) into DB.
	 */
		async exchangeAccessToken(params: {
			appId?: string;
			appSecret?: string;
			refreshToken?: string; // optional override; if omitted, will use the one stored in DB
		}): Promise<ZaloTokenResponse | null> {
			const appId = params.appId || this.config.get<string>('ZALO_CLIENT_ID') || '';
			const appSecret = params.appSecret || this.config.get<string>('ZALO_CLIENT_SECRET') || '';
            const endpoint = 'https://oauth.zaloapp.com/v4/oa/access_token';

			if (!appId || !appSecret) {
				return null;
			}

            const row = await this.getRow();
			const refreshToken = params.refreshToken ?? row.refreshToken ?? undefined;
			if (!refreshToken) {
				return null;
			}

				const doPost = async (form: Record<string, string>) => {
					const body = new URLSearchParams(form as any);
					const res = await fetch(endpoint, {
						method: 'POST',
						headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json', secret_key: appSecret },
						body,
					} as any);
					const text = await res.text();
					if (!res.ok) return null as ZaloTokenResponse | null;
					try {
						return JSON.parse(text) as ZaloTokenResponse;
					} catch {
						return null as ZaloTokenResponse | null;
					}
				};

			// As per spec: header contains secret_key; body contains only app_id, refresh_token, grant_type
			const json = await doPost({
				grant_type: 'refresh_token',
				refresh_token: refreshToken,
				app_id: appId,
			});

			if (!json) return null;

		// Persist rotated refresh token if provided
		if (json.refresh_token && json.refresh_token !== row.refreshToken) {
			row.refreshToken = json.refresh_token;
			await this.repo.save(row);
		}

		return json;
	}

		private normalizePhone84(phoneRaw: string) {
			const raw = String(phoneRaw || '').trim();
			if (raw.startsWith('+84')) return '84' + raw.slice(3);
			if (raw.startsWith('84')) return raw;
			if (raw.startsWith('0')) return '84' + raw.slice(1);
			return raw.replace(/\D/g, '');
		}

		private sha256Hex(value: string) {
			return createHash('sha256').update(value).digest('hex');
		}

        async sendTemplateHashphone(params: {
            appId?: string;
            appSecret?: string;
			phone: string;
			templateId: string;
			templateData: Record<string, any>;
			trackingId?: string;
		}): Promise<{ sent: boolean; response?: any; status?: number }>
		{
            const appId = params.appId || this.config.get<string>('ZALO_CLIENT_ID') || '';
            const appSecret = params.appSecret || this.config.get<string>('ZALO_CLIENT_SECRET') || '';
            const { phone, templateId, templateData } = params;
			const trackingId = params.trackingId || `zns_${Date.now()}_${Math.floor(Math.random()*1000)}`;

			if (!appId || !appSecret) {
				return { sent: false };
			}
			if (!phone || !templateId) {
				return { sent: false };
			}
			const tokenRes = await this.exchangeAccessToken({ appId, appSecret });
			const accessToken = tokenRes?.access_token;
			if (!accessToken) {
				return { sent: false };
			}

			const phone84 = this.normalizePhone84(phone);
			const phoneHash = this.sha256Hex(phone84);
			const endpoint = 'https://business.openapi.zalo.me/message/template/hashphone';
			const payload = {
				hash_phone: phoneHash,
				template_id: templateId,
				template_data: templateData,
				tracking_id: trackingId,
			} as any;

			const execSend = async (tok: string) => fetch(endpoint, {
				method: 'POST',
				headers: { access_token: tok, 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			} as any);

			// Log only access token and response
			this.logger.log(`Zalo access_token: ${accessToken}`);
			let res = await execSend(accessToken);
			if (res.status === 401 || res.status === 403) {
				const retry = await this.exchangeAccessToken({ appId, appSecret });
				const tok = retry?.access_token;
				if (tok) {
					this.logger.log(`Zalo access_token (retry): ${tok}`);
					res = await execSend(tok);
				}
			}

			const text = await res.text();
			// Log exactly the Zalo response and the access token is logged above
			this.logger.log(`Zalo response tracking=${trackingId}: ${text}`);
			if (!res.ok) return { sent: false, status: res.status };
			try {
				const json = JSON.parse(text);
				return { sent: true, response: json };
			} catch {
				return { sent: true, response: text } as any;
			}
		}
}

