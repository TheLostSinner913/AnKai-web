import { request } from '@umijs/max';

/** 上传文件 */
export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');
  return request('/api/file/upload', {
    method: 'POST',
    data: formData,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
}
