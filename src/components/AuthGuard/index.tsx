import { useEffect } from 'react';
import { history, useModel } from '@umijs/max';
import { Spin } from 'antd';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 路由守卫组件
 * 用于保护需要登录才能访问的页面
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { initialState, loading } = useModel('@@initialState');

  useEffect(() => {
    // 如果初始化完成且用户未登录，跳转到登录页
    if (!loading && !initialState?.currentUser) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        console.log('AuthGuard: 用户未登录，跳转到登录页');
        history.push('/login');
      }
    }
  }, [loading, initialState?.currentUser]);

  // 如果正在加载，显示loading
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" tip="正在验证登录状态..." />
      </div>
    );
  }

  // 如果用户未登录，显示空白（等待跳转）
  if (!initialState?.currentUser) {
    return null;
  }

  // 用户已登录，渲染子组件
  return <>{children}</>;
};

export default AuthGuard;
