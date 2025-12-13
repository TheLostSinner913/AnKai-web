import { PageContainer } from '@ant-design/pro-components';
import { Card, Table, Tag, Button, Modal, Form, Select, Switch, message, Space } from 'antd';
import { EditOutlined, LinkOutlined, DisconnectOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useModel } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import { getModuleBindings, saveModuleBinding } from '@/services/attendance';
import { getProcessDefinitionList } from '@/services/workflow';

// 预定义的业务模块
const predefinedModules = [
  { code: 'LEAVE', name: '请假审批', description: '员工请假申请审批流程' },
  { code: 'EXPENSE', name: '报销审批', description: '费用报销申请审批流程' },
  { code: 'PURCHASE', name: '采购审批', description: '采购申请审批流程' },
  { code: 'CONTRACT', name: '合同审批', description: '合同签署审批流程' },
];

const ModuleBinding: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.WfModuleBinding[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModule, setCurrentModule] = useState<API.WfModuleBinding | null>(null);
  const [form] = Form.useForm();
  const [processList, setProcessList] = useState<API.WfProcessDefinition[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userRoles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  // 超级管理员拥有所有权限
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  // 权限检查
  const hasPermission = (code: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(code) || permissions.includes(`workflow:${code}`);
  };

  const canEdit = hasPermission('module-binding:edit');

  useEffect(() => {
    loadData();
    loadProcessList();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getModuleBindings();
      if (res.code === 200) {
        // 合并预定义模块和已配置的绑定
        const bindings = res.data || [];
        const mergedData = predefinedModules.map(module => {
          const binding = bindings.find((b: API.WfModuleBinding) => b.moduleCode === module.code);
          return {
            moduleCode: module.code,
            moduleName: module.name,
            description: module.description,
            ...binding,
          };
        });
        setData(mergedData);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadProcessList = async () => {
    try {
      const res = await getProcessDefinitionList({ status: 1 }); // 只获取已发布的流程
      if (res.code === 200) {
        setProcessList(res.data || []);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleEdit = (record: API.WfModuleBinding) => {
    setCurrentModule(record);
    form.setFieldsValue({
      definitionId: record.definitionId,
      enabled: record.enabled === 1,
    });
    setModalVisible(true);
  };

  const handleSubmit = async (values: any) => {
    if (!currentModule) return;
    
    setSubmitting(true);
    try {
      const selectedProcess = processList.find(p => p.id === values.definitionId);
      const res = await saveModuleBinding({
        moduleCode: currentModule.moduleCode!,
        moduleName: currentModule.moduleName!,
        definitionId: values.definitionId,
        processKey: selectedProcess?.processKey,
        processName: selectedProcess?.name,
        enabled: values.enabled ? 1 : 0,
      });
      
      if (res.code === 200) {
        message.success('保存成功');
        setModalVisible(false);
        loadData();
      } else {
        message.error(res.message || '保存失败');
      }
    } catch (error: any) {
      message.error(error.message || '保存失败');
    } finally {
      setSubmitting(false);
    }
  };

  const columns: ColumnsType<API.WfModuleBinding & { description?: string }> = [
    { title: '模块标识', dataIndex: 'moduleCode', width: 120 },
    { title: '模块名称', dataIndex: 'moduleName', width: 120 },
    { title: '模块说明', dataIndex: 'description', ellipsis: true },
    {
      title: '绑定流程',
      dataIndex: 'processName',
      width: 200,
      render: (name, record) => (
        name ? (
          <Space>
            <LinkOutlined style={{ color: '#52c41a' }} />
            <span>{name}</span>
          </Space>
        ) : (
          <Space>
            <DisconnectOutlined style={{ color: '#999' }} />
            <span style={{ color: '#999' }}>未绑定</span>
          </Space>
        )
      ),
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (enabled, record) => (
        record.definitionId ? (
          <Tag color={enabled === 1 ? 'success' : 'default'}>
            {enabled === 1 ? '已启用' : '已禁用'}
          </Tag>
        ) : (
          <Tag color="default">未配置</Tag>
        )
      ),
    },
    {
      title: '操作',
      width: 100,
      render: (_, record) => canEdit ? (
        <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)}>
          配置
        </Button>
      ) : null,
    },
  ];

  return (
    <PageContainer>
      <Card>
        <Table columns={columns} dataSource={data} rowKey="moduleCode" loading={loading} pagination={false} />
      </Card>

      <Modal
        title={`配置 ${currentModule?.moduleName || ''} 审批流程`}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="definitionId" label="选择审批流程" rules={[{ required: true, message: '请选择审批流程' }]}>
            <Select
              placeholder="请选择审批流程"
              allowClear
              options={processList.map(p => ({ value: p.id, label: `${p.name} (${p.processKey})` }))}
            />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); }}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>保存</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default ModuleBinding;

