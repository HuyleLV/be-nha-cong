import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConversationsService } from './conversations.service';

// NOTE: This controller assumes the global Auth guard is used and that req.user is available
@UseGuards(JwtAuthGuard)
// The application sets a global prefix `api` in main.ts, so register this controller
// under the relative path 'conversations' to expose endpoints at /api/conversations
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conv: ConversationsService) {}

  @Post()
  async createOrGet(
    @Body() body: { participantIds?: number[]; ownerId?: number; userId?: number; initialMessage?: string },
    @Req() req: any,
  ) {
    // Determine ownerId and userId. Prefer explicit ownerId/userId. If participantIds provided, infer owner as the other participant (not the current user).
    const meId = req?.user?.id ?? null;
    const rawIds = Array.isArray(body.participantIds) ? body.participantIds.map((v) => Number(v)) : [];
    if (meId && rawIds.length && !rawIds.includes(meId)) rawIds.push(meId);

    let ownerId = body.ownerId != null ? Number(body.ownerId) : undefined;
    let userId = body.userId != null ? Number(body.userId) : undefined;

    if (ownerId == null || userId == null) {
      // try to infer from participantIds and meId
      if (rawIds.length === 2 && meId) {
        const other = rawIds.find((id) => Number(id) !== Number(meId));
        ownerId = ownerId ?? Number(other || rawIds[0]);
        userId = userId ?? Number(meId);
      } else if (rawIds.length === 2) {
        // no meId (unlikely because guard used), just pick first as owner
        ownerId = ownerId ?? Number(rawIds[0]);
        userId = userId ?? Number(rawIds[1]);
      }
    }

    // debug logs removed

    if (!ownerId || !userId) {
      // Return a structured message instead of throwing so the FE receives a clear response
      return { message: 'ownerId và userId là bắt buộc' };
    }

    let conv: any = null;
    try {
      conv = await this.conv.findOrCreateConversation(Number(ownerId), Number(userId));
    } catch (e) {
      // Return a structured message so FE can display it instead of receiving a generic Internal server error
      return { message: `Lỗi khi tạo/tìm cuộc trò chuyện: ${String(e && (e.message || e) || 'Unknown error')}` };
    }

    const convForReturn: any = {
      id: conv?.id ?? null,
      ownerId: conv?.owner?.id ?? null,
      userId: conv?.user?.id ?? null,
      apartmentId: (conv as any)?.apartmentId ?? null,
      lastMessageText: (conv as any)?.lastMessageText ?? null,
      lastMessageAt: (conv as any)?.lastMessageAt ?? null,
      participants: [],
    };
    try {
      if (conv?.owner) convForReturn.participants.push({ id: conv.owner.id, name: conv.owner.name, avatarUrl: conv.owner.avatarUrl ?? null });
      if (conv?.user) convForReturn.participants.push({ id: conv.user.id, name: conv.user.name, avatarUrl: conv.user.avatarUrl ?? null });
    } catch {}

    // If caller provided an initial message, try to create it but do NOT fail the whole request if message sending errors.
    if (body.initialMessage && meId) {
      try {
        const msg = await this.conv.postMessage(Number(conv.id), meId, String(body.initialMessage || ''));
        return { conversation: convForReturn, message: msg };
      } catch (e) {
        // Log error for diagnostics but return conversation so client can open it.
        return { conversation: convForReturn, message: null, messageError: String((e && (e.message || e)) || 'Failed to send initial message') };
      }
    }

    return { conversation: convForReturn };
  }

  @Get('mine')
  async mine(@Req() req: any) {
    const meId = req?.user?.id;
    return this.conv.listConversationsForUser(meId);
  }

  @Get(':id/messages')
  async messages(@Param('id') id: string, @Req() req: any) {
    const meId = req?.user?.id;
    const messages = await this.conv.getMessages(Number(id), meId);
    return messages;
  }

  @Post(':id/messages')
  async postMessage(
    @Param('id') id: string,
    @Body() body: { text: string; attachments?: any[]; icon?: string },
    @Req() req: any,
  ) {
    const meId = req?.user?.id;
    if (!meId) {
      // If JwtAuthGuard didn't populate req.user for some reason, provide a clear message
      throw new Error('Thiếu thông tin người dùng. Vui lòng đăng nhập lại.');
    }

    try {
      return await this.conv.postMessage(Number(id), meId, String(body.text || ''), body.attachments || undefined, body.icon || undefined);
    } catch (e) {
      throw e;
    }
  }
}
