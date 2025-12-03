import { get, post, put, del, type ApiResponse, type PageResult } from '@/utils/request';

export interface Role {
  id?: number;
  roleName: string;
  roleCode: string;
  description?: string;
  sortOrder?: number;
  dataScope?: number;
  status?: number;
  createBy?: number;
  updateBy?: number;
  createTime?: string;
  updateTime?: string;
}

export interface RolePageParams {
  current: number;
  size: number;
  roleName?: string;
  roleCode?: string;
  status?: number;
}

export interface RolePermissionRequest {
  roleId: number;
  permissionIds: number[];
}

/**
 * 分页查询角色列表
 */
export async function getRolePage(params: RolePageParams): Promise<ApiResponse<PageResult<Role>>> {
  return post('/role/page', params);
}

/**
 * 根据ID查询角色
 */
export async function getRoleById(id: number): Promise<ApiResponse<Role>> {
  return get(`/role/${id}`);
}

/**
 * 新增角色
 */
export async function createRole(data: Role): Promise<ApiResponse<Role>> {
  return post('/role', data);
}

/**
 * 更新角色
 */
export async function updateRole(data: Role): Promise<ApiResponse<Role>> {
  return put('/role', data);
}

/**
 * 删除角色
 */
export async function deleteRole(id: number): Promise<ApiResponse<boolean>> {
  return del(`/role/${id}`);
}

/**
 * 批量删除角色
 */
export async function batchDeleteRole(ids: number[]): Promise<ApiResponse<boolean>> {
  return del('/role/batch', { data: ids });
}

/**
 * 为角色分配权限
 */
export async function assignPermissions(data: RolePermissionRequest): Promise<ApiResponse<boolean>> {
  return post('/role/assign-permissions', data);
}

/**
 * 获取角色的权限ID列表
 */
export async function getRolePermissions(roleId: number): Promise<ApiResponse<number[]>> {
  return get(`/role/${roleId}/permissions`);
}

/**
 * 查询所有角色
 */
export async function getAllRoles(): Promise<ApiResponse<Role[]>> {
  return get('/role/list');
}

