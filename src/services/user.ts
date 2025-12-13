import { get, post, put, del, ApiResponse, PageResult, PageParams } from '@/utils/request';

export interface UserPageParams extends PageParams {
  username?: string;
  phone?: string;
  status?: number;
  roleIds?: number[];
  departmentIds?: number[];
  onlineStatus?: 'online' | 'recent_active' | 'offline';
  sortField?: string;
  sortOrder?: string;
}

export interface UserFormData {
  id?: number;
  username: string;
  password?: string;
  email?: string;
  phone?: string;
  realName?: string;
  departmentId?: number;
  position?: string;
  status?: number;
  remark?: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email?: string;
  phone?: string;
  realName?: string;
  avatar?: string;
  departmentId?: number;
  departmentName?: string;
  position?: string;
  status: number;
  // 在线状态：online / recent_active / offline
  onlineStatus?: 'online' | 'recent_active' | 'offline';
  createTime?: string;
  updateTime?: string;
  remark?: string;
  hasPassword?: boolean; // 是否有密码
}

// 角色简要信息
export interface RoleInfo {
  id: number;
  roleName: string;
  roleCode: string;
}

// 用户信息（包含角色列表）
export interface UserWithRoles extends UserInfo {
  roles?: RoleInfo[];
}

export interface UserCreateRequest {
  username: string;
  password: string;
  email?: string;
  phone?: string;
  realName?: string;
  avatar?: string;
  departmentId?: number;
  position?: string;
  status?: number;
  remark?: string;
}

export interface UserEditRequest {
  id: number;
  username?: string;
  password?: string; // 可选，为空则不修改
  email?: string;
  phone?: string;
  realName?: string;
  avatar?: string;
  departmentId?: number;
  position?: string;
  status?: number;
  remark?: string;
}

/**
 * 分页查询用户列表
 */
export async function getUserPage(params: UserPageParams): Promise<ApiResponse<PageResult<UserInfo>>> {
  return post('/user/page', params);
}

/**
 * 分页查询用户列表（包含角色信息）
 */
export async function getUserPageWithRoles(params: UserPageParams): Promise<ApiResponse<PageResult<UserWithRoles>>> {
  return post('/user/page-with-roles', params);
}

/**
 * 根据ID查询用户
 */
export async function getUserById(id: number): Promise<ApiResponse<UserInfo>> {
  return get(`/user/${id}`);
}

/**
 * 根据用户名查询用户
 */
export async function getUserByUsername(username: string): Promise<ApiResponse<UserInfo>> {
  return get(`/user/username/${username}`);
}

/**
 * 新增用户
 */
export async function addUser(data: UserFormData): Promise<ApiResponse<boolean>> {
  return post('/user', data);
}

/**
 * 更新用户
 */
export async function updateUser(data: UserFormData): Promise<ApiResponse<boolean>> {
  return put('/user', data);
}

/**
 * 删除用户
 */
export async function deleteUser(id: number): Promise<ApiResponse<boolean>> {
  return del(`/user/${id}`);
}

/**
 * 批量删除用户
 */
export async function batchDeleteUser(ids: number[]): Promise<ApiResponse<boolean>> {
  return del('/user/batch', { data: ids });
}

/**
 * 查询所有用户
 */
export async function getAllUsers(): Promise<ApiResponse<UserInfo[]>> {
  return get('/user/list');
}

/**
 * 检查用户名是否存在
 */
export async function checkUsername(username: string): Promise<ApiResponse<boolean>> {
  return get(`/user/check/username/${username}`);
}

/**
 * 检查邮箱是否存在
 */
export async function checkEmail(email: string): Promise<ApiResponse<boolean>> {
  return get(`/user/check/email/${email}`);
}

/**
 * 测试后端连接
 */
export async function testConnection(): Promise<ApiResponse<any>> {
  return get('/test/hello');
}

/**
 * 获取服务器信息
 */
export async function getServerInfo(): Promise<ApiResponse<any>> {
  return get('/test/info');
}

// ==================== 认证相关接口 ====================

export interface LoginParams {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  token: string;
  tokenType: string;
  expiresIn: number;
  userInfo: {
    id: number;
    username: string;
    realName: string;
    email: string;
    avatar: string;
    roles: string[];
    permissions: string[];
  };
}

/**
 * 用户登录
 */
export async function login(params: LoginParams): Promise<ApiResponse<LoginResult>> {
  return post('/auth/login', params);
}

/**
 * 用户登出
 */
export async function logout(): Promise<ApiResponse<boolean>> {
  return post('/auth/logout');
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<ApiResponse<LoginResult['userInfo']>> {
  return get('/auth/currentUser');
}

/**
 * 验证token
 */
export async function validateToken(): Promise<ApiResponse<boolean>> {
  return get('/auth/validate');
}

// ==================== 用户角色相关接口 ====================

/**
 * 获取用户的角色ID列表
 */
export async function getUserRoleIds(userId: number): Promise<ApiResponse<number[]>> {
  return get(`/user/${userId}/roles`);
}

/**
 * 为用户分配角色
 */
export async function assignUserRoles(userId: number, roleIds: number[]): Promise<ApiResponse<boolean>> {
  return post('/user/assign-roles', { userId, roleIds });
}

// ==================== 在线状态相关接口 ====================

/**
 * 获取在线用户ID列表
 */
export async function getOnlineUserIds(): Promise<ApiResponse<number[]>> {
  return get('/user/online');
}

/**
 * 批量检查用户在线状态
 */
export async function checkOnlineStatus(userIds: number[]): Promise<ApiResponse<Record<number, boolean>>> {
  return post('/user/online/check', userIds);
}

/**
 * 获取在线用户数量
 */
export async function getOnlineCount(): Promise<ApiResponse<number>> {
  return get('/user/online/count');
}

/**
 * 修改密码
 */
export async function updatePassword(data: { oldPassword: string; newPassword: string }): Promise<ApiResponse<boolean>> {
  return put('/user/password', data);
}
