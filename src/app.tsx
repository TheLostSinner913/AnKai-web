import { RunTimeLayoutConfig } from '@umijs/max';
import { getCurrentUser } from '@/services/user';
import { getUnreadCount } from '@/services/message';
import { history } from '@umijs/max';
import { proLayoutSettings, colors } from '@/styles/theme';
import { Avatar, Dropdown, message, Badge, Tooltip, notification } from 'antd';
import { UserOutlined, LogoutOutlined, MailOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';
import { wsClient, WebSocketEventData } from '@/utils/websocket';

// 全局未读消息数量
let globalUnreadCount = 0;
let globalSetUnreadCount: ((count: number) => void) | null = null;

// 浏览器标题闪烁相关
let originalTitle = typeof document !== 'undefined' ? document.title : 'AnKai 管理系统';
let titleBlinkTimer: number | null = null;

const startTitleBlink = (text: string) => {
  if (typeof document === 'undefined') return;
  // 仅在页面不在前台时闪烁
  if (!document.hidden) return;
  if (titleBlinkTimer) return;
  let flag = false;
  titleBlinkTimer = window.setInterval(() => {
    document.title = flag ? text : originalTitle;
    flag = !flag;
  }, 1000);
};

const stopTitleBlink = () => {
  if (typeof document === 'undefined') return;
  if (titleBlinkTimer) {
    clearInterval(titleBlinkTimer);
    titleBlinkTimer = null;
  }
  document.title = originalTitle;
};

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      stopTitleBlink();
    }
  });
}

// 浏览器桌面通知
const showBrowserNotification = (title: string, body: string, onClick?: () => void) => {
  if (typeof window === 'undefined' || !("Notification" in window)) return;

  const trigger = () => {
    if (Notification.permission !== 'granted') return;
    const n = new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
    n.onclick = () => {
      window.focus();
      onClick && onClick();
      n.close();
    };
  };

  if (Notification.permission === 'granted') {
    trigger();
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        trigger();
      }
    });
  }
};

// 简单声音提示（使用浏览器 Audio，对不支持或加载失败自动忽略）
const playNotifySound = () => {
  if (typeof window === 'undefined') return;
  try {
    const audio = new Audio('/notify.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {
      // 用户未交互前可能无法自动播放，忽略错误
    });
  } catch (e) {
    // 忽略声音播放失败
  }
};

// 刷新未读消息数量的函数（作为SSE连接前的初始化和备用）
const refreshUnreadCount = async () => {
  try {
    const response = await getUnreadCount();
    if (response.code === 200) {
      globalUnreadCount = response.data || 0;
      if (globalSetUnreadCount) {
        globalSetUnreadCount(globalUnreadCount);
      }
    }
  } catch (error) {
    console.error('获取未读消息数量失败:', error);
  }
};

