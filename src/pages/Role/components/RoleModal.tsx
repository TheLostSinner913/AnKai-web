import { Modal, Form, Input, InputNumber, Select, message } from 'antd';
import React, { useEffect } from 'react';
import { createRole, updateRole, type Role } from '@/services/role';

const { TextArea } = Input;

interface RoleModalProps {
  visible: boolean;
  role?: Role;
  onCancel: () => void;
  onSuccess: () => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ visible, role, onCancel, onSuccess }) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible) {
      if (role) {
        form.setFieldsValue(role);
      } else {
        form.resetFields();
        form.setFieldsValue({
          status: 1,
          sortOrder: 0,
          dataScope: 1,
        });
      }
    }
  }, [visible, role, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const data = role ? { ...values, id: role.id } : values;
      const res = role ? await updateRole(data) : await createRole(data);

      if (res.code === 200) {
        message.success(role ? '更新成功' : '创建成功');
        onSuccess();
      } else {
        message.error(res.message || (role ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('表单验证失败:', error);
    }
  };

  return (
    <Modal
      title={role ? '编辑角色' : '新增角色'}
      open={visible}
      onCancel={onCancel}
      onOk={handleSubmit}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
      >
        <Form.Item
          name="roleName"
          label="角色名称"
          rules={[
            { required: true, message: '请输入角色名称' },
            { min: 2, max: 50, message: '角色名称长度必须在2-50个字符之间' },
          ]}
        >
          <Input placeholder="请输入角色名称" />
        </Form.Item>

        <Form.Item
          name="roleCode"
          label="角色编码"
          rules={[
            { required: true, message: '请输入角色编码' },
            { pattern: /^[A-Z_]+$/, message: '角色编码只能包含大写字母和下划线' },
          ]}
        >
          <Input placeholder="请输入角色编码（如：ADMIN）" disabled={!!role} />
        </Form.Item>

        <Form.Item
          name="description"
          label="角色描述"
        >
          <TextArea rows={3} placeholder="请输入角色描述" />
        </Form.Item>

        <Form.Item
          name="dataScope"
          label="数据权限范围"
          rules={[{ required: true, message: '请选择数据权限范围' }]}
        >
          <Select placeholder="请选择数据权限范围">
            <Select.Option value={1}>全部</Select.Option>
            <Select.Option value={2}>本部门及下级</Select.Option>
            <Select.Option value={3}>本部门</Select.Option>
            <Select.Option value={4}>仅本人</Select.Option>
            <Select.Option value={5}>自定义</Select.Option>
          </Select>
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
      </Form>
    </Modal>
  );
};

export default RoleModal;

