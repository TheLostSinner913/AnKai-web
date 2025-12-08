import { ModalForm, ProFormSelect, ProFormText, ProFormTextArea, ProFormTreeSelect } from '@ant-design/pro-components';
import { message, Alert } from 'antd';
import React, { useState, useEffect } from 'react';
import { addUser, updateUser } from '@/services/user';
import { getDepartmentOptions, type DepartmentTreeNode } from '@/services/department';
import type { UserType } from '../index';

interface UserFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: UserType;
  onFinish: () => void;
}

// 转换部门选项为 TreeSelect 格式
const convertToTreeData = (options: DepartmentTreeNode[]): any[] => {
  return options.map((item) => ({
    title: item.departmentName,
    value: item.id,
    children: item.children && item.children.length > 0 ? convertToTreeData(item.children) : undefined,
  }));
};

const UserForm: React.FC<UserFormProps> = ({
  open,
  onOpenChange,
  initialValues,
  onFinish,
}) => {
  const isEdit = !!initialValues?.id;
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<any[]>([]);

  // 加载部门选项
  useEffect(() => {
    if (open) {
      getDepartmentOptions().then((res) => {
        if (res.code === 200 && res.data) {
          setDepartmentOptions(convertToTreeData(res.data));
        }
      });
    }
  }, [open]);

  return (
    <ModalForm
      title={isEdit ? '编辑用户' : '新建用户'}
      open={open}
      onOpenChange={onOpenChange}
      modalProps={{
        destroyOnClose: true,
        onCancel: () => onOpenChange(false),
      }}
      initialValues={initialValues}
      onFinish={async (values) => {
        try {
          console.log('表单提交数据:', values);

          // 处理密码字段
          const submitData = { ...values };

          if (isEdit) {
            // 编辑模式：如果密码为空，则不传递密码字段
            if (!submitData.password || submitData.password.trim() === '') {
              delete submitData.password;
            }
            submitData.id = initialValues.id;
          }

          console.log('最终提交数据:', submitData);

          let response;
          if (isEdit) {
            response = await updateUser(submitData);
          } else {
            response = await addUser(submitData);
          }

          if (response.code === 200) {
            message.success(isEdit ? '更新成功' : '创建成功');
            setPasswordChanged(false); // 重置密码修改状态
            onFinish();
            return true;
          } else {
            message.error(response.message || (isEdit ? '更新失败' : '创建失败'));
            return false;
          }
        } catch (error: any) {
          console.error('提交失败:', error);
          message.error(error.message || (isEdit ? '更新失败' : '创建失败'));
          return false;
        }
      }}
      width={600}
    >
      <ProFormText
        name="username"
        label="用户名"
        placeholder="请输入用户名"
        rules={[
          { required: true, message: '请输入用户名' },
          { min: 2, max: 20, message: '用户名长度必须在2-20个字符之间' },
        ]}
        disabled={isEdit} // 编辑时用户名不可修改
      />

      {/* 编辑模式下的密码提示 */}
      {isEdit && (
        <Alert
          message="密码说明"
          description="编辑用户时，密码字段为空表示不修改密码。如需修改密码，请输入新密码。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      <ProFormText.Password
        name="password"
        label={isEdit ? "新密码（可选）" : "密码"}
        placeholder={isEdit ? "留空则不修改密码" : "请输入密码"}
        rules={[
          { required: !isEdit, message: '请输入密码' },
          {
            min: 6,
            max: 100,
            message: '密码长度必须在6-100个字符之间',
            // 编辑模式下，如果输入了密码才验证长度
            validator: (_, value) => {
              if (isEdit && (!value || value.trim() === '')) {
                return Promise.resolve(); // 编辑模式下允许空密码
              }
              if (value && (value.length < 6 || value.length > 100)) {
                return Promise.reject(new Error('密码长度必须在6-100个字符之间'));
              }
              return Promise.resolve();
            }
          },
        ]}
        extra={isEdit ? '留空则不修改密码' : '密码将自动加密存储'}
        onChange={(e) => {
          if (isEdit) {
            setPasswordChanged(!!e.target.value);
          }
        }}
      />

      <ProFormText
        name="realName"
        label="真实姓名"
        placeholder="请输入真实姓名"
        rules={[{ max: 50, message: '真实姓名长度不能超过50个字符' }]}
      />

      <ProFormText
        name="email"
        label="邮箱"
        placeholder="请输入邮箱"
        rules={[
          { type: 'email', message: '请输入正确的邮箱格式' },
          { max: 100, message: '邮箱长度不能超过100个字符' },
        ]}
      />

      <ProFormText
        name="phone"
        label="手机号"
        placeholder="请输入手机号"
        rules={[
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式' },
        ]}
      />

      <ProFormTreeSelect
        name="departmentId"
        label="所属部门"
        placeholder="请选择所属部门"
        allowClear
        fieldProps={{
          treeData: departmentOptions,
          showSearch: true,
          treeNodeFilterProp: 'title',
          dropdownStyle: { maxHeight: 400, overflow: 'auto' },
        }}
      />

      <ProFormText
        name="position"
        label="职位"
        placeholder="请输入职位"
        rules={[{ max: 50, message: '职位长度不能超过50个字符' }]}
      />

      <ProFormSelect
        name="status"
        label="状态"
        placeholder="请选择状态"
        options={[
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ]}
        rules={[{ required: true, message: '请选择状态' }]}
        initialValue={1}
      />

      <ProFormTextArea
        name="remark"
        label="备注"
        placeholder="请输入备注"
        fieldProps={{
          maxLength: 500,
          rows: 3,
          showCount: true,
        }}
      />
    </ModalForm>
  );
};

export default UserForm;
