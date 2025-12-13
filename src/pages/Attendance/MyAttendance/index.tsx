import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, Col, Row, Statistic, Table, Tag, Modal, Form, Input, DatePicker, Select, message, Popconfirm, Space, Empty, Alert, Upload, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined, RollbackOutlined, CalendarOutlined, UploadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { history, useModel } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { pageMyLeave, getMyLeaveStats, submitLeave, withdrawLeave, checkLeaveWorkflow, updateAndResubmitLeave } from '@/services/attendance';
import { uploadFile } from '@/services/file';
import type { UploadFile } from 'antd/es/upload/interface';
import LeaveDetailModal from './components/LeaveDetailModal';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

// 请假类型
const leaveTypes = [
  { value: 'ANNUAL', label: '年假', color: 'blue' },
  { value: 'PERSONAL', label: '事假', color: 'orange' },
  { value: 'SICK', label: '病假', color: 'red' },
  { value: 'MARRIAGE', label: '婚假', color: 'pink' },
  { value: 'MATERNITY', label: '产假', color: 'purple' },
  { value: 'PATERNITY', label: '陪产假', color: 'cyan' },
  { value: 'BEREAVEMENT', label: '丧假', color: 'default' },
  { value: 'OTHER', label: '其他', color: 'default' },
];

// 状态
const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '审批中', color: 'processing' },
  2: { text: '已通过', color: 'success' },
  3: { text: '已拒绝', color: 'error' },
  4: { text: '已撤回', color: 'warning' },
  5: { text: '已取消', color: 'default' },
};

