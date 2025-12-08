/**
 * 权限控制配置
 *
 * 使用方式：
 * 1. 路由配置中添加 access: 'canAccess' 属性
 * 2. 系统会自动根据用户的 permissions 数组检查权限
 *
 * 权限编码格式（数据库中）：
 * - 菜单权限：system:user, system:role, system:announcement 等
 * - 按钮权限：system:user:query, system:user:add 等
 *
 * 路由 access 配置示例：
 * - access: 'canAccessUser'       -> 检查 user 相关权限
 * - access: 'canAccessRole'       -> 检查 role 相关权限
 * - access: 'canAccessAnnouncement' -> 检查 announcement 相关权限
 */
export default (initialState: { currentUser?: any } | undefined) => {
  const currentUser = initialState?.currentUser;
  const roles: string[] = currentUser?.roles || [];
  const permissions: string[] = currentUser?.permissions || [];

  // 超级管理员拥有所有权限
  const isSuperAdmin = roles.includes('SUPER_ADMIN');
  const isAdmin = roles.includes('ADMIN') || isSuperAdmin;

  /**
   * 通用权限检查函数
   * @param moduleCode 模块编码，如 'user', 'role', 'announcement'
   * @returns 是否有该模块的访问权限
   *
   * 检查逻辑：
   * 1. 超级管理员直接通过
   * 2. 检查是否有 system:{moduleCode} 权限（菜单权限）
   * 3. 检查是否有 system:{moduleCode}:xxx 权限（任意子权限）
   * 4. 检查是否有 {moduleCode} 权限（简化格式）
   * 5. 检查是否有 {moduleCode}:xxx 权限（简化子权限格式）
   */
  const hasModuleAccess = (moduleCode: string): boolean => {
    if (isSuperAdmin) return true;

    // 标准格式：system:user, system:user:query
    const systemPrefix = `system:${moduleCode}`;

    return permissions.some((p: string) =>
      p === systemPrefix ||                    // 完全匹配菜单权限
      p.startsWith(`${systemPrefix}:`) ||      // 匹配子权限 system:user:query
      p === moduleCode ||                      // 简化格式 user
      p.startsWith(`${moduleCode}:`)           // 简化子权限 user:query
    );
  };

  /**
   * 检查具体操作权限（用于按钮级别控制）
   * @param permissionCode 完整权限编码，如 'system:user:add', 'announcement:delete'
   */
  const hasPermission = (permissionCode: string): boolean => {
    if (isSuperAdmin) return true;
    return permissions.includes(permissionCode) ||
           permissions.includes(`system:${permissionCode}`);
  };

  return {
    // ==================== 基础权限 ====================
    isSuperAdmin,
    isAdmin,
    canSeeAdmin: isAdmin,

    // ==================== 菜单访问权限（路由级别） ====================
    // 用户管理
    canAccessUser: () => hasModuleAccess('user'),

    // 角色管理
    canAccessRole: () => hasModuleAccess('role'),

    // 权限管理
    canAccessPermission: () => hasModuleAccess('permission'),

    // 公告管理
    canAccessAnnouncement: () => hasModuleAccess('announcement'),

    // 消息管理
    canAccessMessage: () => hasModuleAccess('message'),

    // 待办管理
    canAccessTodo: () => hasModuleAccess('todo'),

    // 部门管理
    canAccessDept: () => hasModuleAccess('dept'),
    canAccessDepartment: () => hasModuleAccess('dept'),

    // ==================== 操作权限（按钮级别） ====================
    // 通用权限检查函数，供页面组件使用
    hasPermission,
    hasModuleAccess,

    // ==================== 后续新增功能权限模板 ====================
    // 添加新功能时，按以下格式添加：
    // canAccessXxx: () => hasModuleAccess('xxx'),
  };
};
