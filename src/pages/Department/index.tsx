import { PlusOutlined, DeleteOutlined, EditOutlined, ReloadOutlined, TeamOutlined } from '@ant-design/icons';
import { Button, Card, message, Popconfirm, Space, Table, Tag, Tooltip, Input } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import {
  getDepartmentTree,
  deleteDepartment,
  type DepartmentTreeNode,
} from '@/services/department';
import DepartmentFormModal from './components/DepartmentFormModal';

const DepartmentPage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userRoles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  // 超级管理员拥有所有权限
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  // 权限检查
  const hasPermission = (code: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(code) || permissions.includes(`system:${code}`);
  };

  const canQuery = hasPermission('dept:query');
  const canAdd = hasPermission('dept:add');
  const canEdit = hasPermission('dept:edit');
  const canDelete = hasPermission('dept:delete');

  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<DepartmentTreeNode[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentTreeNode | undefined>(undefined);
  const [searchName, setSearchName] = useState('');

  useEffect(() => {
    if (canQuery) {
      loadData();
    }
  }, [canQuery]);

  const loadData = async () => {
    if (!canQuery) return;
    setLoading(true);
    try {
      const res = await getDepartmentTree({ departmentName: searchName || undefined });
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
      const res = await deleteDepartment(id);
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

  const columns: ColumnsType<DepartmentTreeNode> = [
    {
      title: '部门名称',
      dataIndex: 'departmentName',
      key: 'departmentName',
      width: 200,
    },
    {
      title: '部门编码',
      dataIndex: 'departmentCode',
      key: 'departmentCode',
      width: 150,
    },
    {
      title: '负责人',
      dataIndex: 'leader',
      key: 'leader',
      width: 100,
    },
    {
      title: '联系电话',
      dataIndex: 'phone',
      key: 'phone',
      width: 130,
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      width: 180,
      ellipsis: true,
    },
    {
      title: '人数',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 80,
      render: (count: number) => (
        <Space>
          <TeamOutlined style={{ color: '#1677ff' }} />
          <span>{count || 0}</span>
        </Space>
      ),
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
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          {canAdd && (
            <Tooltip title="添加子部门">
              <Button
                type="text"
                size="small"
                icon={<PlusOutlined style={{ color: '#52c41a' }} />}
                onClick={() => {
                  setCurrentDepartment({ parentId: record.id } as DepartmentTreeNode);
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
                  setCurrentDepartment(record);
                  setModalVisible(true);
                }}
              />
            </Tooltip>
          )}
          {canDelete && (
            <Popconfirm
              title="确定要删除这个部门吗？"
              description="删除后不可恢复，请确认部门下没有子部门和用户"
              onConfirm={() => handleDelete(record.id!)}
            >
              <Tooltip title="删除">
                <Button type="text" size="small" danger icon={<DeleteOutlined />} />
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
        title="部门管理"
        extra={
          <Space>
            <Input.Search
              placeholder="搜索部门名称"
              allowClear
              style={{ width: 200 }}
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              onSearch={loadData}
            />
            {canAdd && (
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setCurrentDepartment(undefined);
                  setModalVisible(true);
                }}
              >
                新增部门
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

      <DepartmentFormModal
        visible={modalVisible}
        department={currentDepartment}
        onCancel={() => {
          setModalVisible(false);
          setCurrentDepartment(undefined);
        }}
        onSuccess={() => {
          setModalVisible(false);
          setCurrentDepartment(undefined);
          loadData();
        }}
      />
    </div>
  );
};

export default DepartmentPage;

