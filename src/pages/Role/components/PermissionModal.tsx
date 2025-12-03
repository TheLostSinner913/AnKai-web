import {
  Drawer,
  Tree,
  message,
  Spin,
  Input,
  Button,
  Space,
  Tag,
  Card,
  Row,
  Col,
  Divider,
  Badge,
  Tooltip,
  Typography,
} from 'antd';
import {
  SearchOutlined,
  SaveOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  MenuOutlined,
  AppstoreOutlined,
  ApiOutlined,
  ExpandAltOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState, useMemo } from 'react';
import type { DataNode } from 'antd/es/tree';
import { getPermissionTree, type PermissionTreeNode } from '@/services/permission';
import { getRolePermissions, assignPermissions, type Role } from '@/services/role';

const { Text, Title } = Typography;

interface PermissionDrawerProps {
  visible: boolean;
  role?: Role;
  onCancel: () => void;
  onSuccess: () => void;
}

// 权限类型图标和颜色映射
const permissionTypeConfig: Record<number, { icon: React.ReactNode; color: string; label: string }> = {
  1: { icon: <MenuOutlined />, color: '#1890ff', label: '菜单' },
  2: { icon: <AppstoreOutlined />, color: '#52c41a', label: '按钮' },
  3: { icon: <ApiOutlined />, color: '#722ed1', label: '接口' },
};

