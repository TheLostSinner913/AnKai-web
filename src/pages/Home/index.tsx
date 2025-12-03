import Guide from '@/components/Guide';
import { trim } from '@/utils/format';
import { PageContainer, StatisticCard } from '@ant-design/pro-components';
import { useModel, history } from '@umijs/max';
import { Card, Col, Row, Typography, Button, message, Space } from 'antd';
import { testConnection, getServerInfo, logout } from '@/services/user';
import { useState } from 'react';
import styles from './index.less';

const { Title, Paragraph } = Typography;

const HomePage: React.FC = () => {
  const { name } = useModel('global');
  const [loading, setLoading] = useState(false);
  const [serverInfo, setServerInfo] = useState<any>(null);

  // 测试后端连接
  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await testConnection();
      if (response.code === 200) {
        message.success('后端连接成功！');
        console.log('连接测试结果:', response.data);
      } else {
        message.error('后端连接失败: ' + response.message);
      }
    } catch (error) {
      message.error('后端连接失败，请检查后端服务是否启动');
      console.error('连接错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取服务器信息
  const handleGetServerInfo = async () => {
    setLoading(true);
    try {
      const response = await getServerInfo();
      if (response.code === 200) {
        setServerInfo(response.data);
        message.success('获取服务器信息成功！');
      } else {
        message.error('获取服务器信息失败: ' + response.message);
      }
    } catch (error) {
      message.error('获取服务器信息失败');
      console.error('获取信息错误:', error);
    } finally {
      setLoading(false);
    }
  };

  // 用户登出
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      message.success('登出成功！');
      history.push('/login');
    } catch (error) {
      message.error('登出失败');
      console.error('登出错误:', error);
    }
  };

  return (
    <PageContainer ghost>
      <div className={styles.container}>
        {/* 欢迎信息 */}
        <Card style={{ marginBottom: 24 }}>
          <Title level={2}>欢迎使用 AnKai 后台管理系统</Title>
          <Paragraph>
            这是一个基于 <strong>SpringBoot + Ant Design Pro</strong> 构建的现代化后台管理系统。
            系统集成了用户管理、权限控制、数据展示等常用功能模块。
          </Paragraph>
          <Paragraph>
            <strong>技术栈：</strong>
            <br />
            • 前端：React + TypeScript + Ant Design Pro + UmiJS
            <br />
            • 后端：SpringBoot + MyBatis Plus + MySQL
            <br />
            • 特性：分页查询、逻辑删除、自动填充、乐观锁、日志管理
          </Paragraph>

          {/* 连接测试按钮 */}
          <Space>
            <Button
              type="primary"
              loading={loading}
              onClick={handleTestConnection}
            >
              测试后端连接
            </Button>
            <Button
              loading={loading}
              onClick={handleGetServerInfo}
            >
              获取服务器信息
            </Button>
            <Button
              danger
              onClick={handleLogout}
            >
              登出
            </Button>
          </Space>

          {/* 显示服务器信息 */}
          {serverInfo && (
            <Card style={{ marginTop: 16 }} title="服务器信息">
              <p><strong>服务名称：</strong>{serverInfo.serverName}</p>
              <p><strong>版本：</strong>{serverInfo.version}</p>
              <p><strong>框架：</strong>{serverInfo.framework}</p>
              <p><strong>数据库：</strong>{serverInfo.database}</p>
              <p><strong>当前时间：</strong>{serverInfo.currentTime}</p>
            </Card>
          )}
        </Card>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              statistic={{
                title: '用户总数',
                value: 1234,
                suffix: '人',
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              statistic={{
                title: '今日访问',
                value: 567,
                suffix: '次',
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              statistic={{
                title: '系统运行',
                value: 99.9,
                suffix: '%',
              }}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <StatisticCard
              statistic={{
                title: '数据总量',
                value: 8888,
                suffix: '条',
              }}
            />
          </Col>
        </Row>

        {/* 原有的Guide组件 */}
        <Guide name={trim(name)} />
      </div>
    </PageContainer>
  );
};

export default HomePage;
