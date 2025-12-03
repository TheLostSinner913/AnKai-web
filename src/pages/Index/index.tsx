import { useEffect } from 'react';
import { history, useModel } from '@umijs/max';
import { Spin } from 'antd';

/**
 * 根路由组件
 * 负责处理认证逻辑和路由跳转
 */
const IndexPage: React.FC = () => {
  const { initialState, loading } = useModel('@@initialState');

  useEffect(() => {
    console.log('IndexPage: 检查用户登录状态');
    console.log('loading:', loading);
    console.log('currentUser:', initialState?.currentUser);

    if (!loading) {
      if (initialState?.currentUser) {
        // 用户已登录，跳转到首页
        console.log('IndexPage: 用户已登录，跳转到首页');
        history.push('/home');
      } else {
        // 用户未登录，跳转到登录页
        console.log('IndexPage: 用户未登录，跳转到登录页');
        history.push('/login');
      }
    }
  }, [loading, initialState?.currentUser]);

  // 显示加载状态
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh',
      flexDirection: 'column'
    }}>
      <Spin size="large" />
      <div style={{ marginTop: 16, color: '#666' }}>
        正在检查登录状态...
      </div>
    </div>
  );
};

export default IndexPage;
