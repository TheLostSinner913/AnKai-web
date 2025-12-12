import React, { useState, useEffect, useRef } from 'react';
import { Drawer, Input, Button, message, Avatar, Space, Spin, Badge, Empty } from 'antd';
import { SendOutlined, UserOutlined } from '@ant-design/icons';
import { sendMessage, getChatHistory, markChatAsRead, type Message } from '@/services/message';
import { wsClient, type WebSocketEventData } from '@/utils/websocket';
import { useModel } from '@umijs/max';
import dayjs from 'dayjs';

interface SendMessageModalProps {
  visible: boolean;
  receiverId?: number;
  receiverName?: string;
  receiverAvatar?: string;
  online?: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

const SendMessageModal: React.FC<SendMessageModalProps> = ({
  visible,
  receiverId,
  receiverName,
  receiverAvatar,
  online,
  onCancel,
  onSuccess,
}) => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载聊天记录
  const loadChatHistory = async () => {
    if (!receiverId) return;
    setLoadingHistory(true);
    try {
      const response = await getChatHistory(receiverId, { current: 1, size: 50 });
      if (response.code === 200) {
        // 按时间正序排列
        const sortedMessages = (response.data.records || []).sort(
          (a, b) => new Date(a.createTime).getTime() - new Date(b.createTime).getTime()
        );
        setMessages(sortedMessages);
        // 标记为已读
        await markChatAsRead(receiverId);
      }
    } catch (error) {
      console.error('加载聊天记录失败:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (visible && receiverId) {
      loadChatHistory();
    }
    if (!visible) {
      setMessages([]);
      setInputValue('');
    }
  }, [visible, receiverId]);

  // 直接从 wsClient 监听 WebSocket 事件，实现新消息到达时的自动刷新
  useEffect(() => {
    if (!visible || !receiverId) return;

    const handler = (data: WebSocketEventData) => {
      console.log('[SendMessageModal] 收到 WebSocket 事件:', data);

      if (!data || data.type !== 'new_message') return;

      const msgData: any = data.data || {};
      const senderId: number | undefined = msgData.senderId;

      // 只处理来自当前聊天对象的消息
      if (senderId !== receiverId || !currentUser) return;

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

      // 自动标记为已读
      markChatAsRead(receiverId);
    };

    wsClient.on('new_message', handler);
    return () => {
      wsClient.off('new_message', handler);
    };
  }, [visible, receiverId, currentUser]);

  // 滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || !receiverId) return;

    setLoading(true);
    try {
      const response = await sendMessage({
        receiverId: receiverId,
        content: inputValue.trim(),
      });

      if (response.code === 200) {
        setInputValue('');
        // 添加到本地消息列表
        const newMessage: Message = {
          id: Date.now(),
          senderId: currentUser?.id,
          senderName: currentUser?.realName || currentUser?.username,
          receiverId: receiverId,
          receiverName: receiverName || '',
          content: inputValue.trim(),
          messageType: 2,
          isRead: 0,
          createTime: new Date().toISOString(),
        };
        setMessages(prev => [...prev, newMessage]);
        onSuccess();
      } else {
        message.error(response.message || '发送失败');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      message.error('发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (time: string) => {
    const date = dayjs(time);
    const today = dayjs();
    if (date.isSame(today, 'day')) {
      return date.format('HH:mm');
    }
    return date.format('MM-DD HH:mm');
  };

  return (
    <Drawer
      title={
        <Space>
          <Badge dot status={online ? 'success' : 'default'}>
            <Avatar src={receiverAvatar} icon={<UserOutlined />} />
          </Badge>
          <span>{receiverName || '用户'}</span>
          <span style={{ fontSize: 12, color: online ? '#52c41a' : '#999' }}>
            {online ? '在线' : '离线'}
          </span>
        </Space>
      }
      placement="right"
      width={450}
      open={visible}
      onClose={onCancel}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
    >
      {/* 消息列表区域 */}
      <div style={{
        flex: 1,
        padding: 16,
        overflowY: 'auto',
        background: '#f5f5f5',
        minHeight: 400
      }}>
        {loadingHistory ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip="加载中..." />
          </div>
        ) : messages.length === 0 ? (
          <Empty description="暂无消息，发送第一条消息吧" style={{ marginTop: 80 }} />
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: isMe ? 'row-reverse' : 'row',
                  marginBottom: 16,
                  alignItems: 'flex-start',
                }}
              >
                <Avatar
                  size={36}
                  src={isMe ? currentUser?.avatar : receiverAvatar}
                  icon={<UserOutlined />}
                  style={{ flexShrink: 0 }}
                />
                <div
                  style={{
                    maxWidth: '70%',
                    margin: isMe ? '0 8px 0 0' : '0 0 0 8px',
                  }}
                >
                  <div
                    style={{
                      background: isMe ? '#1890ff' : '#fff',
                      color: isMe ? '#fff' : '#333',
                      padding: '8px 12px',
                      borderRadius: 8,
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    }}
                  >
                    {msg.content}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#999',
                      marginTop: 4,
                      textAlign: isMe ? 'right' : 'left',
                    }}
                  >
                    {formatTime(msg.createTime)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入区域 */}
      <div style={{
        padding: 12,
        borderTop: '1px solid #e8e8e8',
        background: '#fff',
      }}>
        <Space.Compact style={{ width: '100%' }}>
          <Input.TextArea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息，按Enter发送..."
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ resize: 'none' }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            loading={loading}
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            发送
          </Button>
        </Space.Compact>
      </div>
    </Drawer>
  );
};

export default SendMessageModal;