// WebSocket 消息处理
const handleWsMessage = (data: WebSocketEventData) => {
  console.log('[WebSocket] 收到推送:', data);
  console.log('[WebSocket] 消息类型:', data.type);

  // 更新未读消息数（站内信）
  if (data.unreadCount !== undefined && globalSetUnreadCount) {
    globalUnreadCount = data.unreadCount;
    globalSetUnreadCount(data.unreadCount);
  }


  const msgData = data.data as any;

  // 根据事件类型显示不同通知
  switch (data.type) {
    case 'new_message':
      // 新站内信通知
      playNotifySound();
      startTitleBlink('【新消息】');
      showBrowserNotification('新消息', `${msgData?.senderName || '某人'}: ${msgData?.content || data.message}`, () => {
        history.push('/messages');
      });
      notification.info({
        message: '新消息',
        description: `${msgData?.senderName || '某人'}: ${msgData?.content || data.message}`,
        placement: 'topRight',
        duration: 4,
        onClick: () => {
          history.push('/messages');
          notification.destroy();
        },
      });
      break;

    case 'new_announcement':
      // 新公告通知
      const announcementTypeText = msgData?.announcementType === 3 ? '【紧急】' :
        msgData?.announcementType === 2 ? '【重要】' : '';
      playNotifySound();
      startTitleBlink(`${announcementTypeText || ''}新公告` || '【新公告】');
      showBrowserNotification(`${announcementTypeText}新公告`, msgData?.title || data.message, () => {
        history.push('/');
      });
      notification.warning({
        message: `${announcementTypeText}新公告`,
        description: msgData?.title || data.message,
        placement: 'topRight',
        duration: 6,
        onClick: () => {
          history.push('/');
          notification.destroy();
        },
      });
      break;

    case 'new_todo':
      // 新待办事项通知
      const priorityText = msgData?.priority === 3 ? '【高优先级】' :
        msgData?.priority === 1 ? '【低优先级】' : '';
      playNotifySound();
      startTitleBlink(`${priorityText || ''}新待办` || '【新待办】');
      showBrowserNotification(`${priorityText}新待办`, msgData?.title || data.message, () => {
        history.push('/');
      });
      notification.info({
        message: `${priorityText}新待办`,
        description: msgData?.title || data.message,
        placement: 'topRight',
        duration: 5,
        onClick: () => {
          history.push('/');
          notification.destroy();
        },
      });
      break;

    case 'new_workflow_task':
      // 新工作流任务通知
      playNotifySound();
      startTitleBlink('【新审批】');
      showBrowserNotification('新审批任务', data.message || '您有一个新的审批任务', () => {
        history.push('/workflow/task');
      });
      notification.info({
        message: '新审批任务',
        description: data.message || '您有一个新的审批任务',
        placement: 'topRight',
        duration: 5,
        onClick: () => {
          history.push('/workflow/task');
          notification.destroy();
        },
      });
      // 触发全局事件，让页面刷新列表
      window.dispatchEvent(new CustomEvent('workflow_task_update'));
      break;

    case 'workflow_status_update':
      // 工作流状态更新通知（审批通过/拒绝/撤回等）
      console.log('[app.tsx] 处理 workflow_status_update 事件，准备分发到页面');
      playNotifySound();
      const action = msgData?.action;
      const notificationType = action === 'approved' ? 'success' : action === 'rejected' ? 'error' : 'info';
      notification[notificationType]({
        message: '审批状态更新',
        description: data.message,
        placement: 'topRight',
        duration: 5,
        onClick: () => {
          history.push('/attendance/my');
          notification.destroy();
        },
      });
      // 触发全局事件，让页面刷新列表
      console.log('[app.tsx] 分发 workflow_status_update 事件到 window');
      window.dispatchEvent(new CustomEvent('workflow_status_update', { detail: msgData }));
      break;

    default:
      // 其他类型的通知
      if (data.message) {
        notification.info({
          message: '系统通知',
          description: data.message,
          placement: 'topRight',
          duration: 4,
        });
      }
  }
};

// 全局初始化数据配置，用于 Layout 用户信息和权限初始化
export async function getInitialState(): Promise<{
  fetchUserInfo?: () => Promise<any>;
  currentUser?: any;
  settings?: any;
}> {
  const fetchUserInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('没有找到token，用户未登录');
        return undefined;
      }

      console.log('正在验证token...');
      const response = await getCurrentUser();
      if (response.code === 200) {
        console.log('token验证成功，用户信息:', response.data);
        return response.data;
      } else {
        console.log('token验证失败:', response.message);
        // token无效，清除本地存储
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        return undefined;
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      // 清除本地存储
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      return undefined;
    }
  };

  // 获取当前路径
  const { location } = history;
  const isLoginPage = location.pathname === '/login';
  const isIndexPage = location.pathname === '/';

  console.log('getInitialState - 当前页面:', location.pathname);

  // 总是尝试获取用户信息，但不在这里做跳转
  const currentUser = await fetchUserInfo();

  console.log('getInitialState - 用户信息:', currentUser ? '已登录' : '未登录');

  return {
    fetchUserInfo,
    currentUser,
    settings: {},
  };
}

// 退出登录
const handleLogout = async (setInitialState: any) => {
  // 断开 WebSocket 连接
  wsClient.disconnect();

  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  await setInitialState((s: any) => ({ ...s, currentUser: undefined }));
  message.success('已退出登录');
  history.push('/login');
};

