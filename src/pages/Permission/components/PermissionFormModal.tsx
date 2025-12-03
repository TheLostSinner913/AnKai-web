import { Modal, Form, Input, InputNumber, Select, TreeSelect, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  createPermission,
  updatePermission,
  getPermissionTree,
  type Permission,
  type PermissionTreeNode,
} from '@/services/permission';

interface PermissionFormModalProps {
  visible: boolean;
  permission?: PermissionTreeNode;
  onCancel: () => void;
  onSuccess: () => void;
}

const PermissionFormModal: React.FC<PermissionFormModalProps> = ({
  visible,
  permission,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [treeData, setTreeData] = useState<PermissionTreeNode[]>([]);

  useEffect(() => {
    if (visible) {
      loadTreeData();
      if (permission?.id) {
        // 编辑模式
        form.setFieldsValue(permission);
      } else if (permission?.parentId) {
        // 添加子权限模式
        form.resetFields();
        form.setFieldsValue({
          parentId: permission.parentId,
          status: 1,
          visible: 1,
          sortOrder: 0,
        });
      } else {
        // 新增模式
        form.resetFields();
        form.setFieldsValue({
          parentId: 0,
          status: 1,
          visible: 1,
          sortOrder: 0,
        });
      }
    }
  }, [visible, permission, form]);

  const loadTreeData = async () => {
    try {
      const res = await getPermissionTree();
      if (res.code === 200) {
        setTreeData([
          { id: 0, permissionName: '根节点', children: res.data || [] } as PermissionTreeNode,
        ]);
      }
    } catch (error) {
      message.error('加载权限树失败');
    }
  };

  const convertToTreeSelectData = (nodes: PermissionTreeNode[]): any[] => {
    return nodes.map((node) => ({
      title: node.permissionName,
      value: node.id,
      children: node.children ? convertToTreeSelectData(node.children) : undefined,
    }));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = permission?.id ? { ...values, id: permission.id } : values;
      const res = permission?.id ? await updatePermission(data) : await createPermission(data);

      if (res.code === 200) {
        message.success(permission?.id ? '更新成功' : '创建成功');
        onSuccess();
      } else {
        message.error(res.message || (permission?.id ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={permission?.id ? '编辑权限' : '新增权限'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={700}
      destroyOnClose
    >
      <Form form={form} layout="vertical" autoComplete="off">
        <Form.Item name="parentId" label="父权限" rules={[{ required: true }]}>
          <TreeSelect
            treeData={convertToTreeSelectData(treeData)}
            placeholder="请选择父权限"
            treeDefaultExpandAll
          />
        </Form.Item>

        <Form.Item
          name="permissionName"
          label="权限名称"
          rules={[{ required: true, message: '请输入权限名称' }]}
        >
          <Input placeholder="请输入权限名称" />
        </Form.Item>

        <Form.Item
          name="permissionCode"
          label="权限编码"
          rules={[
            { required: true, message: '请输入权限编码' },
            { pattern: /^[a-z:]+$/, message: '权限编码只能包含小写字母和冒号' },
          ]}
        >
          <Input placeholder="请输入权限编码（如：system:user:list）" />
        </Form.Item>

        <Form.Item
          name="permissionType"
          label="权限类型"
          rules={[{ required: true, message: '请选择权限类型' }]}
        >
          <Select placeholder="请选择权限类型">
            <Select.Option value={1}>菜单</Select.Option>
            <Select.Option value={2}>按钮</Select.Option>
            <Select.Option value={3}>接口</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item name="path" label="路由路径">
          <Input placeholder="请输入路由路径（如：/system/user）" />
        </Form.Item>

        <Form.Item name="component" label="组件路径">
          <Input placeholder="请输入组件路径（如：system/User）" />
        </Form.Item>

        <Form.Item name="icon" label="图标">
          <Input placeholder="请输入图标名称（如：UserOutlined）" />
        </Form.Item>

        <Form.Item
          name="sortOrder"
          label="排序"
          rules={[{ required: true, message: '请输入排序' }]}
        >
          <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
        </Form.Item>

        <Form.Item
          name="status"
          label="状态"
          rules={[{ required: true, message: '请选择状态' }]}
        >
          <Select placeholder="请选择状态">
            <Select.Option value={1}>启用</Select.Option>
            <Select.Option value={0}>禁用</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="visible"
          label="是否显示"
          rules={[{ required: true, message: '请选择是否显示' }]}
        >
          <Select placeholder="请选择是否显示">
            <Select.Option value={1}>显示</Select.Option>
            <Select.Option value={0}>隐藏</Select.Option>
          </Select>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PermissionFormModal;

