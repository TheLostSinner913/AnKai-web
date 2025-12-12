import React, { useState, useEffect, useRef } from 'react';
import { Avatar, Badge, Input, Button, Empty, Spin, message, Typography } from 'antd';
import { UserOutlined, SendOutlined, MessageOutlined, CheckOutlined } from '@ant-design/icons';
import {
  getChatSessions,
  getChatHistory,
  sendMessage,
  markChatAsRead,
  markAllAsRead,
  getUnreadCount,
  type ChatSession,
  type Message,
} from '@/services/message';
import { wsClient, type WebSocketEventData } from '@/utils/websocket';
import { useModel } from '@umijs/max';
import dayjs from 'dayjs';

const { Text } = Typography;

const MessagesPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载会话列表
  const loadSessions = async () => {
    setLoadingSessions(true);
    try {
      const response = await getChatSessions();
      if (response.code === 200) {
        setSessions(response.data || []);
      }
    } catch (error) {
      console.error('加载会话列表失败:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // 加载聊天记录
  const loadChatHistory = async (session: ChatSession) => {
    setLoadingMessages(true);
    try {
      const response = await getChatHistory(session.userId, { current: 1, size: 100 });
      if (response.code === 200) {
        const sortedMessages = (response.data.records || []).sort(
          (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
        );
        setMessages(sortedMessages);
        // 标记已读（后端会通过 SSE 推送最新未读数）
        await markChatAsRead(session.userId);
        // 本地更新会话列表的未读数
        setSessions(prev => prev.map(s =>
          s.userId === session.userId ? { ...s, unreadCount: 0 } : s
        ));
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSelectSession = (session: ChatSession) => {
    setSelectedSession(session);
    loadChatHistory(session);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || !selectedSession) return;
    setSending(true);
    try {
      const response = await sendMessage({ receiverId: selectedSession.userId, content: inputValue.trim() });
      if (response.code === 200) {
        const newMessage: Message = {
          id: Date.now(), senderId: currentUser?.id, senderName: currentUser?.realName || currentUser?.username,
          receiverId: selectedSession.userId, receiverName: selectedSession.username,
          content: inputValue.trim(), messageType: 2, isRead: 0, createTime: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
        setInputValue('');
        loadSessions();
      } else {
        message.error(response.message || '发送失败');
      }
    } catch (error) {
      message.error('发送失败');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const formatTime = (time: string) => {
    const date = dayjs(time);
    const today = dayjs();
    if (date.isSame(today, 'day')) return date.format('HH:mm');
    if (date.isSame(today.subtract(1, 'day'), 'day')) return '昨天 ' + date.format('HH:mm');
    if (date.isSame(today, 'year')) return date.format('M月D日 HH:mm');
    return date.format('YYYY年M月D日 HH:mm');
  };

  const totalUnread = sessions.reduce((sum, s) => sum + s.unreadCount, 0);

  // 直接从 wsClient 监听 WebSocket 事件，实现新消息到达时的自动刷新
  useEffect(() => {
    const handler = (data: WebSocketEventData) => {
      console.log('[Messages] 收到 WebSocket 事件:', data);

      if (!data) return;

      // 处理未读数更新事件（标记已读后触发）
      if (data.type === 'unread_update') {
        // 刷新会话列表以同步未读数
        loadSessions();
        return;
      }

      // 处理新消息事件
      if (data.type === 'new_message') {
        const msgData: any = data.data || {};
        const senderId: number | undefined = msgData.senderId;

        // 总是刷新会话列表
        loadSessions();

        if (!senderId || !currentUser) {
          return;
        }

        // 站内信 SSE 仅推送给接收方，因此会话对端即为发送方
        const otherUserId = senderId;

        // 如果当前打开的会话就是该对端，则把消息追加到当前聊天记录
        if (selectedSession && selectedSession.userId === otherUserId) {
          const newMsg: Message = {
            id: msgData.messageId ?? Date.now(),
            senderId,
            senderName: msgData.senderName,
            receiverId: currentUser.id,
            receiverName: currentUser.realName || currentUser.username,
            content: msgData.content,
            messageType: 2,
            isRead: 0,
            createTime: new Date().toISOString(),
          };

          setMessages(prev => [...prev, newMsg]);

          // 当前会话收到新消息，自动标记为已读
          markChatAsRead(otherUserId);
        }
      }
    };

    // 直接从 wsClient 订阅事件
    wsClient.on('new_message', handler);
    wsClient.on('unread_update', handler);
    return () => {
      wsClient.off('new_message', handler);
      wsClient.off('unread_update', handler);
    };
  }, [currentUser, selectedSession]);

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 48px)', background: '#f0f2f5' }}>
      {/* 左侧会话列表 */}
      <div style={{ width: 320, background: '#fff', borderRight: '1px solid #e8e8e8', display: 'flex', flexDirection: 'column' }}>
        {/* 头部 */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <Text strong style={{ fontSize: 18 }}>消息</Text>
            {totalUnread > 0 && (
              <Button type="link" size="small" icon={<CheckOutlined />} onClick={async () => {
                await markAllAsRead(); loadSessions(); message.success('已全部标记为已读');
              }}>全部已读</Button>
            )}
          </div>
          {totalUnread > 0 && <Text type="secondary" style={{ fontSize: 13 }}>{totalUnread} 条未读消息</Text>}
        </div>

        {/* 会话列表 */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingSessions ? (
            <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
          ) : sessions.length === 0 ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无消息" style={{ marginTop: 100 }} />
          ) : (
            sessions.map(session => (
              <div
                key={session.userId}
                onClick={() => handleSelectSession(session)}
                style={{
                  padding: '14px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12,
                  background: selectedSession?.userId === session.userId ? '#e6f4ff' : 'transparent',
                  borderLeft: selectedSession?.userId === session.userId ? '3px solid #1677ff' : '3px solid transparent',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={e => { if (selectedSession?.userId !== session.userId) e.currentTarget.style.background = '#fafafa'; }}
                onMouseLeave={e => { if (selectedSession?.userId !== session.userId) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ position: 'relative' }}>
                  <Avatar size={48} src={session.avatar} icon={<UserOutlined />} />
                  <span style={{
                    position: 'absolute', bottom: 2, right: 2, width: 10, height: 10, borderRadius: '50%',
                    background: session.online ? '#52c41a' : '#d9d9d9', border: '2px solid #fff',
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <Text strong ellipsis style={{ maxWidth: 140 }}>{session.username}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>{formatTime(session.lastMessageTime)}</Text>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text type="secondary" ellipsis style={{ fontSize: 13, maxWidth: session.unreadCount > 0 ? 160 : 200 }}>
                      {session.lastMessage || '暂无消息'}
                    </Text>
                    {session.unreadCount > 0 && (
                      <Badge count={session.unreadCount} style={{ backgroundColor: '#1677ff' }} />
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧聊天区域 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
        {!selectedSession ? (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#bfbfbf' }}>
            <MessageOutlined style={{ fontSize: 80, marginBottom: 16 }} />
            <Text type="secondary" style={{ fontSize: 16 }}>选择一个会话开始聊天</Text>
          </div>
        ) : (
          <>
            {/* 聊天头部 */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ position: 'relative' }}>
                <Avatar size={40} src={selectedSession.avatar} icon={<UserOutlined />} />
                <span style={{
                  position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%',
                  background: selectedSession.online ? '#52c41a' : '#d9d9d9', border: '2px solid #fff',
                }} />
              </div>
              <div>
                <Text strong style={{ fontSize: 15, display: 'block' }}>{selectedSession.username}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{selectedSession.online ? '在线' : '离线'}</Text>
              </div>
            </div>

            {/* 消息列表 */}
            <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto', background: '#f5f7fa' }}>
              {loadingMessages ? (
                <div style={{ textAlign: 'center', padding: 60 }}><Spin /></div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: 'center', marginTop: 80 }}>
                  <Text type="secondary">暂无消息，发送第一条消息开始聊天吧</Text>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMe = msg.senderId === currentUser?.id;
                  const showTime = index === 0 || dayjs(msg.createTime).diff(dayjs(messages[index - 1].createTime), 'minute') > 5;
                  return (
                    <React.Fragment key={msg.id}>
                      {showTime && (
                        <div style={{ textAlign: 'center', margin: '16px 0' }}>
                          <Text type="secondary" style={{ fontSize: 12, background: 'rgba(0,0,0,0.05)', padding: '4px 12px', borderRadius: 12 }}>
                            {formatTime(msg.createTime)}
                          </Text>
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', marginBottom: 12, alignItems: 'flex-end' }}>
                        <Avatar size={36} src={isMe ? currentUser?.avatar : selectedSession.avatar} icon={<UserOutlined />} style={{ flexShrink: 0 }} />
                        <div style={{
                          maxWidth: '65%', margin: isMe ? '0 10px 0 0' : '0 0 0 10px',
                          background: isMe ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#fff',
                          color: isMe ? '#fff' : '#333', padding: '10px 14px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                          wordBreak: 'break-word', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', lineHeight: 1.5,
                        }}>
                          {msg.content}
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入区域 */}
            <div style={{ padding: '12px 20px 16px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <Input.TextArea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入消息，按 Enter 发送..."
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  style={{ flex: 1, borderRadius: 20, padding: '8px 16px', resize: 'none' }}
                />
                <Button
                  type="primary" shape="circle" size="large" icon={<SendOutlined />}
                  loading={sending} onClick={handleSend} disabled={!inputValue.trim()}
                  style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', border: 'none' }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;

