import { get, post, put, del } from '@/utils/request';

// ========== 流程定义相关 ==========

/** 分页查询流程定义 */
export async function pageDefinitions(params: {
  page?: number;
  size?: number;
  name?: string;
  category?: string;
  status?: number;
}) {
  return get('/workflow/definition/page', params);
}

/** 获取流程定义详情 */
export async function getDefinition(id: number) {
  return get(`/workflow/definition/${id}`);
}

/** 保存流程定义（草稿） */
export async function saveDefinition(data: API.WfProcessDefinition) {
  return post('/workflow/definition', data);
}

/** 更新流程定义 */
export async function updateDefinition(data: API.WfProcessDefinition) {
  return put('/workflow/definition', data);
}

/** 发布流程定义 */
export async function publishDefinition(id: number) {
  return post(`/workflow/definition/${id}/publish`);
}

/** 停用流程定义 */
export async function disableDefinition(id: number) {
  return post(`/workflow/definition/${id}/disable`);
}

/** 复制流程定义 */
export async function copyDefinition(id: number) {
  return post(`/workflow/definition/${id}/copy`);
}

/** 删除流程定义 */
export async function deleteDefinition(id: number) {
  return del(`/workflow/definition/${id}`);
}

/** 根据流程标识获取已发布的流程定义 */
export async function getPublishedDefinition(processKey: string) {
  return get(`/workflow/definition/published/${processKey}`);
}

/** 获取流程定义列表（用于下拉选择） */
export async function getProcessDefinitionList(params?: { status?: number }) {
  return get('/workflow/definition/list', params);
}

// ========== 流程实例相关 ==========

/** 发起流程 */
export async function startProcess(data: {
  processKey: string;
  title: string;
  formData?: string;
  attachmentIds?: number[];
}) {
  return post('/workflow/instance/start', data);
}

/** 获取流程实例详情 */
export async function getInstance(id: number) {
  return get(`/workflow/instance/${id}`);
}

/** 我发起的流程 */
export async function pageMyStarted(params: {
  page?: number;
  size?: number;
  status?: number;
}) {
  return get('/workflow/instance/my-started', params);
}

/** 撤回流程 */
export async function withdrawProcess(id: number) {
  return post(`/workflow/instance/${id}/withdraw`);
}

/** 取消流程 */
export async function cancelProcess(id: number, reason: string) {
  return post(`/workflow/instance/${id}/cancel`, { reason });
}

/** 催办 */
export async function urgeProcess(id: number) {
  return post(`/workflow/instance/${id}/urge`);
}

// ========== 任务相关 ==========

/** 我的待办任务 */
export async function pageMyPending(params: { page?: number; size?: number }) {
  return get('/workflow/task/pending', params);
}

/** 我的已办任务 */
export async function pageMyCompleted(params: { page?: number; size?: number }) {
  return get('/workflow/task/completed', params);
}

/** 获取待办数量 */
export async function getPendingCount() {
  return get('/workflow/task/pending-count');
}

/** 获取任务详情 */
export async function getTaskDetail(assigneeId: number) {
  return get(`/workflow/task/${assigneeId}`);
}

/** 审批通过 */
export async function approveTask(
  assigneeId: number,
  data: { comment?: string; attachmentIds?: number[] },
) {
  return post(`/workflow/task/${assigneeId}/approve`, data);
}

/** 审批拒绝 */
export async function rejectTask(
  assigneeId: number,
  data: { comment?: string; attachmentIds?: number[] },
) {
  return post(`/workflow/task/${assigneeId}/reject`, data);
}

/** 转交任务 */
export async function delegateTask(
  assigneeId: number,
  data: { targetUserId: number; comment?: string },
) {
  return post(`/workflow/task/${assigneeId}/delegate`, data);
}

/** 退回到上一节点 */
export async function returnTask(assigneeId: number, comment?: string) {
  return post(`/workflow/task/${assigneeId}/return`, { comment });
}

