// Strict view of the backend chat/notification contract. The orval-generated
// models mark every field optional; the Kotlin DTOs guarantee these fields.
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt?: string | null;
}

export interface ChatPartner {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  online: boolean;
}

export interface Conversation {
  id: string;
  partner: ChatPartner;
  lastMessage: ChatMessage | null;
  unreadCount: number;
  createdDate: string;
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  referenceId: string;
  readAt?: string | null;
  createdDate: string;
}

export const partnerDisplayName = (p: { firstName?: string | null; lastName?: string | null }): string =>
  `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || 'Unbekannt';
