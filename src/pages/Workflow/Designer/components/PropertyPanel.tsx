import { Form, Input, Select, InputNumber, Divider, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { getAllRoles, type Role } from '@/services/role';
import { getAllUsers, type UserInfo } from '@/services/user';

interface PropertyPanelProps {
  node: any;
  edge: any;
  definition: API.WfProcessDefinition;
  onDefinitionChange: (def: API.WfProcessDefinition) => void;
  onNodePropertyChange: (nodeId: string, properties: any) => void;
  onEdgePropertyChange: (edgeId: string, properties: any) => void;
}

// 条件操作符选项
const operatorOptions = [
  { label: '等于 (=)', value: '==' },
  { label: '不等于 (≠)', value: '!=' },
  { label: '大于 (>)', value: '>' },
  { label: '大于等于 (≥)', value: '>=' },
  { label: '小于 (<)', value: '<' },
  { label: '小于等于 (≤)', value: '<=' },
  { label: '包含', value: 'contains' },
  { label: '为空', value: 'empty' },
  { label: '不为空', value: 'notEmpty' },
];

const approveTypeOptions = [
  { label: '或签（一人通过即可）', value: 1 },
  { label: '会签（所有人都要通过）', value: 2 },
  { label: '依次审批（按顺序）', value: 3 },
];

const assigneeTypeOptions = [
  { label: '指定人员', value: 1 },
  { label: '指定角色', value: 2 },
  { label: '部门+角色', value: 3 },
  { label: '发起人自选', value: 4 },
  { label: '上级主管', value: 5 },
  { label: '发起人本人', value: 6 },
];

const PropertyPanel: React.FC<PropertyPanelProps> = ({
  node,
  edge,
  definition,
  onDefinitionChange,
  onNodePropertyChange,
  onEdgePropertyChange,
}) => {
  const [form] = Form.useForm();
  const [defForm] = Form.useForm();
  const [edgeForm] = Form.useForm();
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [assigneeType, setAssigneeType] = useState<number | undefined>();

  // 加载角色和用户列表
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [rolesRes, usersRes] = await Promise.all([
          getAllRoles(),
          getAllUsers(),
        ]);
        if (rolesRes.code === 200) {
          setRoles(rolesRes.data || []);
        }
        if (usersRes.code === 200) {
          setUsers(usersRes.data || []);
        }
      } catch (error) {
        console.error('加载数据失败', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (node) {
      const values = {
        name: node.text?.value || node.text || '',
        ...node.properties,
      };
      form.setFieldsValue(values);
      setAssigneeType(values.assigneeType);
    }
  }, [node]);

  useEffect(() => {
    defForm.setFieldsValue(definition);
  }, [definition]);

  // 监听边选中
  useEffect(() => {
    if (edge) {
      edgeForm.setFieldsValue({
        conditionField: edge.properties?.conditionField || '',
        conditionOperator: edge.properties?.conditionOperator || '==',
        conditionValue: edge.properties?.conditionValue || '',
        isDefault: edge.properties?.isDefault || false,
        priority: edge.properties?.priority || 1,
      });
    }
  }, [edge]);

  const handleNodeFormChange = (changedValues: any, allValues: any) => {
    if (!node) return;

    // 切换审批人类型时更新状态
    if (changedValues.assigneeType !== undefined) {
      setAssigneeType(changedValues.assigneeType);
      // 清空之前选择的审批人
      form.setFieldsValue({ assigneeIds: [], roleIds: [] });
    }

    const { name, ...properties } = allValues;
    onNodePropertyChange(node.id, properties);
  };

  const handleDefFormChange = (changedValues: any) => {
    onDefinitionChange({ ...definition, ...changedValues });
  };

  // 处理边属性变化
  const handleEdgeFormChange = (changedValues: any, allValues: any) => {
    if (!edge) return;
    onEdgePropertyChange(edge.id, allValues);
  };

  const renderNodeProperties = () => {
    if (!node) return null;

    const nodeType = node.type;

    // 开始和结束节点只显示名称
    if (nodeType === 'start-node' || nodeType === 'end-node') {
      return (
        <Form.Item label="节点名称" name="name">
          <Input placeholder="请输入节点名称" />
        </Form.Item>
      );
    }

    // 审批节点
    if (nodeType === 'approve-node' || nodeType === 'handle-node') {
      return (
        <Spin spinning={loading}>
          <Form.Item label="节点名称" name="name">
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item label="审批方式" name="approveType">
            <Select options={approveTypeOptions} placeholder="请选择审批方式" />
          </Form.Item>
          <Form.Item label="审批人类型" name="assigneeType">
            <Select options={assigneeTypeOptions} placeholder="请选择审批人类型" />
          </Form.Item>

          {/* 指定人员 */}
          {assigneeType === 1 && (
            <Form.Item label="选择审批人" name="assigneeIds" rules={[{ required: true, message: '请选择审批人' }]}>
              <Select
                mode="multiple"
                placeholder="请选择审批人"
                options={users.map(u => ({ label: u.realName || u.username, value: u.id }))}
                filterOption={(input, option) =>
                  (option?.label as string)?.toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>
          )}

          {/* 指定角色 */}
          {assigneeType === 2 && (
            <Form.Item label="选择角色" name="roleIds" rules={[{ required: true, message: '请选择角色' }]}>
              <Select
                mode="multiple"
                placeholder="请选择角色"
                options={roles.map(r => ({ label: r.roleName, value: r.id }))}
              />
            </Form.Item>
          )}

          {/* 部门+角色：暂时只选择角色，部门待后续实现 */}
          {assigneeType === 3 && (
            <>
              <Form.Item label="选择部门" name="deptIds">
                <Select mode="multiple" placeholder="部门功能待实现" disabled />
              </Form.Item>
              <Form.Item label="选择角色" name="roleIds" rules={[{ required: true, message: '请选择角色' }]}>
                <Select
                  mode="multiple"
                  placeholder="请选择角色"
                  options={roles.map(r => ({ label: r.roleName, value: r.id }))}
                />
              </Form.Item>
            </>
          )}

          {/* 发起人自选/上级主管/发起人本人 不需要额外选择 */}
          {(assigneeType === 4 || assigneeType === 5 || assigneeType === 6) && (
            <div style={{ color: '#595959', fontSize: 12, marginBottom: 16 }}>
              {assigneeType === 4 && '发起流程时由发起人自己选择审批人'}
              {assigneeType === 5 && '系统自动获取发起人的上级主管'}
              {assigneeType === 6 && '发起人自己处理此节点'}
            </div>
          )}
        </Spin>
      );
    }

    // 抄送节点
    if (nodeType === 'copy-node') {
      return (
        <Spin spinning={loading}>
          <Form.Item label="节点名称" name="name">
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <Form.Item label="抄送人类型" name="assigneeType">
            <Select
              options={assigneeTypeOptions.filter(o => [1, 2, 5, 6].includes(o.value))}
              placeholder="请选择抄送人类型"
            />
          </Form.Item>

          {assigneeType === 1 && (
            <Form.Item label="选择抄送人" name="assigneeIds" rules={[{ required: true }]}>
              <Select
                mode="multiple"
                placeholder="请选择抄送人"
                options={users.map(u => ({ label: u.realName || u.username, value: u.id }))}
              />
            </Form.Item>
          )}

          {assigneeType === 2 && (
            <Form.Item label="选择角色" name="roleIds" rules={[{ required: true }]}>
              <Select
                mode="multiple"
                placeholder="请选择角色"
                options={roles.map(r => ({ label: r.roleName, value: r.id }))}
              />
            </Form.Item>
          )}
        </Spin>
      );
    }

    // 条件节点
    if (nodeType === 'condition-node') {
      return (
        <>
          <Form.Item label="节点名称" name="name">
            <Input placeholder="请输入节点名称" />
          </Form.Item>
          <div style={{ color: '#1890ff', fontSize: 12, marginBottom: 16, background: '#e6f7ff', padding: '8px 12px', borderRadius: 4 }}>
            💡 提示：条件配置在连线上。请点击从此节点出发的连线来设置条件表达式。
          </div>
        </>
      );
    }

    return null;
  };

  return (
    <div className="property-panel">
      <div className="panel-title">流程属性</div>
      <Form
        form={defForm}
        layout="vertical"
        className="property-form"
        onValuesChange={handleDefFormChange}
      >
        <Form.Item label="流程名称" name="name" rules={[{ required: true }]}>
          <Input placeholder="请输入流程名称" />
        </Form.Item>
        <Form.Item label="流程标识" name="processKey" rules={[{ required: true }]}>
          <Input placeholder="如：leave_apply" />
        </Form.Item>
        <Form.Item label="分类" name="category">
          <Input placeholder="如：人事、财务" />
        </Form.Item>
        <Form.Item label="描述" name="description">
          <Input.TextArea rows={2} placeholder="流程描述" />
        </Form.Item>
      </Form>

      {node && (
        <>
          <Divider />
          <div className="panel-title">节点属性</div>
          <Form
            form={form}
            layout="vertical"
            className="property-form"
            onValuesChange={handleNodeFormChange}
          >
            {renderNodeProperties()}
          </Form>
        </>
      )}

      {/* 边的属性配置 */}
      {edge && (
        <>
          <Divider />
          <div className="panel-title">连线条件配置</div>
          <Form
            form={edgeForm}
            layout="vertical"
            className="property-form"
            onValuesChange={handleEdgeFormChange}
          >
            <Form.Item
              label="是否默认分支"
              name="isDefault"
              valuePropName="checked"
              tooltip="默认分支：当其他条件都不满足时走此分支"
            >
              <Select
                options={[
                  { label: '否（需要满足条件）', value: false },
                  { label: '是（默认分支/else）', value: true },
                ]}
              />
            </Form.Item>

            <Form.Item
              noStyle
              shouldUpdate={(prevValues, currentValues) => prevValues.isDefault !== currentValues.isDefault}
            >
              {({ getFieldValue }) =>
                !getFieldValue('isDefault') && (
                  <>
                    <Form.Item
                      label="条件字段"
                      name="conditionField"
                      tooltip="表单中的字段名，如：days（请假天数）、amount（金额）"
                    >
                      <Input placeholder="如：days, amount" />
                    </Form.Item>
                    <Form.Item label="操作符" name="conditionOperator">
                      <Select options={operatorOptions} placeholder="请选择操作符" />
                    </Form.Item>
                    <Form.Item
                      label="条件值"
                      name="conditionValue"
                      tooltip="要比较的值，如：3、1000"
                    >
                      <Input placeholder="如：3, 1000" />
                    </Form.Item>
                  </>
                )
              }
            </Form.Item>

            <Form.Item
              label="优先级"
              name="priority"
              tooltip="多个条件时，优先级数字越小越先判断"
            >
              <InputNumber min={1} style={{ width: '100%' }} placeholder="数字越小优先级越高" />
            </Form.Item>

            <div style={{ color: '#595959', fontSize: 12, marginTop: 8 }}>
              示例：days &gt;= 3 表示请假天数大于等于3天
            </div>
          </Form>
        </>
      )}

      {!node && !edge && (
        <div className="empty-tip">点击节点或连线查看属性</div>
      )}
    </div>
  );
};

export default PropertyPanel;

