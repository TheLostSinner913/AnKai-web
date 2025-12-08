import { Form, Input, InputNumber, Modal, Radio, TreeSelect, message } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  createDepartment,
  updateDepartment,
  getDepartmentOptions,
  type DepartmentTreeNode,
} from '@/services/department';

interface DepartmentFormModalProps {
  visible: boolean;
  department?: DepartmentTreeNode;
  onCancel: () => void;
  onSuccess: () => void;
}

const DepartmentFormModal: React.FC<DepartmentFormModalProps> = ({
  visible,
  department,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [treeData, setTreeData] = useState<any[]>([]);

  const isEdit = department?.id !== undefined && department?.parentId === undefined 
    ? true 
    : department?.id !== undefined;
  const isAddChild = department?.parentId !== undefined && department?.id === undefined;

  useEffect(() => {
    if (visible) {
      loadDepartmentOptions();
      if (isEdit && department) {
        form.setFieldsValue({
          ...department,
          status: department.status ?? 1,
        });
      } else if (isAddChild && department) {
        form.setFieldsValue({
          parentId: department.parentId,
          status: 1,
          sortOrder: 0,
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          parentId: 0,
          status: 1,
          sortOrder: 0,
        });
      }
    }
  }, [visible, department]);

  const loadDepartmentOptions = async () => {
    try {
      const res = await getDepartmentOptions();
      if (res.code === 200) {
        const options = convertToTreeSelectData(res.data || []);
        setTreeData([{ title: '根节点', value: 0, key: 0, children: options }]);
      }
    } catch (error) {
      console.error('加载部门选项失败', error);
    }
  };

  const convertToTreeSelectData = (nodes: DepartmentTreeNode[]): any[] => {
    return nodes.map((node) => ({
      title: node.departmentName,
      value: node.id,
      key: node.id,
      children: node.children ? convertToTreeSelectData(node.children) : [],
    }));
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      let res;
      if (isEdit) {
        res = await updateDepartment({ ...values, id: department!.id });
      } else {
        res = await createDepartment(values);
      }

      if (res.code === 200) {
        message.success(isEdit ? '更新成功' : '创建成功');
        onSuccess();
      } else {
        message.error(res.message || (isEdit ? '更新失败' : '创建失败'));
      }
    } catch (error) {
      console.error('提交失败', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={isEdit ? '编辑部门' : isAddChild ? '添加子部门' : '新增部门'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      destroyOnClose
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ parentId: 0, status: 1, sortOrder: 0 }}
      >
        <Form.Item
          name="parentId"
          label="上级部门"
          rules={[{ required: true, message: '请选择上级部门' }]}
        >
          <TreeSelect
            treeData={treeData}
            placeholder="请选择上级部门"
            treeDefaultExpandAll
            disabled={isAddChild}
          />
        </Form.Item>

        <Form.Item
          name="departmentName"
          label="部门名称"
          rules={[
            { required: true, message: '请输入部门名称' },
            { max: 50, message: '部门名称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入部门名称" />
        </Form.Item>

        <Form.Item
          name="departmentCode"
          label="部门编码"
          rules={[
            { required: true, message: '请输入部门编码' },
            { max: 50, message: '部门编码不能超过50个字符' },
            { pattern: /^[A-Z_]+$/, message: '部门编码只能包含大写字母和下划线' },
          ]}
        >
          <Input placeholder="请输入部门编码（如：TECH_DEPT）" disabled={isEdit} />
        </Form.Item>

        <Form.Item name="leader" label="负责人">
          <Input placeholder="请输入负责人" />
        </Form.Item>

        <Form.Item name="phone" label="联系电话">
          <Input placeholder="请输入联系电话" />
        </Form.Item>

        <Form.Item name="email" label="邮箱">
          <Input placeholder="请输入邮箱" />
        </Form.Item>

        <Form.Item name="sortOrder" label="排序">
          <InputNumber min={0} style={{ width: '100%' }} placeholder="数字越小越靠前" />
        </Form.Item>

        <Form.Item name="status" label="状态">
          <Radio.Group>
            <Radio value={1}>启用</Radio>
            <Radio value={0}>禁用</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DepartmentFormModal;

