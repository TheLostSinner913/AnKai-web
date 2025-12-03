import { get, post, put, del } from '@/utils/request';

export interface Todo {
  id?: number;
  userId?: number;
  title: string;
  description?: string;
  todoDate: string;
  startTime?: string;
  endTime?: string;
  priority?: number; // 1-低 2-中 3-高
  status?: number; // 0-待办 1-进行中 2-已完成 3-已取消 4-已忽略
  color?: string;
  todoType?: number; // 1-个人添加 2-系统分配
  sourceType?: string;
  sourceId?: number;
  remindTime?: string;
  createTime?: string;
  updateTime?: string;
}

// 获取某日的待办列表
export async function getTodosByDate(date: string) {
  return get(`/todo/date/${date}`);
}

// 获取某月有待办的日期列表
export async function getTodoDatesInMonth(year: number, month: number) {
  return get('/todo/month', { year, month });
}

// 获取待办数量统计
export async function getTodoCount() {
  return get('/todo/count');
}

// 新增待办
export async function addTodo(data: Todo) {
  return post('/todo', data);
}

// 更新待办
export async function updateTodo(id: number, data: Partial<Todo>) {
  return put(`/todo/${id}`, data);
}

// 删除待办
export async function deleteTodo(id: number) {
  return del(`/todo/${id}`);
}

// 完成待办
export async function completeTodo(id: number) {
  return put(`/todo/${id}/complete`);
}

// 取消待办
export async function cancelTodo(id: number) {
  return put(`/todo/${id}/cancel`);
}

// 忽略待办
export async function ignoreTodo(id: number) {
  return put(`/todo/${id}/ignore`);
}

