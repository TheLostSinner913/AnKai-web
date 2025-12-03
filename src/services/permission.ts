import { get, post, put, del, type ApiResponse } from '@/utils/request';

export interface Permission {
  id?: number;
  parentId?: number;
  permissionName: string;
  permissionCode: string;
  permissionType?: number;
  path?: string;
  component?: string;
  icon?: string;
  sortOrder?: number;
  status?: number;
  visible?: number;
  createBy?: number;
  updateBy?: number;
  createTime?: string;
  updateTime?: string;
}

export interface PermissionTreeNode extends Permission {
  children?: PermissionTreeNode[];
}

/**
 * 获取权限树
 */
export async function getPermissionTree(): Promise<ApiResponse<PermissionTreeNode[]>> {
  return get('/permission/tree');
}

/**
 * 查询所有权限
 */
export async function getAllPermissions(): Promise<ApiResponse<Permission[]>> {
  return get('/permission/list');
}

/**
 * 根据ID查询权限
 */
export async function getPermissionById(id: number): Promise<ApiResponse<Permission>> {
  return get(`/permission/${id}`);
}

/**
 * 新增权限
 */
export async function createPermission(data: Permission): Promise<ApiResponse<Permission>> {
  return post('/permission', data);
}

/**
 * 更新权限
 */
export async function updatePermission(data: Permission): Promise<ApiResponse<Permission>> {
  return put('/permission', data);
}

/**
 * 删除权限
 */
export async function deletePermission(id: number): Promise<ApiResponse<boolean>> {
  return del(`/permission/${id}`);
}

/**
 * 根据角色ID查询权限列表
 */
export async function getPermissionsByRoleId(roleId: number): Promise<ApiResponse<number[]>> {
  return get(`/permission/role/${roleId}`);
}

/**
 * 根据用户ID查询权限列表
 */
export async function getPermissionsByUserId(userId: number): Promise<ApiResponse<Permission[]>> {
  return get(`/permission/user/${userId}`);
}

