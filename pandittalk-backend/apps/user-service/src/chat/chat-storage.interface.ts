import type { ChatMessage, SenderRole } from './types/chat.types';

export const CHAT_STORAGE = Symbol('CHAT_STORAGE');

export interface ChatStorage {
  onModuleInit(): Promise<void>;
  onModuleDestroy(): Promise<void>;
  ping(): Promise<void>;
  saveMessage(
    sessionId: string,
    senderId: string,
    senderRole: SenderRole,
    message: string,
    timestamp: number,
  ): Promise<void>;
  getMessageWindow(
    sessionId: string,
    options?: { beforeTimestamp?: number; limit?: number },
  ): Promise<{ messages: ChatMessage[]; hasMore: boolean }>;
  getMessages(sessionId: string, limit?: number): Promise<ChatMessage[]>;
}
