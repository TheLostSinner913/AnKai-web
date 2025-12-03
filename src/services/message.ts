import { get, post, put, del, ApiResponse, PageResult, PageParams } from '@/utils/request';

export interface Message {
  id: number;
  senderId: number;
  senderName: string;
  receiverId: number;
  receiverName: string;
  content: string;
  messageType: number; // 1-系统通知 2-私信 3-公告
  isRead: number; // 0-未读 1-已读
  readTime?: string;
  createTime: string;
}

export interface ChatSession {
  userId: number;
  username: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
}

export interface SendMessageRequest {
  receiverId: number;
  content: string;
}

/**
 * 发送消息
 */
export async function sendMessage(data: SendMessageRequest): Promise<ApiResponse<boolean>> {
  return post('/message/send', data);
}

/**
 * 获取聊天会话列表
 */
export async function getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
  return get('/message/sessions');
}

/**
 * 获取与指定用户的聊天记录
 */
export async function getChatHistory(otherUserId: number, params: PageParams): Promise<ApiResponse<PageResult<Message>>> {
  return post(`/message/chat/${otherUserId}`, params);
}

/**
 * 标记与某用户的聊天为已读
 */
export async function markChatAsRead(otherUserId: number): Promise<ApiResponse<boolean>> {
  return put(`/message/chat/${otherUserId}/read`);
}

/**
 * 获取收到的消息列表
 */
export async function getReceivedMessages(params: PageParams): Promise<ApiResponse<PageResult<Message>>> {
  return post('/message/received', params);
}

/**
 * 获取发送的消息列表
 */
export async function getSentMessages(params: PageParams): Promise<ApiResponse<PageResult<Message>>> {
  return post('/message/sent', params);
}

/**
 * 标记消息为已读
 */
export async function markAsRead(id: number): Promise<ApiResponse<boolean>> {
  return put(`/message/${id}/read`);
}

/**
 * 批量标记为已读
 */
export async function batchMarkAsRead(ids: number[]): Promise<ApiResponse<boolean>> {
  return put('/message/batch-read', ids);
}

/**
 * 标记所有消息为已读
 */
export async function markAllAsRead(): Promise<ApiResponse<boolean>> {
  return put('/message/read-all');
}

/**
 * 获取未读消息数量
 */
export async function getUnreadCount(): Promise<ApiResponse<number>> {
  return get('/message/unread-count');
}

/**
 * 删除消息
 */
export async function deleteMessage(id: number): Promise<ApiResponse<boolean>> {
  return del(`/message/${id}`);
}

