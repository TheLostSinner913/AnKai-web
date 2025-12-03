import { RunTimeLayoutConfig } from '@umijs/max';
import { getCurrentUser } from '@/services/user';
import { getUnreadCount } from '@/services/message';
import { history } from '@umijs/max';
import { proLayoutSettings, colors } from '@/styles/theme';
import { Avatar, Dropdown, message, Badge, Tooltip } from 'antd';
import { UserOutlined, LogoutOutlined, MailOutlined } from '@ant-design/icons';
import React, { useState, useEffect } from 'react';

// 需要管理员权限的菜单路径
const ADMIN_ONLY_PATHS = ['/role', '/permission'];
// 管理员角色代码
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN'];

// 全局未读消息数量
let globalUnreadCount = 0;
let globalSetUnreadCount: ((count: number) => void) | null = null;

// 刷新未读消息数量的函数
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

// 检查用户是否有管理员权限
const hasAdminRole = (roles?: string[]) => {
  if (!roles) return false;
  return roles.some(role => ADMIN_ROLES.includes(role));
};

// 退出登录
const handleLogout = async (setInitialState: any) => {
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
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, 30000);
    return () => clearInterval(timer);
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
    if (userRoles.includes('SUPER_ADMIN')) return '超级管理员';
    if (userRoles.includes('ADMIN')) return '管理员';
    if (userRoles.includes('DEPT_ADMIN')) return '部门管理员';
    if (userRoles.includes('USER')) return '普通用户';
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
  const isAdmin = hasAdminRole(userRoles);

  return {
    ...proLayoutSettings,

    // 隐藏右上角默认头像
    avatarProps: false,

    // 右上角不显示任何内容（站内信放到侧边栏底部了）
    actionsRender: () => [],

    // 水印
    waterMarkProps: {
      content: currentUser?.username,
    },

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
      <div style={{ textAlign: 'center', padding: '24px 0', color: colors.textSecondary, fontSize: '14px', background: 'linear-gradient(to right, #f8fafc, #f1f5f9)', borderTop: '1px solid #e5e7eb' }}>
        <span style={{ fontWeight: 500 }}>AnKai 管理系统</span> ©2025 Created with ❤️ by AnKai
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
      <div style={{ minHeight: 'calc(100vh - 120px)', animation: 'fadeIn 0.3s ease-out' }}>{children}</div>
    ),

    // 菜单数据处理 - 权限过滤
    menuDataRender: (menuData) => menuData.filter((item) => !(item.path && ADMIN_ONLY_PATHS.includes(item.path)) || isAdmin),

    // 菜单点击事件
    onMenuHeaderClick: () => history.push('/home'),

    ...initialState?.settings,
  };
};

// 项目已完全使用自定义Axios请求工具 (src/utils/request.ts)
// 不再使用UmiJS Request
