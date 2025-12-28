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
  const owner = await userRepoTx.findOneBy({ id: ownerId as any });
  const user = await userRepoTx.findOneBy({ id: userId as any });
      const conv = convRepoTx.create({ owner: owner as any, user: user as any });
      const saved = await convRepoTx.save(conv);
      // reload with relations to ensure owner/user are present on returned object
      try {
        const reloaded = await convRepoTx.findOne({ where: { id: saved.id }, relations: ['owner', 'user'] });
        if (reloaded) return reloaded;
      } catch (e) {
        // ignore
      }
      return saved;
    });
  }

  async listConversationsForUser(userId: number) {
    // Return conversations where the user is either the owner or the customer
    if (!userId) return [];
    const convs = await this.convRepo.find({ where: [{ owner: { id: userId } }, { user: { id: userId } }], relations: ['owner', 'user'] });
    // sanitize output to avoid leaking sensitive user fields (passwordHash, tokens, etc.)
    return convs.map((c) => {
      const participants: any[] = [];
      try {
        if (c.owner) participants.push({ id: c.owner.id, name: c.owner.name, avatarUrl: c.owner.avatarUrl ?? null });
        if (c.user) participants.push({ id: c.user.id, name: c.user.name, avatarUrl: c.user.avatarUrl ?? null });
      } catch (e) {}
      return {
        id: c.id,
        createdAt: c.createdAt,
        lastMessageText: (c as any).lastMessageText ?? null,
        lastMessageAt: (c as any).lastMessageAt ?? null,
        apartmentId: (c as any).apartmentId ?? null,
        participants,
      } as any;
    });
  }

  async getMessages(conversationId: number, userId?: number) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId }, relations: ['owner', 'user'] });
    if (!conv) throw new NotFoundException('Conversation not found');
    if (userId && Number(conv.owner?.id) !== Number(userId) && Number(conv.user?.id) !== Number(userId)) throw new ForbiddenException();
    // Use QueryBuilder to ensure from/to are selected and only safe user fields are returned
    const qb = this.msgRepo.createQueryBuilder('message')
      .leftJoin('message.from', 'from')
      .leftJoin('message.to', 'to')
      .where('message.conversation = :convId', { convId: conversationId })
      .orderBy('message.createdAt', 'ASC')
      .select([
        'message.id', 'message.text', 'message.attachments', 'message.icon', 'message.createdAt',
        'from.id', 'from.name', 'from.avatarUrl', 'from.email',
        'to.id', 'to.name', 'to.avatarUrl', 'to.email',
      ]);

    const rows = await qb.getRawMany();

    // Transform raw rows into nested shape { id, text, attachments, icon, createdAt, from: {...}, to: {...} }
    const messages = rows.map((r: any) => {
      // TypeORM raw names will be like message_id, message_text, from_id, from_name, etc.
      const created = r['message_createdAt'] ?? r['message_created_at'] ?? r['message_createdAt'] ?? r['message_createdat'] ?? r['message_created_at'];
      let attachments: any = null;
      try {
        const rawAtt = r['message_attachments'] ?? r['message_attachments'] ?? null;
        if (rawAtt) {
          if (typeof rawAtt === 'string') {
            try { attachments = JSON.parse(rawAtt); } catch { attachments = rawAtt; }
          } else {
            attachments = rawAtt;
          }
        }
      } catch { attachments = null; }

      const msg: any = {
        id: r['message_id'] ?? r['message_id'] ?? r['message_id'],
        text: r['message_text'] ?? r['message_text'] ?? r['message_text'],
        attachments,
        icon: r['message_icon'] ?? null,
        createdAt: created,
        from: r['from_id'] ? { id: r['from_id'], name: r['from_name'], avatarUrl: r['from_avatarUrl'] ?? r['from_avatar_url'] ?? null, email: r['from_email'] } : null,
        to: r['to_id'] ? { id: r['to_id'], name: r['to_name'], avatarUrl: r['to_avatarUrl'] ?? r['to_avatar_url'] ?? null, email: r['to_email'] } : null,
      };
      return msg;
    });

    return messages;
  }

  async postMessage(conversationId: number, fromUserId: number, text: string, attachments?: any[] | undefined, icon?: string | undefined) {
    const conv = await this.convRepo.findOne({ where: { id: conversationId }, relations: ['owner', 'user'] });
    if (!conv) throw new NotFoundException('Conversation not found');
    // Debug log: participants and sender (helps diagnose missing req.user or mismatch)
    // debug logs removed
    if (Number(conv.owner?.id) !== Number(fromUserId) && Number(conv.user?.id) !== Number(fromUserId)) throw new ForbiddenException();
  const from = await this.userRepo.findOneBy({ id: fromUserId as any });
    // determine recipient
    const toUser = Number(conv.owner?.id) === Number(fromUserId) ? conv.user : conv.owner;
  const msg = this.msgRepo.create({ conversation: conv, from: from as any, to: toUser as any, text, attachments: attachments && attachments.length ? attachments : null, icon: icon || null });
    let saved: any = null;
    try {
      saved = await this.msgRepo.save(msg);
    } catch (e) {
      throw new HttpException('Lỗi khi lưu tin nhắn. Vui lòng thử lại.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    // Update conversation summary fields so FE can display last message without loading messages
    try {
      conv.lastMessageText = String(saved.text || '').slice(0, 2000);
      conv.lastMessageAt = saved.createdAt || new Date();
      conv.lastMessageFrom = saved.from as any;
      try { await this.convRepo.save(conv); } catch (e) { /* don't fail message save if conv update fails */ }
    } catch (e) {
      // ignore failures updating conversation summary
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
          // ignore emit errors
        }
      }
    } catch (e) {
      // ignore emit errors
    }

    return saved;
  }
}
