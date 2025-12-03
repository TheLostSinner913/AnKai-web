import {
  Drawer,
  message,
  Spin,
  Card,
  Row,
  Col,
  Tag,
  Space,
  Button,
  Tree,
  Typography,
  Divider,
  Badge,
  Empty,
  Tooltip,
} from 'antd';
import {
  SaveOutlined,
  ReloadOutlined,
  CheckCircleFilled,
  TeamOutlined,
  SafetyOutlined,
  UserOutlined,
  CrownOutlined,
  MenuOutlined,
  AppstoreOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import React, { useEffect, useState, useMemo } from 'react';
import type { DataNode } from 'antd/es/tree';
import { getAllRoles, getRolePermissions, type Role } from '@/services/role';
import { getPermissionTree, type PermissionTreeNode } from '@/services/permission';
import { getUserRoleIds, assignUserRoles } from '@/services/user';

const { Text, Title } = Typography;

interface UserRoleDrawerProps {
  visible: boolean;
  user?: {
    id: number;
    username: string;
    realName?: string;
  };
  onCancel: () => void;
  onSuccess: () => void;
}

// 角色图标映射
const roleIconMap: Record<string, React.ReactNode> = {
  SUPER_ADMIN: <CrownOutlined style={{ color: '#faad14' }} />,
  ADMIN: <SafetyOutlined style={{ color: '#1890ff' }} />,
  DEPT_ADMIN: <TeamOutlined style={{ color: '#52c41a' }} />,
  USER: <UserOutlined style={{ color: '#722ed1' }} />,
  GUEST: <UserOutlined style={{ color: '#999' }} />,
};

// 角色颜色映射
const roleColorMap: Record<string, string> = {
  SUPER_ADMIN: 'gold',
  ADMIN: 'blue',
  DEPT_ADMIN: 'green',
  USER: 'purple',
  GUEST: 'default',
};

// 权限类型配置
const permissionTypeConfig: Record<number, { icon: React.ReactNode; color: string }> = {
  1: { icon: <MenuOutlined />, color: '#1890ff' },
  2: { icon: <AppstoreOutlined />, color: '#52c41a' },
  3: { icon: <ApiOutlined />, color: '#722ed1' },
};

const UserRoleDrawer: React.FC<UserRoleDrawerProps> = ({ visible, user, onCancel, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [checkedRoleIds, setCheckedRoleIds] = useState<number[]>([]);
  const [originalRoleIds, setOriginalRoleIds] = useState<number[]>([]);
  const [selectedRoleForPreview, setSelectedRoleForPreview] = useState<Role | null>(null);
  const [previewPermissions, setPreviewPermissions] = useState<DataNode[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [permissionTree, setPermissionTree] = useState<PermissionTreeNode[]>([]);

  useEffect(() => {
    if (visible && user) {
      loadData();
    }
  }, [visible, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载所有角色
      const rolesRes = await getAllRoles();
      if (rolesRes.code === 200) {
        setRoles(rolesRes.data || []);
      }

      // 加载权限树
      const treeRes = await getPermissionTree();
      if (treeRes.code === 200) {
        setPermissionTree(treeRes.data || []);
      }

      // 加载用户已有角色
      if (user?.id) {
        const userRolesRes = await getUserRoleIds(user.id);
        if (userRolesRes.code === 200) {
          const ids = userRolesRes.data || [];
          setCheckedRoleIds(ids);
          setOriginalRoleIds(ids);
        }
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载角色的权限预览
  const loadRolePermissions = async (role: Role) => {
    if (!role.id) return;

    setSelectedRoleForPreview(role);
    setLoadingPreview(true);

    try {
      const res = await getRolePermissions(role.id);
      if (res.code === 200) {
        const permIds = res.data || [];
        // 过滤权限树，只显示该角色拥有的权限
        const filteredTree = filterPermissionTree(permissionTree, permIds);
        setPreviewPermissions(convertToTreeData(filteredTree));
      }
    } catch (error) {
      message.error('加载权限预览失败');
    } finally {
      setLoadingPreview(false);
    }
  };

  // 过滤权限树
  const filterPermissionTree = (
    nodes: PermissionTreeNode[],
    permIds: number[]
  ): PermissionTreeNode[] => {
    return nodes
      .map((node) => {
        const children = node.children ? filterPermissionTree(node.children, permIds) : [];
        if (permIds.includes(node.id!) || children.length > 0) {
          return { ...node, children: children.length > 0 ? children : undefined };
        }
        return null;
      })
      .filter(Boolean) as PermissionTreeNode[];
  };

  // 转换为树形数据
  const convertToTreeData = (nodes: PermissionTreeNode[]): DataNode[] => {
    return nodes.map((node) => {
      const typeConfig = permissionTypeConfig[node.permissionType || 1];
      return {
        title: (
          <Space size={4}>
            <span style={{ color: typeConfig.color }}>{typeConfig.icon}</span>
            <span>{node.permissionName}</span>
          </Space>
        ),
        key: node.id!,
        children: node.children ? convertToTreeData(node.children) : undefined,
      };
    });
  };

  const handleRoleToggle = (roleId: number) => {
    if (checkedRoleIds.includes(roleId)) {
      setCheckedRoleIds(checkedRoleIds.filter((id) => id !== roleId));
    } else {
      setCheckedRoleIds([...checkedRoleIds, roleId]);
    }
  };

  // 统计变化
  const changes = useMemo(() => {
    const added = checkedRoleIds.filter((id) => !originalRoleIds.includes(id));
    const removed = originalRoleIds.filter((id) => !checkedRoleIds.includes(id));
    return { added, removed, hasChanges: added.length > 0 || removed.length > 0 };
  }, [checkedRoleIds, originalRoleIds]);

  const handleSubmit = async () => {
    if (!user?.id) return;

    setSaving(true);
    try {
      const res = await assignUserRoles(user.id, checkedRoleIds);

      if (res.code === 200) {
        message.success('角色分配成功');
        onSuccess();
      } else {
        message.error(res.message || '角色分配失败');
      }
    } catch (error) {
      message.error('角色分配失败');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setCheckedRoleIds(originalRoleIds);
  };

  return (
    <Drawer
      title={
        <Space>
          <UserOutlined />
          <span>分配角色</span>
          <Tag color="blue">{user?.realName || user?.username}</Tag>
        </Space>
      }
      placement="right"
      width={700}
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
        <Row gutter={16}>
          {/* 左侧：角色列表 */}
          <Col span={12}>
            <Title level={5} style={{ marginBottom: 12 }}>
              <TeamOutlined /> 选择角色
            </Title>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              点击角色卡片分配/取消，点击"预览"查看权限
            </Text>

            <div style={{ maxHeight: 'calc(100vh - 280px)', overflow: 'auto' }}>
              {roles.map((role) => {
                const isChecked = checkedRoleIds.includes(role.id!);
                const isAdded = changes.added.includes(role.id!);
                const isRemoved = changes.removed.includes(role.id!);

                return (
                  <Card
                    key={role.id}
                    size="small"
                    style={{
                      marginBottom: 8,
                      cursor: 'pointer',
                      border: isChecked ? '2px solid #1890ff' : '1px solid #f0f0f0',
                      background: isChecked ? '#e6f7ff' : '#fff',
                      transition: 'all 0.2s',
                    }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
                    >
                      <div
                        style={{ flex: 1, cursor: 'pointer' }}
                        onClick={() => handleRoleToggle(role.id!)}
                      >
                        <Space>
                          {isChecked && <CheckCircleFilled style={{ color: '#52c41a' }} />}
                          {roleIconMap[role.roleCode || ''] || <TeamOutlined />}
                          <Text strong>{role.roleName}</Text>
                          <Tag color={roleColorMap[role.roleCode || ''] || 'default'}>
                            {role.roleCode}
                          </Tag>
                          {isAdded && <Badge status="success" text="新增" />}
                          {isRemoved && <Badge status="error" text="移除" />}
                        </Space>
                        {role.description && (
                          <div style={{ marginTop: 4 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {role.description}
                            </Text>
                          </div>
                        )}
                      </div>
                      <Button
                        type="link"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadRolePermissions(role);
                        }}
                      >
                        预览权限
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Col>

          {/* 右侧：权限预览 */}
          <Col span={12}>
            <Title level={5} style={{ marginBottom: 12 }}>
              <SafetyOutlined /> 权限预览
            </Title>

            {selectedRoleForPreview ? (
              <>
                <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                  <Tag color={roleColorMap[selectedRoleForPreview.roleCode || ''] || 'default'}>
                    {selectedRoleForPreview.roleName}
                  </Tag>
                  拥有的权限
                </Text>

                <Spin spinning={loadingPreview}>
                  <div
                    style={{
                      maxHeight: 'calc(100vh - 320px)',
                      overflow: 'auto',
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                      padding: 12,
                      background: '#fafafa',
                    }}
                  >
                    {previewPermissions.length > 0 ? (
                      <Tree treeData={previewPermissions} defaultExpandAll selectable={false} />
                    ) : (
                      <Empty description="该角色暂无权限" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                    )}
                  </div>
                </Spin>
              </>
            ) : (
              <div
                style={{
                  height: 'calc(100vh - 320px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px dashed #d9d9d9',
                  borderRadius: 8,
                  background: '#fafafa',
                }}
              >
                <Empty description='点击角色的"预览权限"查看详情' image={Empty.PRESENTED_IMAGE_SIMPLE} />
              </div>
            )}
          </Col>
        </Row>

        <Divider />

        {/* 底部统计 */}
        <Row gutter={16}>
          <Col span={8}>
            <Card size="small" style={{ textAlign: 'center' }}>
              <Text type="secondary">已选角色</Text>
              <Title level={4} style={{ margin: 0, color: '#1890ff' }}>
                {checkedRoleIds.length}
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
      </Spin>
    </Drawer>
  );
};

export default UserRoleDrawer;

