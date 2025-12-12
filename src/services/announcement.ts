import { get, post, put, del } from '@/utils/request';

export interface Announcement {
  id?: number;
  title: string;
  content: string;
  announcementType?: number; // 1-普通 2-重要 3-紧急
  targetType?: number; // 1-全员 2-指定用户 3-指定角色
  status?: number; // 0-草稿 1-已发布 2-已撤回
  publishTime?: string;
  expireTime?: string;
  isTop?: number;
  topOrder?: number;
  viewCount?: number;
  createBy?: number;
  createByName?: string; // 发布者姓名
  createTime?: string;
}

// 获取用户可见的公告列表
export async function getVisibleAnnouncements(limit: number = 10) {
  return get('/announcement/visible', { limit });
}

// 获取未读公告数量
export async function getUnreadAnnouncementCount() {
  return get('/announcement/unread/count');
}

// 标记公告已读
export async function markAnnouncementAsRead(id: number) {
  return put(`/announcement/${id}/read`);
}

// 分页查询公告（管理端）
export async function getAnnouncementPage(params: {
  current?: number;
  size?: number;
  title?: string;
  status?: number;
  announcementType?: number;
  recentDays?: number;
}) {
  return get('/announcement/page', params);
}

// 获取公告详情
export async function getAnnouncementById(id: number) {
  return get(`/announcement/${id}`);
}

// 新增公告
export async function addAnnouncement(data: Announcement) {
  return post('/announcement', data);
}

// 更新公告
export async function updateAnnouncement(id: number, data: Partial<Announcement>) {
  return put(`/announcement/${id}`, data);
}

// 删除公告
export async function deleteAnnouncement(id: number) {
  return del(`/announcement/${id}`);
}

// 发布公告
export async function publishAnnouncement(id: number, targetUserIds?: number[]) {
  return put(`/announcement/${id}/publish`, targetUserIds ? { targetUserIds } : {});
}

// 撤回公告
export async function withdrawAnnouncement(id: number) {
  return put(`/announcement/${id}/withdraw`);
}

