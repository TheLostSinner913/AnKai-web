/**
 * SSE (Server-Sent Events) 服务
 * 用于接收服务端推送的实时消息
 */

// SSE事件类型
export type SseEventType = 'message' | 'announcement' | 'todo' | 'connected';

// SSE事件数据
export interface SseEventData {
  type: string;
  unreadCount?: number;           // 未读站内信数
  unreadAnnouncementCount?: number; // 未读公告数
  pendingTodoCount?: number;       // 待办事项数
  message?: string;
  data?: any;
}

// 事件监听器类型
type EventListener = (data: SseEventData) => void;

class SseClient {
  private eventSource: EventSource | null = null;
  private listeners: Map<SseEventType, Set<EventListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3秒后重连
  private isConnecting = false;

  /**
   * 连接SSE服务
   */
  connect(): void {
    if (this.eventSource || this.isConnecting) {
      console.log('[SSE] 已连接或正在连接中');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[SSE] 未登录，不建立连接');
      return;
    }

    this.isConnecting = true;
    console.log('[SSE] 正在建立连接...');

    // 创建EventSource连接
    // 注意：EventSource不支持自定义header，需要通过URL参数传token或使用fetch polyfill
    // 这里我们使用fetch来创建SSE连接
    this.connectWithFetch(token);
  }

  private async connectWithFetch(token: string): Promise<void> {
    try {
      const response = await fetch('/api/sse/subscribe', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`SSE连接失败: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('无法获取响应流');
      }

      this.isConnecting = false;
      this.reconnectAttempts = 0;
      console.log('[SSE] 连接成功');

      // 读取SSE数据流
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[SSE] 连接关闭');
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        let eventType = 'message';
        for (const line of lines) {
          if (line.startsWith('event:')) {
            eventType = line.substring(6).trim();
          } else if (line.startsWith('data:')) {
            const data = line.substring(5).trim();
            this.handleEvent(eventType as SseEventType, data);
          }
        }
      }

      // 连接关闭后尝试重连
      this.scheduleReconnect();
    } catch (error) {
      console.error('[SSE] 连接错误:', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleEvent(eventType: SseEventType, data: string): void {
    try {
      const parsedData: SseEventData = JSON.parse(data);
      console.log(`[SSE] 收到事件: ${eventType}`, parsedData);

      // 通知所有监听器
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.forEach(listener => listener(parsedData));
      }

      // 通用消息处理（所有类型都会触发）
      const allListeners = this.listeners.get('message');
      if (allListeners && eventType !== 'message') {
        allListeners.forEach(listener => listener(parsedData));
      }
    } catch (e) {
      console.error('[SSE] 解析事件数据失败:', e);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[SSE] 达到最大重连次数，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    console.log(`[SSE] ${delay / 1000}秒后尝试第${this.reconnectAttempts}次重连...`);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 断开SSE连接
   */
  disconnect(): void {
    this.eventSource = null;
    this.isConnecting = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // 阻止自动重连
    console.log('[SSE] 已断开连接');
  }

  /**
   * 添加事件监听器
   */
  on(eventType: SseEventType, listener: EventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  off(eventType: SseEventType, listener: EventListener): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.eventSource !== null || this.isConnecting;
  }
}

// 导出单例
export const sseClient = new SseClient();

