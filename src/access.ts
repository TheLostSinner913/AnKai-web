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

    // ==================== 考勤模块 ====================
    // 考勤管理父菜单：只要有任意考勤相关权限即可显示
    canAccessAttendance: () =>
      hasPermission('attendance') ||
      hasPermission('attendance:my') ||
      hasPermission('attendance:management') ||
      hasPermission('attendance:leave:query') ||
      hasPermission('attendance:stats:query'),

    // 我的考勤：需要 attendance:my 或任意请假相关按钮权限
    canAccessAttendanceMy: () =>
      hasPermission('attendance:my') ||
      hasPermission('attendance:leave:query') ||
      hasPermission('attendance:leave:apply') ||
      hasPermission('attendance:leave:withdraw'),

    // 考勤统计：需要 attendance:management 或统计相关按钮权限
    canAccessAttendanceManagement: () =>
      hasPermission('attendance:management') ||
      hasPermission('attendance:stats:query') ||
      hasPermission('attendance:stats:export'),

    // ==================== 工作流模块 ====================
    // 工作流父菜单：只要有任意工作流相关权限即可显示
    canAccessWorkflow: () =>
      hasPermission('workflow') ||
      hasPermission('workflow:definition') ||
      hasPermission('workflow:task') ||
      hasPermission('workflow:my-process') ||
      hasPermission('workflow:module-binding') ||
      hasPermission('workflow:definition:query') ||
      hasPermission('workflow:task:query'),

    // 流程定义：需要 workflow:definition 或其按钮权限
    canAccessWorkflowDefinition: () =>
      hasPermission('workflow:definition') ||
      hasPermission('workflow:definition:query') ||
      hasPermission('workflow:definition:add') ||
      hasPermission('workflow:definition:edit') ||
      hasPermission('workflow:definition:delete') ||
      hasPermission('workflow:definition:publish') ||
      hasPermission('workflow:definition:disable') ||
      hasPermission('workflow:definition:copy'),

    // 待办任务：需要 workflow:task 或其按钮权限
    canAccessWorkflowTask: () =>
      hasPermission('workflow:task') ||
      hasPermission('workflow:task:query') ||
      hasPermission('workflow:task:approve') ||
      hasPermission('workflow:task:reject') ||
      hasPermission('workflow:task:delegate') ||
      hasPermission('workflow:task:return'),

    // 我的流程：需要 workflow:my-process 权限
    canAccessWorkflowMyProcess: () =>
      hasPermission('workflow:my-process'),

    // 模块绑定：需要 workflow:module-binding 或其按钮权限
    canAccessWorkflowModuleBinding: () =>
      hasPermission('workflow:module-binding') ||
      hasPermission('workflow:module-binding:query') ||
      hasPermission('workflow:module-binding:edit'),

    // ==================== 操作权限（按钮级别） ====================
    // 通用权限检查函数，供页面组件使用
    hasPermission,
    hasModuleAccess,

    // ==================== 按钮权限快捷方法 ====================
    // 用户管理按钮
    canUserQuery: () => hasPermission('system:user:query'),
    canUserAdd: () => hasPermission('system:user:add'),
    canUserEdit: () => hasPermission('system:user:edit'),
    canUserDelete: () => hasPermission('system:user:delete'),
    canUserExport: () => hasPermission('system:user:export'),
    canUserImport: () => hasPermission('system:user:import'),
    canUserResetPwd: () => hasPermission('system:user:resetPwd'),

    // 角色管理按钮
    canRoleQuery: () => hasPermission('system:role:query'),
    canRoleAdd: () => hasPermission('system:role:add'),
    canRoleEdit: () => hasPermission('system:role:edit'),
    canRoleDelete: () => hasPermission('system:role:delete'),
    canRolePermission: () => hasPermission('system:role:permission'),

    // 权限管理按钮
    canPermissionQuery: () => hasPermission('system:permission:query'),
    canPermissionAdd: () => hasPermission('system:permission:add'),
    canPermissionEdit: () => hasPermission('system:permission:edit'),
    canPermissionDelete: () => hasPermission('system:permission:delete'),

    // 部门管理按钮
    canDeptQuery: () => hasPermission('system:dept:query'),
    canDeptAdd: () => hasPermission('system:dept:add'),
    canDeptEdit: () => hasPermission('system:dept:edit'),
    canDeptDelete: () => hasPermission('system:dept:delete'),

    // 公告管理按钮
    canAnnouncementQuery: () => hasPermission('system:announcement:query'),
    canAnnouncementAdd: () => hasPermission('system:announcement:add'),
    canAnnouncementEdit: () => hasPermission('system:announcement:edit'),
    canAnnouncementDelete: () => hasPermission('system:announcement:delete'),
    canAnnouncementPublish: () => hasPermission('system:announcement:publish'),

    // 工作流-流程定义按钮
    canWorkflowDefinitionQuery: () => hasPermission('workflow:definition:query'),
    canWorkflowDefinitionAdd: () => hasPermission('workflow:definition:add'),
    canWorkflowDefinitionEdit: () => hasPermission('workflow:definition:edit'),
    canWorkflowDefinitionDelete: () => hasPermission('workflow:definition:delete'),
    canWorkflowDefinitionPublish: () => hasPermission('workflow:definition:publish'),
    canWorkflowDefinitionDisable: () => hasPermission('workflow:definition:disable'),
    canWorkflowDefinitionCopy: () => hasPermission('workflow:definition:copy'),

    // 工作流-待办任务按钮
    canWorkflowTaskQuery: () => hasPermission('workflow:task:query'),
    canWorkflowTaskApprove: () => hasPermission('workflow:task:approve'),
    canWorkflowTaskReject: () => hasPermission('workflow:task:reject'),
    canWorkflowTaskDelegate: () => hasPermission('workflow:task:delegate'),
    canWorkflowTaskReturn: () => hasPermission('workflow:task:return'),

    // 工作流-模块绑定按钮
    canWorkflowModuleBindingQuery: () => hasPermission('workflow:module-binding:query'),
    canWorkflowModuleBindingEdit: () => hasPermission('workflow:module-binding:edit'),

    // 考勤-请假按钮
    canAttendanceLeaveQuery: () => hasPermission('attendance:leave:query'),
    canAttendanceLeaveApply: () => hasPermission('attendance:leave:apply'),
    canAttendanceLeaveWithdraw: () => hasPermission('attendance:leave:withdraw'),

    // 考勤-统计按钮
    canAttendanceStatsQuery: () => hasPermission('attendance:stats:query'),
    canAttendanceStatsExport: () => hasPermission('attendance:stats:export'),
  };
};
