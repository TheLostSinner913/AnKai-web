import { PlusOutlined, TeamOutlined, MessageOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Tooltip, Badge } from 'antd';
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useModel } from '@umijs/max';
import { deleteUser, getUserPageWithRoles, type UserWithRoles, type RoleInfo } from '@/services/user';
import { getAllRoles } from '@/services/role';
import { getDepartmentOptions, type DepartmentTreeNode } from '@/services/department';
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
  const permissions = currentUser?.permissions || [];

  // 判断当前用户角色
  const isSuperAdmin = currentUserRoles.includes('SUPER_ADMIN');
  const isAdmin = currentUserRoles.includes('ADMIN');

  // 权限检查函数（支持 user:add 和 system:user:add 两种格式）
  const hasPermission = (code: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(code) || permissions.includes(`system:${code}`);
  };

  // 按钮级别权限
  const canQuery = hasPermission('user:query');
  const canAdd = hasPermission('user:add');
  const canEdit = hasPermission('user:edit');
  const canDelete = hasPermission('user:delete');
  const canResetPwd = hasPermission('user:resetPwd');
  const canAssignRole = hasPermission('role:permission'); // 分配角色需要角色权限管理权限

  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [updateModalOpen, setUpdateModalOpen] = useState<boolean>(false);
  const [roleModalOpen, setRoleModalOpen] = useState<boolean>(false);
  const [messageModalOpen, setMessageModalOpen] = useState<boolean>(false);
  const [currentRow, setCurrentRow] = useState<UserType>();
  const actionRef = useRef<ActionType>();

  const [roleOptions, setRoleOptions] = useState<RoleInfo[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentTreeNode[]>([]);

  useEffect(() => {
    // 加载角色选项
    getAllRoles().then((res) => {
      if (res.code === 200 && res.data) {
        setRoleOptions(res.data);
      }
    });

    // 加载部门树选项
    getDepartmentOptions().then((res) => {
      if (res.code === 200 && res.data) {
        setDepartmentOptions(res.data);
      }
    });
  }, []);

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
      dataIndex: 'onlineStatus',
      key: 'onlineStatus',
      width: 90,
      search: false,
      render: (_, record) => {
        const status = record.onlineStatus || 'offline';
        let badgeStatus: 'default' | 'success' | 'warning' = 'default';
        let text = '离线';
        if (status === 'online') {
          badgeStatus = 'success';
          text = '在线';
        } else if (status === 'recent_active') {
          badgeStatus = 'warning';
          text = '刚刚活跃';
        }
        return (
          <Tooltip title={text}>
            <Badge status={badgeStatus} text={text} />
          </Tooltip>
        );
      },
    },
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      width: 120,
      fieldProps: {
        style: { width: '100%' },
      },
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
      width: 160,
      ellipsis: true,
      search: false,
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      width: 120,
      // 允许作为搜索条件（模糊）
      fieldProps: {
        style: { width: '100%' },
      },
    },
    {
      title: '部门',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 140,
      search: false,
      render: (text) => text || <span style={{ color: '#595959' }}>未分配</span>,
    },
    {
      title: '职位',
      dataIndex: 'position',
      key: 'position',
      width: 100,
      search: false,
      render: (text) => text || '-',
    },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      width: 150,
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
    // 搜索用字段：状态
    {
      title: '状态',
      dataIndex: 'searchStatus',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        1: { text: '启用' },
        0: { text: '禁用' },
      },
      fieldProps: {
        style: { width: '100%' },
      },
    },
    // 搜索用字段：角色
    {
      title: '角色',
      dataIndex: 'roleIds',
      hideInTable: true,
      valueType: 'select',
      fieldProps: {
        mode: 'multiple',
        options: roleOptions.map((r) => ({ label: r.roleName, value: r.id })),
        style: { width: '100%' },
      },
    },
    // 搜索用字段：部门
    {
      title: '部门',
      dataIndex: 'departmentIds',
      hideInTable: true,
      valueType: 'treeSelect',
      fieldProps: {
        treeCheckable: true,
        showCheckedStrategy: 'SHOW_PARENT',
        fieldNames: { label: 'departmentName', value: 'id', children: 'children' },
        treeData: departmentOptions,
        style: { width: '100%' },
      },
    },
    // 搜索用字段：在线状态
    {
      title: '在线状态',
      dataIndex: 'onlineStatus',
      hideInTable: true,
      valueType: 'select',
      valueEnum: {
        online: { text: '在线' },
        recent_active: { text: '刚刚活跃' },
        offline: { text: '离线' },
      },
      fieldProps: {
        style: { width: '100%' },
      },
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
            {/* 角色按钮 - 需要分配角色权限且可以操作目标用户 */}
            {canAssignRole && canOperate && (
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
            {/* 编辑按钮 - 需要编辑权限且可以操作目标用户 */}
            {canEdit && canOperate && (
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
            {/* 删除按钮 - 需要删除权限且可以操作目标用户，且不能删除自己 */}
            {canDelete && canOperate && !isSelf && (
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
          labelWidth: 90,
          span: 3,           // 每项占 1/8 行，一行可放更多项（字段 + 按钮同一行）
          collapsed: false,
          collapseRender: false,
        }}
        toolBarRender={() => canAdd ? [
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
              phone: params.phone,
              status: params.searchStatus,
              roleIds: params.roleIds,
              departmentIds: params.departmentIds,
              onlineStatus: params.onlineStatus,
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
        online={currentRow?.onlineStatus === 'online'}
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
