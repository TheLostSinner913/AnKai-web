import { PlusOutlined, TeamOutlined, MessageOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Tooltip, Badge } from 'antd';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useModel } from '@umijs/max';
import { deleteUser, getUserPageWithRoles, getOnlineUserIds, type UserWithRoles, type RoleInfo } from '@/services/user';
import UserForm from './components/UserForm';
import UserRoleDrawer from './components/UserRoleModal';
import SendMessageModal from './components/SendMessageModal';

// 角色颜色映射
const roleColorMap: Record<string, string> = {
  SUPER_ADMIN: 'gold',
  ADMIN: 'blue',
  DEPT_ADMIN: 'green',
  USER: 'purple',
  GUEST: 'default',
};

export interface UserType extends UserWithRoles {
  id: number;
  username: string;
  email: string;
  phone: string;
  realName: string;
  status: number;
  createTime: string;
  updateTime: string;
}

const UserList: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const currentUserRoles = currentUser?.roles || [];

  // 判断当前用户角色
  const isSuperAdmin = currentUserRoles.includes('SUPER_ADMIN');
  const isAdmin = currentUserRoles.includes('ADMIN');
  const canManageUsers = isSuperAdmin || isAdmin; // 是否有用户管理权限

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<UserType>();
  const [onlineUserIds, setOnlineUserIds] = useState<Set<number>>(new Set());
  const actionRef = useRef<ActionType>();

  // 判断目标用户是否是超级管理员
  const isTargetSuperAdmin = (record: UserType) => {
    return record.roles?.some((role: RoleInfo) => role.roleCode === 'SUPER_ADMIN') || false;
  };

  // 判断是否可以操作目标用户（编辑/角色/删除）
  const canOperateUser = (record: UserType) => {
    // 超级管理员可以操作所有人
    if (isSuperAdmin) return true;
    // 管理员可以操作非超级管理员
    if (isAdmin && !isTargetSuperAdmin(record)) return true;
    return false;
  };

  // 获取在线用户列表
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const response = await getOnlineUserIds();
      if (response.code === 200 && response.data) {
        setOnlineUserIds(new Set(response.data));
      }
    } catch (error) {
      console.error('获取在线用户失败:', error);
    }
  }, []);

  // 定时刷新在线状态
  useEffect(() => {
    fetchOnlineUsers();
    const timer = setInterval(fetchOnlineUsers, 30000); // 每30秒刷新一次
    return () => clearInterval(timer);
  }, [fetchOnlineUsers]);

  /**
   * 删除用户
   */
  const handleDelete = async (id: number) => {
    try {
      const response = await deleteUser(id);
      if (response.code === 200) {
        message.success('删除成功');
        actionRef.current?.reload();
      } else {
        message.error(response.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<UserType>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80,
      search: false,
    },
    {
      title: '在线',
      dataIndex: 'online',
      key: 'online',
      width: 70,
      search: false,
      render: (_, record) => {
        const isOnline = onlineUserIds.has(record.id);
        return (
          <Tooltip title={isOnline ? '在线' : '离线'}>
            <Badge status={isOnline ? 'success' : 'default'} text={isOnline ? '在线' : '离线'} />
          </Tooltip>
        );
      },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
    },
    {
      title: '真实姓名',
      dataIndex: 'realName',
      key: 'realName',
      width: 120,
      search: false,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 200,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
      search: false,
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 200,
      search: false,
      render: (_, record) => {
        const roles = record.roles || [];
        if (roles.length === 0) {
          return <Tag>未分配角色</Tag>;
        }
        return (
          <Space size={[0, 4]} wrap>
            {roles.map((role: RoleInfo) => (
              <Tooltip key={role.id} title={role.roleCode}>
                <Tag color={roleColorMap[role.roleCode] || 'default'}>
                  {role.roleName}
                </Tag>
              </Tooltip>
            ))}
          </Space>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      search: false,
      render: (_, record) => (
        <Tag color={record.status === 1 ? 'green' : 'red'}>
          {record.status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      key: 'createTime',
      width: 180,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 140,
      render: (_, record) => {
        const canOperate = canOperateUser(record);
        const isSelf = record.id === currentUser?.id;

        return (
          <Space size={4}>
            {/* 消息按钮 - 所有人都可以发消息（除了给自己） */}
            {!isSelf && (
              <Tooltip title="发送消息">
                <Button
                  type="text"
                  size="small"
                  icon={<MessageOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => {
                    setCurrentRow(record);
                    setMessageModalOpen(true);
                  }}
                />
              </Tooltip>
            )}
            {/* 角色按钮 - 只有有权限的管理员可以操作 */}
            {canOperate && (
              <Tooltip title="分配角色">
                <Button
                  type="text"
                  size="small"
                  icon={<TeamOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => {
                    setCurrentRow(record);
                    setRoleModalOpen(true);
                  }}
                />
              </Tooltip>
            )}
            {/* 编辑按钮 - 只有有权限的管理员可以操作 */}
            {canOperate && (
              <Tooltip title="编辑">
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined style={{ color: '#1677ff' }} />}
                  onClick={() => {
                    setCurrentRow(record);
                    setUpdateModalOpen(true);
                  }}
                />
              </Tooltip>
            )}
            {/* 删除按钮 - 只有有权限的管理员可以操作，且不能删除自己 */}
            {canOperate && !isSelf && (
              <Popconfirm
                title="确定要删除这个用户吗？"
                onConfirm={() => handleDelete(record.id)}
                okText="确定"
                cancelText="取消"
              >
                <Tooltip title="删除">
                  <Button
                    type="text"
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                  />
                </Tooltip>
              </Popconfirm>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <>
      <ProTable<UserType>
        headerTitle="用户列表"
        actionRef={actionRef}
        rowKey="id"
        search={{
          labelWidth: 120,
        }}
        toolBarRender={() => canManageUsers ? [
          <Button
            type="primary"
            key="primary"
            onClick={() => {
              setCreateModalOpen(true);
            }}
          >
            <PlusOutlined /> 新建用户
          </Button>,
        ] : []}
        request={async (params, sort, filter) => {
          try {
            const response = await getUserPageWithRoles({
              current: params.current,
              size: params.pageSize,
              username: params.username,
              email: params.email,
              sortField: Object.keys(sort || {})[0],
              sortOrder: Object.values(sort || {})[0] === 'ascend' ? 'asc' : 'desc',
            });

            if (response.code === 200) {
              return {
                data: response.data.records,
                success: true,
                total: response.data.total,
              };
            } else {
              message.error(response.message || '查询失败');
              return {
                data: [],
                success: false,
                total: 0,
              };
            }
          } catch (error) {
            message.error('查询失败');
            return {
              data: [],
              success: false,
              total: 0,
            };
          }
        }}
        columns={columns}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showQuickJumper: true,
        }}
      />
      
      {/* 新建用户弹窗 */}
      <UserForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        onFinish={async () => {
          setCreateModalOpen(false);
          actionRef.current?.reload();
        }}
      />
      
      {/* 编辑用户弹窗 */}
      <UserForm
        open={updateModalOpen}
        onOpenChange={setUpdateModalOpen}
        initialValues={currentRow}
        onFinish={async () => {
          setUpdateModalOpen(false);
          setCurrentRow(undefined);
          actionRef.current?.reload();
        }}
      />

      {/* 用户角色分配抽屉 */}
      <UserRoleDrawer
        visible={roleModalOpen}
        user={currentRow}
        onCancel={() => {
          setRoleModalOpen(false);
          setCurrentRow(undefined);
        }}
        onSuccess={() => {
          setRoleModalOpen(false);
          setCurrentRow(undefined);
          actionRef.current?.reload(); // 刷新列表以更新角色标签
        }}
      />

      {/* 聊天抽屉 */}
      <SendMessageModal
        visible={messageModalOpen}
        receiverId={currentRow?.id}
        receiverName={currentRow?.realName || currentRow?.username}
        receiverAvatar={currentRow?.avatar}
        online={currentRow?.id ? onlineUserIds.has(currentRow.id) : false}
        onCancel={() => {
          setMessageModalOpen(false);
          setCurrentRow(undefined);
        }}
        onSuccess={() => {
          // 发送成功后不关闭，保持聊天窗口打开
        }}
      />
    </>
  );
};

export default UserList;
