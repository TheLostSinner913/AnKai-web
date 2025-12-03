import { get } from '@/utils/request';

// 获取首页统计数据
export async function getDashboardStats() {
  return get('/dashboard/stats');
}

// 获取欢迎语信息
export async function getGreeting() {
  return get('/dashboard/greeting');
}

// 获取天气信息（根据IP定位城市）
export async function getWeather() {
  return get('/dashboard/weather');
}

