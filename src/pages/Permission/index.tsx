import { PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Card, message, Popconfirm, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import {
  getPermissionTree,
  deletePermission,
  type PermissionTreeNode,
} from '@/services/permission';
import PermissionFormModal from './components/PermissionFormModal';

const PermissionPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userRoles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  // 超级管理员拥有所有权限
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  // 权限检查（支持 permission:query 和 system:permission:query 两种格式）
  const hasPermission = (code: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(code) || permissions.includes(`system:${code}`);
  };

  const canQuery = hasPermission('permission:query');
  const canAdd = hasPermission('permission:add');
  const canEdit = hasPermission('permission:edit');
  const canDelete = hasPermission('permission:delete');

  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<PermissionTreeNode[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentPermission, setCurrentPermission] = useState<PermissionTreeNode | undefined>(
    undefined,
  );

  useEffect(() => {
    if (canQuery) {
      loadData();
    }
  }, [canQuery]);

  const loadData = async () => {
    if (!canQuery) return;
    setLoading(true);
    try {
      const res = await getPermissionTree();
      if (res.code === 200) {
        setTreeData(res.data || []);
      } else {
        message.error(res.message || '加载失败');
      }
    } catch (error) {
      message.error('加载失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await deletePermission(id);
      if (res.code === 200) {
        message.success('删除成功');
        loadData();
      } else {
        message.error(res.message || '删除失败');
      }
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns: ColumnsType<PermissionTreeNode> = [
    {
      title: '权限名称',
      dataIndex: 'permissionName',
      key: 'permissionName',
      width: 200,
    },
    {
      title: '权限编码',
      dataIndex: 'permissionCode',
      key: 'permissionCode',
      width: 200,
    },
    {
      title: '权限类型',
      dataIndex: 'permissionType',
      key: 'permissionType',
      width: 100,
      render: (type: number) => {
        const typeMap: Record<number, { text: string; color: string }> = {
          1: { text: '菜单', color: 'blue' },
          2: { text: '按钮', color: 'green' },
          3: { text: '接口', color: 'orange' },
        };
        const config = typeMap[type] || { text: '未知', color: 'default' };
        return <Tag color={config.color}>{config.text}</Tag>;
      },
    },
    {
      title: '路由路径',
      dataIndex: 'path',
      key: 'path',
      width: 150,
      ellipsis: true,
    },
    {
      title: '图标',
      dataIndex: 'icon',
      key: 'icon',
      width: 100,
    },
    {
      title: '排序',
      dataIndex: 'sortOrder',
      key: 'sortOrder',
      width: 80,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: number) => (
        <Tag color={status === 1 ? 'success' : 'error'}>
          {status === 1 ? '启用' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {canAdd && (
            <Tooltip title="添加子权限">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined style={{ color: '#52c41a' }} />}
                onClick={() => {
                  setCurrentPermission({ parentId: record.id } as PermissionTreeNode);
                  setModalVisible(true);
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
                  setCurrentPermission(record);
                  setModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="确定要删除这个权限吗？"
              onConfirm={() => handleDelete(record.id!)}
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
      <Card
        title="权限管理"
        extra={
          <Space>
            {canAdd && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentPermission(undefined);
                  setModalVisible(true);
                }}
              >
                新增权限
              </Button>
            )}
            {canQuery && (
              <Button icon={<ReloadOutlined />} onClick={loadData}>
                刷新
              </Button>
            )}
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={treeData}
          loading={loading}
          rowKey="id"
          pagination={false}
          scroll={{ x: 1200 }}
          expandable={{
            defaultExpandAllRows: true,
          }}
        />
      </Card>

      <PermissionFormModal
        visible={modalVisible}
        permission={currentPermission}
        onCancel={() => {
          setModalVisible(false);
          setCurrentPermission(undefined);
        }}
        onSuccess={() => {
          setModalVisible(false);
          setCurrentPermission(undefined);
          loadData();
        }}
      />
    </div>
  );
};

export default PermissionPage;