// 侧边栏底部用户信息组件
const SiderFooter: React.FC<{ collapsed?: boolean; currentUser: any; userRoles: string[]; setInitialState: any }> = ({
  collapsed,
  currentUser,
  userRoles,
  setInitialState,
}) => {
  const [unreadCount, setUnreadCount] = useState(globalUnreadCount);

  useEffect(() => {
    globalSetUnreadCount = setUnreadCount;

    // 初始化时先获取一次未读数量
    refreshUnreadCount();

    // 建立 WebSocket 连接，监听所有类型的事件
    wsClient.on('message', handleWsMessage);
    wsClient.on('unread_update', handleWsMessage);
    wsClient.connect();

    // 组件卸载时断开 WebSocket 连接
    return () => {
      wsClient.off('message', handleWsMessage);
      wsClient.off('unread_update', handleWsMessage);
      wsClient.disconnect();
    };
  }, []);

  if (!currentUser) return null;

  const menuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
      onClick: () => history.push('/profile'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: () => handleLogout(setInitialState),
    },
  ];

  const getRoleText = () => {
    // 优先使用后端返回的角色名称列表（例如：后勤管理员）
    if (currentUser?.roleNames && Array.isArray(currentUser.roleNames) && currentUser.roleNames.length > 0) {
      return currentUser.roleNames.join('、');
    }

    // 兼容旧逻辑：根据角色编码推断
    if (userRoles.includes('SUPER_ADMIN')) return '超级管理员';
    if (userRoles.includes('ADMIN')) return '管理员';
    if (userRoles.includes('DEPT_ADMIN')) return '部门管理员';
    if (userRoles.includes('USER')) return '普通用户';

    // 如果有自定义角色编码但不在上述列表中，直接显示第一个编码，避免误判为访客
    if (userRoles.length > 0) return userRoles[0];

    return '访客';
  };

  // 折叠时的样式
  if (collapsed) {
    return (
      <div style={{ padding: '12px 0', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <Dropdown menu={{ items: menuItems }} placement="topRight" trigger={['click']}>
          <div style={{ display: 'inline-block', cursor: 'pointer' }}>
            <Badge count={unreadCount} size="small" offset={[-4, 4]}>
              <Avatar size={36} src={currentUser?.avatar} icon={<UserOutlined />} style={{ border: '2px solid rgba(255,255,255,0.3)' }} />
            </Badge>
          </div>
        </Dropdown>
      </div>
    );
  }

  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(0,0,0,0.15)' }}>
      <Dropdown menu={{ items: menuItems }} placement="topRight" trigger={['click']}>
        <div
          style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', transition: 'background 0.3s' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
        >
          <Badge dot status="success" offset={[-4, 28]}>
            <Avatar size={40} src={currentUser?.avatar} icon={<UserOutlined />} style={{ border: '2px solid rgba(255,255,255,0.3)', flexShrink: 0 }} />
          </Badge>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={{ color: '#fff', fontSize: 14, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {currentUser?.realName || currentUser?.username}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>{getRoleText()}</div>
          </div>
          <Tooltip title="站内信">
            <Badge count={unreadCount} size="small">
              <MailOutlined
                style={{ fontSize: 18, color: 'rgba(255,255,255,0.85)', cursor: 'pointer' }}
                onClick={(e) => { e.stopPropagation(); history.push('/messages'); }}
              />
            </Badge>
          </Tooltip>
        </div>
      </Dropdown>
    </div>
  );
};

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({ initialState, setInitialState }) => {
  const currentUser = initialState?.currentUser;
  const userRoles = currentUser?.roles || [];

  return {
    ...proLayoutSettings,

    // 隐藏右上角默认头像
    avatarProps: false,

    // 右上角不显示任何内容（站内信放到侧边栏底部了）
    actionsRender: () => [],

    // 关闭水印
    waterMarkProps: false,

    // 侧边栏底部额外内容
    menuFooterRender: (menuProps: any) => (
      <SiderFooter
        collapsed={menuProps?.collapsed}
        currentUser={currentUser}
        userRoles={userRoles}
        setInitialState={setInitialState}
      />
    ),

    // 底部版权信息
    footerRender: () => (
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 99, textAlign: 'center', padding: '12px 0', color: colors.textSecondary, fontSize: '14px', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', borderTop: '1px solid #e5e7eb' }}>
        <span style={{ fontWeight: 500 }}>AnKai 管理系统</span> ©2025 Created by LDQ 🐽
      </div>
    ),

    // 菜单主题
    token: {
      sider: { colorMenuBackground: 'transparent', colorBgMenuItemHover: 'rgba(255, 255, 255, 0.1)', colorBgMenuItemSelected: colors.primary, colorTextMenu: 'rgba(255, 255, 255, 0.85)', colorTextMenuSelected: '#fff', colorTextMenuItemHover: '#fff' },
      header: { colorBgHeader: colors.headerGradient, colorTextMenu: 'rgba(255, 255, 255, 0.85)', colorTextMenuSelected: '#fff' },
      pageContainer: { paddingBlockPageContainerContent: 24, paddingInlinePageContainerContent: 24 },
    },

    // 页面切换时的loading
    childrenRender: (children) => (
      <div style={{ minHeight: 'calc(100vh - 56px)', paddingBottom: 56, animation: 'fadeIn 0.3s ease-out' }}>{children}</div>
    ),

    // 菜单点击事件
    onMenuHeaderClick: () => history.push('/home'),

    ...initialState?.settings,
  };
};

// 项目已完全使用自定义Axios请求工具 (src/utils/request.ts)
// 不再使用UmiJS Request
