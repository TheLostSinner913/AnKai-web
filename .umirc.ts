import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {
    // 配置 Ant Design 5.x 主题
    configProvider: {
      theme: {
        token: {
          colorPrimary: '#1890ff',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorInfo: '#1890ff',
          colorBgLayout: '#d4d9e2',
          colorBgContainer: '#ffffff',
          colorText: '#1f2937',
          colorTextSecondary: '#6b7280',
          colorBorder: '#d1d5db',
          borderRadius: 8,
        },
        components: {
          Button: {
            borderRadius: 12,
            defaultBorderColor: '#c9cdd4',
            defaultShadow: '0 2px 4px rgba(0, 0, 0, 0.08)',
          },
          Card: {
            borderRadius: 12,
          },
          Table: {
            borderRadius: 12,
            headerBg: '#f8fafc',
          },
          Modal: {
            borderRadius: 12,
          },
          Input: {
            borderRadius: 8,
          },
          Select: {
            borderRadius: 8,
          },
        },
      },
    },
  },
  access: {},
  model: {},
  initialState: {},
  request: {
    dataField: 'data',
  },
  layout: {
    title: 'AnKai 后台管理系统',
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
  },
  // 引入全局样式文件
  styles: ['/src/global.less'],
  routes: [
    {
      path: '/login',
      component: './Login',
      layout: false,
    },
    {
      path: '/',
      component: './Index',
      layout: false,
    },
    {
      name: '首页',
      path: '/home',
      component: './Home',
      icon: 'HomeOutlined',
    },
    {
      name: '用户管理',
      path: '/user',
      component: './User',
      icon: 'UserOutlined',
      access: 'canAccessUser',
    },
    {
      name: '角色管理',
      path: '/role',
      component: './Role',
      icon: 'TeamOutlined',
      access: 'canAccessRole',
    },
    {
      name: '权限管理',
      path: '/permission',
      component: './Permission',
      icon: 'SafetyOutlined',
      access: 'canAccessPermission',
    },
    {
      name: '公告管理',
      path: '/announcement',
      component: './Announcement',
      icon: 'NotificationOutlined',
      access: 'canAccessAnnouncement',
    },
    {
      name: '站内信',
      path: '/messages',
      component: './Messages',
      hideInMenu: true, // 不在侧边菜单显示，通过底部图标访问
    },
    {
      name: '个人中心',
      path: '/profile',
      component: './Profile',
      hideInMenu: true, // 不在菜单中显示
    },
  ],
  npmClient: 'npm',
  // 配置代理，连接到SpringBoot后端
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
  },
  // 开发服务器配置
  devtool: 'source-map',
  // 构建配置
  define: {
    API_BASE_URL: process.env.NODE_ENV === 'production'
      ? 'https://your-production-api.com'
      : 'http://localhost:8080',
  },
});