const PermissionDrawer: React.FC<PermissionDrawerProps> = ({
  visible,
  role,
  onCancel,
  onSuccess,
}) => {
  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [rawPermissions, setRawPermissions] = useState<PermissionTreeNode[]>([]);
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);
  const [originalCheckedKeys, setOriginalCheckedKeys] = useState<React.Key[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
  const [autoExpandParent, setAutoExpandParent] = useState(true);

  useEffect(() => {
    if (visible && role) {
      loadData();
      setSearchValue('');
    }
  }, [visible, role]);

  const loadData = async () => {
    setLoading(true);
    try {
      const treeRes = await getPermissionTree();
      if (treeRes.code === 200) {
        const permissions = treeRes.data || [];
        setRawPermissions(permissions);
        const tree = convertToTreeData(permissions);
        setTreeData(tree);
        // 默认展开所有
        const allKeys = getAllKeys(permissions);
        setExpandedKeys(allKeys);
      }

      if (role?.id) {
        const permRes = await getRolePermissions(role.id);
        if (permRes.code === 200) {
          const keys = permRes.data || [];
          setCheckedKeys(keys);
          setOriginalCheckedKeys(keys);
        }
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const getAllKeys = (nodes: PermissionTreeNode[]): React.Key[] => {
    let keys: React.Key[] = [];
    nodes.forEach((node) => {
      keys.push(node.id!);
      if (node.children) {
        keys = keys.concat(getAllKeys(node.children));
      }
    });
    return keys;
  };

  const convertToTreeData = (nodes: PermissionTreeNode[]): DataNode[] => {
    return nodes.map((node) => {
      const typeConfig = permissionTypeConfig[node.permissionType || 1];
      return {
        title: (
          <Space size={4}>
            <span style={{ color: typeConfig.color }}>{typeConfig.icon}</span>
            <span>{node.permissionName}</span>
            <Tag color={typeConfig.color} style={{ fontSize: 10, padding: '0 4px', lineHeight: '16px' }}>
              {typeConfig.label}
            </Tag>
            {node.permissionCode && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                ({node.permissionCode})
              </Text>
            )}
          </Space>
        ),
        key: node.id!,
        children: node.children ? convertToTreeData(node.children) : undefined,
      };
    });
  };

  // 搜索过滤
  const filteredTreeData = useMemo(() => {
    if (!searchValue) return treeData;

    const filterTree = (nodes: PermissionTreeNode[]): PermissionTreeNode[] => {
      return nodes
        .map((node) => {
          const children = node.children ? filterTree(node.children) : [];
          const match =
            node.permissionName?.toLowerCase().includes(searchValue.toLowerCase()) ||
            node.permissionCode?.toLowerCase().includes(searchValue.toLowerCase());

          if (match || children.length > 0) {
            return { ...node, children: children.length > 0 ? children : node.children };
          }
          return null;
        })
        .filter(Boolean) as PermissionTreeNode[];
    };

    return convertToTreeData(filterTree(rawPermissions));
  }, [searchValue, rawPermissions, treeData]);

  // 统计变化
  const changes = useMemo(() => {
    const added = checkedKeys.filter((key) => !originalCheckedKeys.includes(key));
    const removed = originalCheckedKeys.filter((key) => !checkedKeys.includes(key));
    return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
  }, [checkedKeys, originalCheckedKeys]);

  const handleSubmit = async () => {
    if (!role?.id) return;

    setSaving(true);
    try {
      const res = await assignPermissions({
        roleId: role.id,
        permissionIds: checkedKeys as number[],
      });

      if (res.code === 200) {
        message.success('权限配置成功');
        onSuccess();
      } else {
        message.error(res.message || '权限配置失败');
      }
    } catch (error) {
      message.error('权限配置失败');
    } finally {
      setSaving(false);
    }
  };

  const handleExpandAll = () => {
    setExpandedKeys(getAllKeys(rawPermissions));
  };

  const handleCollapseAll = () => {
    setExpandedKeys([]);
  };

  const handleReset = () => {
    setCheckedKeys(originalCheckedKeys);
  };

  return (
    <Drawer
      title={
        <Space>
          <span>配置角色权限</span>
          <Tag color="blue">{role?.roleName}</Tag>
          {role?.roleCode && <Text type="secondary">({role.roleCode})</Text>}
        </Space>
      }
      placement="right"
      width={600}
      open={visible}
      onClose={onCancel}
      destroyOnClose
      extra={
        <Space>
          {changes.hasChanges && (
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          )}
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={saving}
            disabled={!changes.hasChanges}
          >
            保存
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        {/* 统计信息 */}
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text type="secondary">已选权限</Text>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                {checkedKeys.length}
              </Title>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text type="secondary">新增</Text>
              <Title level={4} style={{ margin: 0, color: '#52c41a' }}>
                +{changes.added.length}
              </Title>
            </Card>
          </Col>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text type="secondary">移除</Text>
              <Title level={4} style={{ margin: 0, color: '#ff4d4f' }}>
                -{changes.removed.length}
              </Title>
            </Card>
          </Col>
        </Row>

        {/* 工具栏 */}
        <Space style={{ marginBottom: 12, width: '100%' }} direction="vertical">
          <Input
            placeholder="搜索权限名称或编码..."
            prefix={<SearchOutlined />}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            allowClear
          />
          <Space>
            <Button size="small" icon={<ExpandAltOutlined />} onClick={handleExpandAll}>
              全部展开
            </Button>
            <Button size="small" icon={<CompressOutlined />} onClick={handleCollapseAll}>
              全部折叠
            </Button>
            <Divider type="vertical" />
            <Space size={4}>
              <Badge color="#1890ff" text="菜单" />
              <Badge color="#52c41a" text="按钮" />
              <Badge color="#722ed1" text="接口" />
            </Space>
          </Space>
        </Space>

        <Divider style={{ margin: '12px 0' }} />

        {/* 权限树 */}
        <div
          style={{
            maxHeight: 'calc(100vh - 380px)',
            overflow: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 12,
            background: '#fafafa',
          }}
        >
          <Tree
            checkable
            treeData={filteredTreeData}
            checkedKeys={checkedKeys}
            expandedKeys={expandedKeys}
            autoExpandParent={autoExpandParent}
            onExpand={(keys) => {
              setExpandedKeys(keys);
              setAutoExpandParent(false);
            }}
            onCheck={(checked) => {
              setCheckedKeys(checked as React.Key[]);
            }}
          />
        </div>
      </Spin>
    </Drawer>
  );
};

export default PermissionDrawer;

