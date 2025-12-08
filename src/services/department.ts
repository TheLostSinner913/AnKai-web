import { get, post, put, del, type ApiResponse } from '@/utils/request';

export interface Department {
  id?: number;
  parentId?: number;
  departmentName: string;
  departmentCode: string;
  leader?: string;
  phone?: string;
  email?: string;
  sortOrder?: number;
  status?: number;
  createBy?: number;
  updateBy?: number;
  createTime?: string;
  updateTime?: string;
}

export interface DepartmentTreeNode extends Department {
  userCount?: number;
  children?: DepartmentTreeNode[];
}

/**
 * 获取部门树
 */
export async function getDepartmentTree(params?: {
  departmentName?: string;
  status?: number;
}): Promise<ApiResponse<DepartmentTreeNode[]>> {
  return get('/department/tree', params);
}

/**
 * 获取部门下拉选项
 */
export async function getDepartmentOptions(): Promise<ApiResponse<DepartmentTreeNode[]>> {
  return get('/department/options');
}

/**
 * 获取所有部门列表
 */
export async function getAllDepartments(): Promise<ApiResponse<Department[]>> {
  return get('/department/list');
}

/**
 * 根据ID查询部门
 */
export async function getDepartmentById(id: number): Promise<ApiResponse<Department>> {
  return get(`/department/${id}`);
}

/**
 * 新增部门
 */
export async function createDepartment(data: Department): Promise<ApiResponse<boolean>> {
  return post('/department', data);
}

/**
 * 更新部门
 */
export async function updateDepartment(data: Department): Promise<ApiResponse<boolean>> {
  return put('/department', data);
}

/**
 * 删除部门
 */
export async function deleteDepartment(id: number): Promise<ApiResponse<boolean>> {
  return del(`/department/${id}`);
}

