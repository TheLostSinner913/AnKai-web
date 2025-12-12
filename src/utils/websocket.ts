/**
 * WebSocket 服务
 * 用于接收服务端推送的实时消息
 */

// WebSocket 事件数据
export interface WebSocketEventData {
  type: string;
  unreadCount?: number;           // 未读站内信数
  unreadAnnouncementCount?: number; // 未读公告数
  pendingTodoCount?: number;       // 待办事项数
  message?: string;
  data?: any;
}

// 事件监听器类型
type EventListener = (data: WebSocketEventData) => void;

class WebSocketClient {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 2000; // 2秒后重连
  private isConnecting = false;
  private connected = false;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * 连接 WebSocket 服务
   */
  connect(): void {
    if (this.connected || this.isConnecting) {
      console.log('[WebSocket] 已连接或正在连接中');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[WebSocket] 未登录，不建立连接');
      return;
    }

    this.isConnecting = true;
    console.log('[WebSocket] 正在建立连接...');

    // 构建 WebSocket URL
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const url = `${protocol}//${host}/api/ws/chat?token=${encodeURIComponent(token)}`;

    try {
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('[WebSocket] 连接成功');
        this.isConnecting = false;
        this.connected = true;
        this.reconnectAttempts = 0;
        this.startHeartbeat();
      };

      this.ws.onclose = (event) => {
        console.log('[WebSocket] 连接关闭:', event.code, event.reason);
        this.connected = false;
        this.isConnecting = false;
        this.stopHeartbeat();
        this.scheduleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocket] 连接错误:', error);
        this.connected = false;
        this.isConnecting = false;
      };

      this.ws.onmessage = (event) => {
        this.handleMessage(event.data);
      };
    } catch (error) {
      console.error('[WebSocket] 创建连接失败:', error);
      this.isConnecting = false;
      this.connected = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: string): void {
    try {
      const parsedData: WebSocketEventData = JSON.parse(data);
      console.log('[WebSocket] 收到消息:', parsedData);

      // 心跳响应
      if (parsedData.type === 'pong') {
        return;
      }

      // 通知所有监听器
      const eventType = parsedData.type || 'message';
      
      // 触发特定类型的监听器
      const typeListeners = this.listeners.get(eventType);
      if (typeListeners) {
        typeListeners.forEach(listener => listener(parsedData));
      }

      // 触发通用 message 监听器
      const messageListeners = this.listeners.get('message');
      if (messageListeners && eventType !== 'message') {
        messageListeners.forEach(listener => listener(parsedData));
      }
    } catch (e) {
      console.error('[WebSocket] 解析消息失败:', e, 'data:', data);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // 每 30 秒发送一次心跳
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send('ping');
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocket] 达到最大重连次数，停止重连');
      return;
    }

    // 检查是否还有 token（用户可能已登出）
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[WebSocket] 用户已登出，停止重连');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(this.reconnectDelay * this.reconnectAttempts, 30000); // 最大30秒
    console.log(`[WebSocket] ${delay / 1000}秒后尝试第${this.reconnectAttempts}次重连...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * 断开 WebSocket 连接
   */
  disconnect(): void {
    // 取消重连定时器
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
    this.isConnecting = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // 阻止自动重连
    console.log('[WebSocket] 已断开连接');
  }

  /**
   * 添加事件监听器
   */
  on(eventType: string, listener: EventListener): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
  }

  /**
   * 移除事件监听器
   */
  off(eventType: string, listener: EventListener): void {
    const eventListeners = this.listeners.get(eventType);
    if (eventListeners) {
      eventListeners.delete(listener);
    }
  }

  /**
   * 检查是否已连接
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * 重置重连计数（用于手动触发重连）
   */
  resetReconnect(): void {
    this.reconnectAttempts = 0;
  }

  /**
   * 发送消息
   */
  send(data: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(typeof data === 'string' ? data : JSON.stringify(data));
    } else {
      console.warn('[WebSocket] 连接未建立，无法发送消息');
    }
  }
}

// 导出单例
export const wsClient = new WebSocketClient();
