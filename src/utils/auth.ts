/**
 * 认证相关工具函数
 */

/**
 * 获取本地存储的token
 */
export function getToken(): string | null {
  return localStorage.getItem('token');
}

/**
 * 设置token到本地存储
 */
export function setToken(token: string): void {
  localStorage.setItem('token', token);
}

/**
 * 移除本地存储的token
 */
export function removeToken(): void {
  localStorage.removeItem('token');
  localStorage.removeItem('userInfo');
}

/**
 * 检查用户是否已登录
 */
export function isLoggedIn(): boolean {
  const token = getToken();
  return !!token;
}

/**
 * 清除所有认证信息
 */
export function clearAuth(): void {
  removeToken();
  // 可以在这里添加其他需要清除的信息
}

/**
 * 简单的JWT token解析（不验证签名）
 * 仅用于获取token中的信息，不能用于安全验证
 */
export function parseJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('解析JWT失败:', error);
    return null;
  }
}

/**
 * 检查token是否即将过期（前端简单检查）
 */
export function isTokenExpiringSoon(token: string, thresholdMinutes: number = 5): boolean {
  try {
    const payload = parseJWT(token);
    if (!payload || !payload.exp) {
      return true;
    }
    
    const expirationTime = payload.exp * 1000; // 转换为毫秒
    const currentTime = Date.now();
    const thresholdTime = thresholdMinutes * 60 * 1000; // 转换为毫秒
    
    return (expirationTime - currentTime) < thresholdTime;
  } catch (error) {
    console.error('检查token过期时间失败:', error);
    return true;
  }
}
