import { LockOutlined, UserOutlined, SafetyOutlined, CloudOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Alert, message, Tabs, Card, Space, Typography } from 'antd';
import React, { useState, useEffect } from 'react';
import { history, useModel } from '@umijs/max';
import { login } from '@/services/user';
import ParticleBackground from '@/components/ParticleBackground';
import styles from './index.less';

const { Title, Text } = Typography;

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [userLoginState, setUserLoginState] = useState<{
    status?: 'ok' | 'error';
    type?: string;
    currentAuthority?: string;
  }>({});
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');

  // 检查用户是否已经登录
  useEffect(() => {
    if (initialState?.currentUser) {
      console.log('用户已登录，从登录页跳转到首页');
      history.push('/home');
    }
  }, [initialState?.currentUser]);

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      await setInitialState((s) => ({
        ...s,
        currentUser: userInfo,
      }));
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // 登录
      const response = await login({
        username: values.username,
        password: values.password,
        rememberMe: values.autoLogin,
      });

      if (response.code === 200) {
        const defaultLoginSuccessMessage = '登录成功！';
        message.success(defaultLoginSuccessMessage);

        // 存储token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userInfo', JSON.stringify(response.data.userInfo));

        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/home');
        return;
      } else {
        // 如果失败去设置用户错误信息
        setUserLoginState({
          status: 'error',
          type,
        });
        message.error(response.message || '登录失败，请重试！');
      }
    } catch (error) {
      const defaultLoginFailureMessage = '登录失败，请重试！';
      console.log(error);
      message.error(defaultLoginFailureMessage);
      setUserLoginState({
        status: 'error',
        type,
      });
    }
  };

  const { status, type: loginType } = userLoginState;

  return (
    <div className={styles.container}>
      {/* 粒子背景 */}
      <ParticleBackground />

      {/* 背景装饰元素 */}
      <div className={styles.backgroundElements}>
        <div className={styles.floatingElement} style={{ top: '10%', left: '10%' }}>
          <CloudOutlined style={{ fontSize: '60px', color: 'rgba(255,255,255,0.1)' }} />
        </div>
        <div className={styles.floatingElement} style={{ top: '20%', right: '15%' }}>
          <SafetyOutlined style={{ fontSize: '80px', color: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className={styles.floatingElement} style={{ bottom: '30%', left: '8%' }}>
          <UserOutlined style={{ fontSize: '50px', color: 'rgba(255,255,255,0.06)' }} />
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className={styles.content}>
        {/* 左侧信息面板 */}
        <div className={styles.infoPanel}>
          <Card className={styles.infoCard}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div className={styles.logoSection}>
                <div className={styles.logoIcon}>
                  <SafetyOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
                </div>
                <Title level={2} style={{ margin: '16px 0 8px 0', color: '#fff' }}>
                  AnKai 管理系统
                </Title>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
                  现代化企业级后台管理解决方案
                </Text>
              </div>

              <div className={styles.features}>
                <Space direction="vertical" size="middle">
                  <div className={styles.feature}>
                    <SafetyOutlined style={{ color: '#52c41a', marginRight: '8px' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>安全可靠的权限管理</Text>
                  </div>
                  <div className={styles.feature}>
                    <CloudOutlined style={{ color: '#1890ff', marginRight: '8px' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>云原生架构设计</Text>
                  </div>
                  <div className={styles.feature}>
                    <UserOutlined style={{ color: '#722ed1', marginRight: '8px' }} />
                    <Text style={{ color: 'rgba(255,255,255,0.9)' }}>用户体验优先</Text>
                  </div>
                </Space>
              </div>
            </Space>
          </Card>
        </div>

        {/* 右侧登录表单 */}
        <div className={styles.loginPanel}>
          <Card className={styles.loginCard}>
            <LoginForm
              logo={false}
              title={
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <Title level={3} style={{ margin: 0, color: '#262626' }}>
                    欢迎登录
                  </Title>
                  <Text type="secondary" style={{ fontSize: '14px' }}>
                    请输入您的账户信息
                  </Text>
                </div>
              }
              subTitle=""
              initialValues={{
                autoLogin: true,
              }}
              onFinish={async (values) => {
                await handleSubmit(values as any);
              }}
            >
              {status === 'error' && loginType === 'account' && (
                <LoginMessage content="账户或密码错误" />
              )}

              <ProFormText
                name="username"
                fieldProps={{
                  size: 'large',
                  prefix: <UserOutlined style={{ color: '#1890ff' }} />,
                }}
                placeholder="用户名: admin"
                rules={[
                  {
                    required: true,
                    message: '用户名是必填项！',
                  },
                ]}
              />
              <ProFormText.Password
                name="password"
                fieldProps={{
                  size: 'large',
                  prefix: <LockOutlined style={{ color: '#1890ff' }} />,
                }}
                placeholder="密码: 123456"
                rules={[
                  {
                    required: true,
                    message: '密码是必填项！',
                  },
                ]}
              />

              <div
                style={{
                  marginBottom: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <ProFormCheckbox noStyle name="autoLogin">
                  <Text style={{ color: '#666' }}>记住我</Text>
                </ProFormCheckbox>
                <a
                  style={{
                    color: '#1890ff',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                  onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
                >
                  忘记密码？
                </a>
              </div>
            </LoginForm>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Login;
