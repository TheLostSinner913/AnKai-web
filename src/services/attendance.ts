import { get, post, put, del } from '@/utils/request';

// ========== 请假相关 ==========

/** 提交请假申请 */
export async function submitLeave(data: API.LeaveApplication) {
  return post('/attendance/leave', data);
}

/** 更新并重新提交请假申请（编辑撤回的申请） */
export async function updateAndResubmitLeave(id: number, data: API.LeaveApplication) {
  return put(`/attendance/leave/${id}/resubmit`, data);
}

/** 撤回请假申请 */
export async function withdrawLeave(id: number) {
  return post(`/attendance/leave/${id}/withdraw`);
}

/** 取消请假申请 */
export async function cancelLeave(id: number) {
  return post(`/attendance/leave/${id}/cancel`);
}

/** 获取请假详情 */
export async function getLeaveDetail(id: number) {
  return get(`/attendance/leave/${id}`);
}

/** 我的请假列表 */
export async function pageMyLeave(params: {
  page?: number;
  size?: number;
  status?: number;
  leaveType?: string;
}) {
  return get('/attendance/leave/my', params);
}

/** 所有请假列表（管理员） */
export async function pageAllLeave(params: {
  page?: number;
  size?: number;
  status?: number;
  leaveType?: string;
  deptId?: number;
  userName?: string;
  year?: number;
  month?: number;
}) {
  return get('/attendance/leave/all', params);
}

/** 我的请假统计 */
export async function getMyLeaveStats(year?: number) {
  return get('/attendance/leave/my-stats', { year });
}

/** 考勤统计（管理员） */
export async function getAdminStats(year?: number, month?: number) {
  return get('/attendance/leave/admin-stats', { year, month });
}

/** 检查请假模块是否配置了工作流 */
export async function checkLeaveWorkflow() {
  return get('/attendance/leave/check-workflow');
}

// ========== 工作流模块绑定 ==========

/** 获取所有模块绑定配置 */
export async function getModuleBindings() {
  return get('/workflow/module-binding/list');
}

/** 保存模块绑定 */
export async function saveModuleBinding(data: {
  moduleCode: string;
  moduleName: string;
  definitionId?: number;
  processKey?: string;
  processName?: string;
  enabled: number;
}) {
  return post('/workflow/module-binding', data);
}

/** 检查模块是否绑定工作流 */
export async function checkModuleBound(moduleCode: string) {
  return get(`/workflow/module-binding/check/${moduleCode}`);
}

