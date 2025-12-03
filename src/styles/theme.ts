/**
 * AnKai 后台管理系统 - 主题配置
 * 统一的设计变量，供 JS/TSX 组件使用
 */

// =============== 颜色主题 ===============
export const colors = {
  // 主色调
  primary: '#1890ff',
  primaryHover: '#40a9ff',
  primaryActive: '#096dd9',
  primaryGradient: 'linear-gradient(135deg, #1890ff, #40a9ff)',

  // 功能色
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',

  // 文本色
  textPrimary: '#1f2937',
  textSecondary: '#6b7280',
  textDisabled: '#9ca3af',
  textWhite: '#ffffff',

  // 背景色
  bgLayout: '#d8dce4',
  bgPage: '#dce0e8',
  bgContent: '#d4d9e2',    // 内容区加深的灰色背景
  bgCard: '#ffffff',
  bgHover: '#f0f9ff',

  // 边框色
  border: '#d1d5db',
  borderLight: '#e5e7eb',
  borderHover: '#1890ff',

  // 侧边栏配色
  siderGradient: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
  headerGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
};

// =============== 阴影配置 ===============
export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  md: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  lg: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  card: '0 2px 8px rgba(0, 0, 0, 0.08)',
  cardHover: '0 8px 24px rgba(0, 0, 0, 0.12)',
  button: '0 2px 4px rgba(0, 0, 0, 0.1)',
};

// =============== 圆角配置 ===============
export const borderRadius = {
  sm: '4px',
  base: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
};

// =============== 间距配置 ===============
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '12px',
  base: '16px',
  lg: '20px',
  xl: '24px',
  xxl: '32px',
};

// =============== Ant Design 主题配置 ===============
export const antdTheme = {
  token: {
    colorPrimary: colors.primary,
    colorSuccess: colors.success,
    colorWarning: colors.warning,
    colorError: colors.error,
    colorInfo: colors.info,
    colorBgLayout: colors.bgContent,
    colorBgContainer: colors.bgCard,
    colorText: colors.textPrimary,
    colorTextSecondary: colors.textSecondary,
    colorBorder: colors.border,
    borderRadius: 8,
    boxShadow: shadows.base,
    boxShadowSecondary: shadows.card,
  },
  components: {
    Button: {
      borderRadius: 8,
      primaryShadow: shadows.button,
    },
    Card: {
      borderRadius: 12,
      boxShadow: shadows.card,
    },
    Table: {
      borderRadius: 12,
      headerBg: '#f8fafc',
      headerColor: colors.textPrimary,
      rowHoverBg: colors.bgHover,
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
    Menu: {
      darkItemBg: 'transparent',
      darkSubMenuItemBg: 'transparent',
      darkItemSelectedBg: colors.primary,
    },
  },
};

// =============== Pro Layout 配置 ===============
export const proLayoutSettings = {
  navTheme: 'dark' as const,
  primaryColor: colors.primary,
  layout: 'side' as const,
  contentWidth: 'Fluid' as const,
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'AnKai 管理系统',
  pwa: false,
  iconfontUrl: '',
  headerHeight: 56,
  splitMenus: false,
  siderWidth: 208,
};

// =============== 统一卡片样式配置 ===============
export const cardStyle = {
  background: colors.bgCard,
  borderRadius: borderRadius.lg,
  boxShadow: shadows.card,
  border: 'none',
};

// =============== 表格通用配置 ===============
export const tableConfig = {
  cardProps: {
    bodyStyle: { padding: 0 },
    style: cardStyle,
  },
  search: {
    labelWidth: 'auto' as const,
    defaultCollapsed: false,
  },
  pagination: {
    pageSize: 10,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number) => `共 ${total} 条记录`,
  },
};

export default {
  colors,
  shadows,
  borderRadius,
  spacing,
  antdTheme,
  proLayoutSettings,
  cardStyle,
  tableConfig,
};

