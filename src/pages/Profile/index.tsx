import React, { useState } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Avatar, Descriptions, Tag, Button, Space, Row, Col, Divider, message, Modal, Form, Input } from 'antd';
import { UserOutlined, EditOutlined, MailOutlined, PhoneOutlined, TeamOutlined, SafetyOutlined, KeyOutlined } from '@ant-design/icons';
import { useModel, history } from '@umijs/max';
import { updatePassword } from '@/services/user';

const ProfilePage: React.FC = () => {
  const { initialState, setInitialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  if (!currentUser) {
    return (
      <PageContainer>
        <Card>
          <div style={{ textAlign: 'center', padding: 40 }}>
            用户未登录，请先<a onClick={() => history.push('/login')}>登录</a>
          </div>
        </Card>
      </PageContainer>
    );
  }

  const getRoleTag = (role: string) => {
    const roleMap: Record<string, { color: string; text: string }> = {
      'SUPER_ADMIN': { color: 'red', text: '超级管理员' },
      'ADMIN': { color: 'orange', text: '管理员' },
      'DEPT_ADMIN': { color: 'blue', text: '部门管理员' },
      'USER': { color: 'green', text: '普通用户' },
      'GUEST': { color: 'default', text: '访客' },
    };
    const info = roleMap[role] || { color: 'default', text: role };
    return <Tag color={info.color} key={role}>{info.text}</Tag>;
  };

  const handleChangePassword = async () => {
    try {
      const values = await form.validateFields();
      if (values.newPassword !== values.confirmPassword) {
        message.error('两次输入的密码不一致');
        return;
      }
      setLoading(true);
      const response = await updatePassword({
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      if (response.code === 200) {
        message.success('密码修改成功，请重新登录');
        setPasswordModalOpen(false);
        form.resetFields();
        // 退出登录
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
        await setInitialState((s: any) => ({ ...s, currentUser: undefined }));
        history.push('/login');
      } else {
        message.error(response.message || '密码修改失败');
      }
    } catch (error) {
      console.error('修改密码失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="个人中心">
      <Row gutter={24}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Avatar
                size={100}
                src={currentUser.avatar}
                icon={<UserOutlined />}
                style={{ border: '4px solid #f0f0f0' }}
              />
              <h2 style={{ marginTop: 16, marginBottom: 4 }}>
                {currentUser.realName || currentUser.username}
              </h2>
              <p style={{ color: '#999', marginBottom: 16 }}>
                @{currentUser.username}
              </p>
              <Space wrap>
                {(currentUser.roles || []).map((role: string) => getRoleTag(role))}
              </Space>
              <Divider />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button icon={<KeyOutlined />} block onClick={() => setPasswordModalOpen(true)}>
                  修改密码
                </Button>
              </Space>
            </div>
          </Card>
        </Col>
        <Col xs={24} md={16}>
          <Card title="基本信息" extra={<Button type="link" icon={<EditOutlined />}>编辑</Button>}>
            <Descriptions column={{ xs: 1, sm: 2 }} bordered>
              <Descriptions.Item label={<><UserOutlined /> 用户名</>}>
                {currentUser.username}
              </Descriptions.Item>
              <Descriptions.Item label={<><UserOutlined /> 真实姓名</>}>
                {currentUser.realName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={<><MailOutlined /> 邮箱</>}>
                {currentUser.email || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={<><PhoneOutlined /> 手机号</>}>
                {currentUser.phone || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={<><TeamOutlined /> 部门</>}>
                {currentUser.departmentName || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="职位">
                {currentUser.position || '-'}
              </Descriptions.Item>
              <Descriptions.Item label="性别">
                {currentUser.gender === 1 ? '男' : currentUser.gender === 2 ? '女' : '未知'}
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                <Tag color={currentUser.status === 1 ? 'success' : 'error'}>
                  {currentUser.status === 1 ? '正常' : '禁用'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal
        title="修改密码"
        open={passwordModalOpen}
        onOk={handleChangePassword}
        onCancel={() => { setPasswordModalOpen(false); form.resetFields(); }}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>
          <Form.Item name="newPassword" label="新密码" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}>
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>
          <Form.Item name="confirmPassword" label="确认密码" rules={[{ required: true, message: '请确认新密码' }]}>
            <Input.Password placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ProfilePage;