const MyAttendance: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.LeaveApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<any>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [workflowBound, setWorkflowBound] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [detailInstanceId, setDetailInstanceId] = useState<number | null>(null);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [attachmentIds, setAttachmentIds] = useState<number[]>([]);
  const [editingRecord, setEditingRecord] = useState<API.LeaveApplication | null>(null);

  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userRoles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  // 超级管理员拥有所有权限
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  // 权限检查
  const hasPermission = (code: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(code) || permissions.includes(`attendance:${code}`);
  };

  const canApply = hasPermission('leave:apply');
  const canWithdraw = hasPermission('leave:withdraw');

  useEffect(() => {
    checkWorkflow();
    loadData();
    loadStats();
  }, [page, pageSize]);

  // 监听 WebSocket 推送的工作流状态更新事件
  useEffect(() => {
    const handleWorkflowUpdate = async () => {
      console.log('[MyAttendance] 收到 workflow_status_update 事件，刷新数据');
      // 直接调用 API 刷新数据，避免闭包问题
      try {
        const res = await pageMyLeave({ page, size: pageSize });
        if (res.code === 200) {
          setData(res.data?.records || []);
          setTotal(res.data?.total || 0);
        }
        const statsRes = await getMyLeaveStats();
        if (statsRes.code === 200) {
          setStats(statsRes.data || {});
        }
      } catch (error) {
        console.error('刷新数据失败', error);
      }
    };
    window.addEventListener('workflow_status_update', handleWorkflowUpdate);
    return () => {
      window.removeEventListener('workflow_status_update', handleWorkflowUpdate);
    };
  }, [page, pageSize]);

  const checkWorkflow = async () => {
    try {
      const res = await checkLeaveWorkflow();
      if (res.code === 200) {
        setWorkflowBound(res.data.bound);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await pageMyLeave({ page, size: pageSize });
      if (res.code === 200) {
        setData(res.data?.records || []);
        setTotal(res.data?.total || 0);
      }
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getMyLeaveStats();
      if (res.code === 200) {
        setStats(res.data || {});
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const res = await uploadFile(file);
      if (res.code === 200) {
        setAttachmentIds(prev => [...prev, res.data.id]);
        return res.data;
      }
      message.error('上传失败');
      return false;
    } catch (error) {
      message.error('上传失败');
      return false;
    }
  };

  const handleSubmit = async (values: any) => {
    setSubmitting(true);
    try {
      const [startDate, endDate] = values.dateRange;
      const days = endDate.diff(startDate, 'day') + 1;
      
      const leaveData = {
        leaveType: values.leaveType,
        startDate: startDate.format('YYYY-MM-DD'),
        endDate: endDate.format('YYYY-MM-DD'),
        days,
        reason: values.reason,
        userName: currentUser?.realName || currentUser?.username || '未知用户',
        attachmentIds: attachmentIds,
      };

      let res;
      if (editingRecord) {
        // 编辑模式：更新并重新提交
        res = await updateAndResubmitLeave(editingRecord.id!, leaveData);
      } else {
        // 新建模式
        res = await submitLeave(leaveData);
      }
      
      if (res.code === 200) {
        message.success(editingRecord ? '请假申请已重新提交' : '请假申请提交成功');
        setModalVisible(false);
        form.resetFields();
        setFileList([]);
        setAttachmentIds([]);
        setEditingRecord(null);
        loadData();
        loadStats();
      } else {
        message.error(res.message || '提交失败');
      }
    } catch (error: any) {
      message.error(error.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: API.LeaveApplication) => {
    setEditingRecord(record);
    form.setFieldsValue({
      leaveType: record.leaveType,
      dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
      reason: record.reason,
    });
    setModalVisible(true);
  };

  const handleWithdraw = async (id: number) => {
    try {
      const res = await withdrawLeave(id);
      if (res.code === 200) {
        message.success('撤回成功');
        loadData();
      } else {
        message.error(res.message || '撤回失败');
      }
    } catch (error: any) {
      message.error(error.message || '撤回失败');
    }
  };

  const getLeaveTypeInfo = (type: string) => {
    return leaveTypes.find(t => t.value === type) || { label: type, color: 'default' };
  };

  const columns: ColumnsType<API.LeaveApplication> = [
    {
      title: '请假类型',
      dataIndex: 'leaveType',
      width: 100,
      render: (type) => {
        const info = getLeaveTypeInfo(type);
        return <Tag color={info.color}>{info.label}</Tag>;
      },
    },
    {
      title: '请假日期',
      dataIndex: 'startDate',
      width: 200,
      render: (_, record) => `${record.startDate} 至 ${record.endDate}`,
    },
    { title: '天数', dataIndex: 'days', width: 80, render: (days) => `${days}天` },
    { title: '请假原因', dataIndex: 'reason', ellipsis: true },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => {
        const info = statusMap[status] || { text: '未知', color: 'default' };
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    { title: '申请时间', dataIndex: 'createTime', width: 170 },
    {
      title: '操作',
      width: 100,
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title="查看">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setDetailInstanceId(record.instanceId!); setDetailModalVisible(true); }} />
          </Tooltip>
          {record.status === 4 && (
            <Tooltip title="编辑">
              <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
            </Tooltip>
          )}
          {canWithdraw && record.status === 1 && (
            <Popconfirm title="确定撤回该申请吗？" onConfirm={() => handleWithdraw(record.id!)}>
              <Tooltip title="撤回">
                <Button type="text" size="small" icon={<RollbackOutlined />} />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      {!workflowBound && (
        <Alert
          message="请假功能未启用"
          description="管理员尚未为请假模块配置审批流程，暂时无法申请请假。"
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="年假余额" value={stats.annualLeaveBalance || 0} suffix="天" valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月请假" value={stats.monthDays || 0} suffix="天" valueStyle={{ color: '#fa8c16' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本年累计" value={stats.totalDays || 0} suffix="天" valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="待审批" value={data.filter(d => d.status === 1).length} suffix="个" valueStyle={{ color: '#eb2f96' }} />
          </Card>
        </Col>
      </Row>

      {/* 请假列表 */}
      <Card
        title="我的请假记录"
        extra={canApply ? (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)} disabled={!workflowBound}>
            申请请假
          </Button>
        ) : null}
      >
        <Table
          columns={columns}
          dataSource={data}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => { setPage(p); setPageSize(ps); },
          }}
        />
      </Card>

      {/* 申请请假弹窗 */}
      <Modal
        title={editingRecord ? "编辑请假申请" : "申请请假"}
        open={modalVisible}
        onCancel={() => { setModalVisible(false); form.resetFields(); setEditingRecord(null); setFileList([]); setAttachmentIds([]); }}
        footer={null}
        width={500}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="leaveType" label="请假类型" rules={[{ required: true, message: '请选择请假类型' }]}>
            <Select placeholder="请选择请假类型" options={leaveTypes} />
          </Form.Item>
          <Form.Item name="dateRange" label="请假日期" rules={[{ required: true, message: '请选择请假日期' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reason" label="请假原因" rules={[{ required: true, message: '请输入请假原因' }]}>
            <TextArea rows={4} placeholder="请输入请假原因" maxLength={500} showCount />
          </Form.Item>
          <Form.Item label="附件">
            <Upload
              fileList={fileList}
              beforeUpload={async (file) => {
                const result = await handleUpload(file);
                if (result) {
                  setFileList(prev => [...prev, { uid: result.id.toString(), name: file.name, status: 'done' }]);
                }
                return false;
              }}
              onRemove={(file) => {
                setFileList(prev => prev.filter(f => f.uid !== file.uid));
                setAttachmentIds(prev => prev.filter(id => id.toString() !== file.uid));
              }}
            >
              <Button icon={<UploadOutlined />}>上传附件</Button>
            </Upload>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => { setModalVisible(false); form.resetFields(); setEditingRecord(null); setFileList([]); setAttachmentIds([]); }}>取消</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>{editingRecord ? '保存' : '提交申请'}</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <LeaveDetailModal
        visible={detailModalVisible}
        instanceId={detailInstanceId}
        onClose={() => setDetailModalVisible(false)}
      />
    </PageContainer>
  );
};

export default MyAttendance;

