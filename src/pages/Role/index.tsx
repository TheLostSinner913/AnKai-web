import { PlusOutlined, DeleteOutlined, EditOutlined, SafetyOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import { useModel } from '@umijs/max';
import {
  getRolePage,
  deleteRole,
  batchDeleteRole,
  type Role,
} from '@/services/role';
import RoleModal from './components/RoleModal';
import PermissionDrawer from './components/PermissionModal';

const RolePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userRoles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  // 超级管理员拥有所有权限
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  // 权限检查（支持 role:query 和 system:role:query 两种格式）
  const hasPermission = (code: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(code) || permissions.includes(`system:${code}`);
  };

  const canQuery = hasPermission('role:query');
  const canAdd = hasPermission('role:add');
  const canEdit = hasPermission('role:edit');
  const canDelete = hasPermission('role:delete');
  const canAssignPermission = hasPermission('role:permission');

  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [currentRole, setCurrentRole] = useState<Role | undefined>(undefined);

  const columns: ProColumns<Role>[] = [
    {
      title: 'ID',
      dataIndex: 'id',
      width: 80,
      search: false,
    },
    {
      title: '角色名称',
      dataIndex: 'roleName',
      width: 150,
    },
    {
      title: '角色编码',
      dataIndex: 'roleCode',
      width: 150,
    },
    {
      title: '描述',
      dataIndex: 'description',
      search: false,
      ellipsis: true,
    },
    {
      title: '数据权限',
      dataIndex: 'dataScope',
      width: 120,
      search: false,
      valueEnum: {
        1: { text: '全部', status: 'Success' },
        2: { text: '本部门及下级', status: 'Processing' },
        3: { text: '本部门', status: 'Default' },
        4: { text: '仅本人', status: 'Warning' },
        5: { text: '自定义', status: 'Error' },
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueEnum: {
        0: { text: '禁用', status: 'Error' },
        1: { text: '启用', status: 'Success' },
      },
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      width: 80,
      search: false,
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      width: 180,
      search: false,
      valueType: 'dateTime',
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {canAssignPermission && (
            <Tooltip title="权限配置">
              <Button
                type="text"
                size="small"
                icon={<SafetyOutlined style={{ color: '#1677ff' }} />}
                onClick={() => {
                  setCurrentRole(record);
                  setPermissionModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          {canEdit && (
            <Tooltip title="编辑">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined style={{ color: '#1677ff' }} />}
                onClick={() => {
                  setCurrentRole(record);
                  setRoleModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="确定要删除这个角色吗？"
              onConfirm={async () => {
                const res = await deleteRole(record.id!);
                if (res.code === 200) {
                  message.success('删除成功');
                  actionRef.current?.reload();
                } else {
                  message.error(res.message || '删除失败');
                }
              }}
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
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <ProTable<Role>
        columns={columns}
        actionRef={actionRef}
        cardBordered
        request={async (params) => {
          // 如果没有查询权限，返回空数据
          if (!canQuery) {
            return { data: [], success: true, total: 0 };
          }
          const res = await getRolePage({
            current: params.current || 1,
            size: params.pageSize || 10,
            roleName: params.roleName,
            roleCode: params.roleCode,
            status: params.status,
          });
          return {
            data: res.data?.records || [],
            success: res.code === 200,
            total: res.data?.total || 0,
          };
        }}
        rowKey="id"
        search={canQuery ? { labelWidth: 'auto' } : false}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
        }}
        dateFormatter="string"
        headerTitle="角色列表"
        toolBarRender={() => [
          canAdd && (
            <Button
              key="add"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setCurrentRole(undefined);
                setRoleModalVisible(true);
              }}
            >
              新增角色
            </Button>
          ),
          canDelete && selectedRowKeys.length > 0 && (
            <Popconfirm
              key="batchDelete"
              title={`确定要删除选中的 ${selectedRowKeys.length} 个角色吗？`}
              onConfirm={async () => {
                const res = await batchDeleteRole(selectedRowKeys as number[]);
                if (res.code === 200) {
                  message.success('批量删除成功');
                  setSelectedRowKeys([]);
                  actionRef.current?.reload();
                } else {
                  message.error(res.message || '批量删除失败');
                }
              }}
            >
              <Button danger icon={<DeleteOutlined />}>
                批量删除
              </Button>
            </Popconfirm>
          ),
        ].filter(Boolean)}
        rowSelection={canDelete ? {
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        } : false}
      />

      <RoleModal
        visible={roleModalVisible}
        role={currentRole}
        onCancel={() => {
          setRoleModalVisible(false);
          setCurrentRole(undefined);
        }}
        onSuccess={() => {
          setRoleModalVisible(false);
          setCurrentRole(undefined);
          actionRef.current?.reload();
        }}
      />

      <PermissionDrawer
        visible={permissionModalVisible}
        role={currentRole}
        onCancel={() => {
          setPermissionModalVisible(false);
          setCurrentRole(undefined);
        }}
        onSuccess={() => {
          setPermissionModalVisible(false);
          setCurrentRole(undefined);
        }}
      />
    </div>
  );
};

export default RolePage;

