import { Injectable, NotFoundException, ForbiddenException, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { Message } from './entities/message.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly convRepo: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly msgRepo: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Inject(NotificationsGateway) private readonly gateway: NotificationsGateway,
  ) {}

  // (legacy helper removed) conversations now use explicit owner/user fields
  // Find or create a conversation between owner (chủ nhà) and user (khách)
  // ownerId: id of the host, userId: id of the customer
  async findOrCreateConversation(ownerId: number, userId: number) {
    if (!ownerId || !userId) throw new Error('ownerId và userId là bắt buộc');
    // Run find-or-create inside a transaction to reduce duplicates under concurrency
    return await this.convRepo.manager.transaction(async (manager) => {
      const convRepoTx = manager.getRepository(Conversation);
      const userRepoTx = manager.getRepository(User);

      // Try to find existing conversation by exact owner/user pair
      try {
        const found = await convRepoTx.findOne({ where: { owner: { id: ownerId }, user: { id: userId } }, relations: ['owner', 'user'] });
        if (found) return found;
      } catch (e) {
        // ignore and fallback
      }

      // Create new conversation
      const owner = await userRepoTx.findOne(ownerId as any);
      const user = await userRepoTx.findOne(userId as any);
      const conv = convRepoTx.create({ owner: owner as any, user: user as any });
      const saved = await convRepoTx.save(conv);
      return saved;
    });
  }

  async listConversationsForUser(userId: number) {
    // Return conversations where the user is either the owner or the customer
    if (!userId) return [];
    return this.convRepo.find({ where: [{ owner: { id: userId } }, { user: { id: userId } }], relations: ['owner', 'user'] });
  }

  async getMessages(conversationId: number, userId?: number) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId }, relations: ['owner', 'user'] });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (userId && Number(conv.owner?.id) !== Number(userId) && Number(conv.user?.id) !== Number(userId)) throw new ForbiddenException();
    const messages = await this.msgRepo.find({ where: { conversation: conv }, order: { createdAt: 'ASC' } });
    return messages;
  }

  async postMessage(conversationId: number, fromUserId: number, text: string, attachments?: any[] | undefined, icon?: string | undefined) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId }, relations: ['owner', 'user'] });
    if (!conv) throw new NotFoundException('Conversation not found');
    // Debug log: participants and sender (helps diagnose missing req.user or mismatch)
    try {
      // eslint-disable-next-line no-console
      console.log('[Conversations] postMessage - conv.owner/user ids:', { owner: Number(conv.owner?.id), user: Number(conv.user?.id), fromUserId: Number(fromUserId) });
    } catch {}
    if (Number(conv.owner?.id) !== Number(fromUserId) && Number(conv.user?.id) !== Number(fromUserId)) throw new ForbiddenException();
    const from = await this.userRepo.findOne(fromUserId as any);
    // determine recipient
    const toUser = Number(conv.owner?.id) === Number(fromUserId) ? conv.user : conv.owner;
  const msg = this.msgRepo.create({ conversation: conv, from: from as any, to: toUser as any, text, attachments: attachments && attachments.length ? attachments : null, icon: icon || null });
    let saved: any = null;
    try {
      saved = await this.msgRepo.save(msg);
    } catch (e) {
      try { console.error('[Conversations] Error saving message', e && (e.stack || e.message || e)); } catch {}
      throw new HttpException('Lỗi khi lưu tin nhắn. Vui lòng thử lại.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Update conversation summary fields so FE can display last message without loading messages
    try {
      conv.lastMessageText = String(saved.text || '').slice(0, 2000);
      conv.lastMessageAt = saved.createdAt || new Date();
      conv.lastMessageFrom = saved.from as any;
      try { await this.convRepo.save(conv); } catch (e) { /* don't fail message save if conv update fails */ }
    } catch (e) {
      try { console.warn('[Conversations] Failed to update conversation last message fields', e && (e.stack || e.message || e)); } catch {}
    }

    // Emit real-time event to conversation room and to participants
    try {
      if (this.gateway && typeof this.gateway.emitToRoom === 'function') {
        this.gateway.emitToRoom(`conversation:${conv.id}`, 'conversation:message:new', { message: saved, conversationId: conv.id });
      }

      const participants = [conv.owner, conv.user].filter(Boolean);
      for (const p of participants) {
        try {
          if (this.gateway && typeof this.gateway.emitToRoom === 'function') {
            this.gateway.emitToRoom(`user:${p.id}`, 'conversation:message:new', { message: saved, conversationId: conv.id });
          }
        } catch (emitErr) {
          try { console.warn('[Conversations] Emit to user room failed', emitErr && (emitErr.stack || emitErr.message || emitErr)); } catch {}
        }
      }
    } catch (e) {
      try { console.warn('[Conversations] Emit to rooms failed', e && (e.stack || e.message || e)); } catch {}
    }

    return saved;
  }
}
