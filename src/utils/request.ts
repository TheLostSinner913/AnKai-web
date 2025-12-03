import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { history } from '@umijs/max';

// 环境配置
const isDev = process.env.NODE_ENV === 'development';

// 创建axios实例
const request = axios.create({
  baseURL: '/api',
  timeout: 30000, // 30秒超时
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    if (isDev) {
      console.log('=== Axios请求拦截器 ===');
      console.log('请求URL:', config.url);
      console.log('请求方法:', config.method?.toUpperCase());
    }

    // 确保headers存在
    if (!config.headers) {
      config.headers = {};
    }

    // 添加token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      if (isDev) {
        console.log('已添加Authorization头');
      }
    }

    // 添加请求时间戳（用于调试）
    if (isDev) {
      config.headers['X-Request-Time'] = new Date().toISOString();
      console.log('请求配置:', config);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('请求拦截器错误:', error);
    message.error('请求配置错误');
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    if (isDev) {
      console.log('=== Axios响应拦截器 ===');
      console.log('响应状态:', response.status);
      console.log('响应数据:', response.data);
    }

    const { data } = response;

    // 如果后端返回的是标准格式 {code, message, data, timestamp}
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code === 200) {
        if (isDev) {
          console.log('请求成功:', data.message || 'Success');
        }
        return data; // 返回完整的响应数据
      } else if (data.code === 401) {
        // token过期处理
        console.warn('Token过期，跳转到登录页');
        message.error('登录已过期，请重新登录');
        clearAuthData();
        redirectToLogin();
        return Promise.reject(new Error('登录已过期'));
      } else if (data.code === 403) {
        message.error('没有权限访问该资源');
        return Promise.reject(new Error('权限不足'));
      } else {
        // 其他业务错误
        const errorMsg = data.message || '请求失败';
        message.error(errorMsg);
        return Promise.reject(new Error(errorMsg));
      }
    }

    // 如果不是标准格式，直接返回原始响应
    return response;
  },
  (error: AxiosError) => {
    console.error('响应拦截器错误:', error);

    // 网络错误或服务器错误
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          message.error('登录已过期，请重新登录');
          clearAuthData();
          redirectToLogin();
          break;
        case 403:
          message.error('没有权限访问该资源');
          break;
        case 404:
          message.error('请求的资源不存在');
          break;
        case 500:
          message.error('服务器内部错误');
          break;
        case 502:
          message.error('网关错误');
          break;
        case 503:
          message.error('服务暂时不可用');
          break;
        default:
          message.error((data as any)?.message || `请求失败 (${status})`);
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      message.error('网络连接超时，请检查网络');
    } else {
      // 其他错误
      message.error(error.message || '请求配置错误');
    }

    return Promise.reject(error);
  }
);

// 工具函数
const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
  // 清除其他可能的认证相关数据
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('userInfo');
};

const redirectToLogin = () => {
  // 只有在非登录页面时才跳转
  if (window.location.pathname !== '/login') {
    history.push('/login');
    // 可选：刷新页面以重新初始化状态
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
};

// 请求工具类
class RequestUtil {
  // 基础请求方法
  static async request<T = any>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request(config);
  }

  // GET请求
  static async get<T = any>(url: string, params?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.get(url, { params, ...config });
  }

  // POST请求
  static async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.post(url, data, config);
  }

  // PUT请求
  static async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.put(url, data, config);
  }

  // DELETE请求
  static async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.delete(url, config);
  }

  // PATCH请求
  static async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    return request.patch(url, data, config);
  }

  // 文件上传
  static async upload<T = any>(url: string, file: File | FormData, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return request.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      ...config,
    });
  }

  // 下载文件
  static async download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await request.get(url, {
      responseType: 'blob',
      ...config,
    });

    // 创建下载链接
    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  // 批量请求
  static async all<T = any>(requests: Promise<any>[]): Promise<T[]> {
    return Promise.all(requests);
  }

  // 获取当前token
  static getToken(): string | null {
    return localStorage.getItem('token');
  }

  // 设置token
  static setToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // 清除认证数据
  static clearAuth(): void {
    clearAuthData();
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// 便捷方法导出
export const get = RequestUtil.get;
export const post = RequestUtil.post;
export const put = RequestUtil.put;
export const del = RequestUtil.delete;
export const patch = RequestUtil.patch;
export const upload = RequestUtil.upload;
export const download = RequestUtil.download;

// 导出请求工具类和axios实例
export { RequestUtil };
export default request;

// 类型定义
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

export interface PageResult<T = any> {
  records: T[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface PageParams {
  current?: number;
  size?: number;
  [key: string]: any;
}
