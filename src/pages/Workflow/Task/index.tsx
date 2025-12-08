import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Space, Tag, Tabs } from 'antd';
import { useRef, useState } from 'react';
import { history } from '@umijs/max';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { pageMyPending, pageMyCompleted } from '@/services/workflow';
import ApproveModal from './components/ApproveModal';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待审批', color: 'processing' },
  1: { text: '已通过', color: 'success' },
  2: { text: '已拒绝', color: 'error' },
  3: { text: '已转交', color: 'orange' },
  4: { text: '被跳过', color: 'default' },
};

const TaskList: React.FC = () => {
  const pendingRef = useRef<ActionType>();
  const completedRef = useRef<ActionType>();
  const [activeTab, setActiveTab] = useState('pending');
  const [approveModalVisible, setApproveModalVisible] = useState(false);
  const [currentTask, setCurrentTask] = useState<API.WfTaskAssignee | null>(null);
  const [approveType, setApproveType] = useState<'approve' | 'reject'>('approve');

  const handleApprove = (record: API.WfTaskAssignee) => {
    setCurrentTask(record);
    setApproveType('approve');
    setApproveModalVisible(true);
  };

  const handleReject = (record: API.WfTaskAssignee) => {
    setCurrentTask(record);
    setApproveType('reject');
    setApproveModalVisible(true);
  };

  const handleApproveSuccess = () => {
    setApproveModalVisible(false);
    setCurrentTask(null);
    pendingRef.current?.reload();
    completedRef.current?.reload();
  };

  const pendingColumns: ProColumns<API.WfTaskAssignee>[] = [
    {
      title: '流程标题',
      dataIndex: ['instance', 'title'],
      ellipsis: true,
    },
    {
      title: '流程名称',
      dataIndex: ['instance', 'processName'],
      ellipsis: true,
    },
    {
      title: '发起人',
      dataIndex: ['instance', 'starterName'],
      width: 100,
    },
    {
      title: '当前节点',
      dataIndex: ['task', 'nodeName'],
      width: 120,
    },
    {
      title: '接收时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => history.push(`/workflow/task/${record.id}`)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => handleApprove(record)}
          >
            通过
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => handleReject(record)}
          >
            拒绝
          </Button>
        </Space>
      ),
    },
  ];

  const completedColumns: ProColumns<API.WfTaskAssignee>[] = [
    {
      title: '流程标题',
      dataIndex: ['instance', 'title'],
      ellipsis: true,
    },
    {
      title: '流程名称',
      dataIndex: ['instance', 'processName'],
      ellipsis: true,
    },
    {
      title: '发起人',
      dataIndex: ['instance', 'starterName'],
      width: 100,
    },
    {
      title: '处理节点',
      dataIndex: ['task', 'nodeName'],
      width: 120,
    },
    {
      title: '处理结果',
      dataIndex: 'status',
      width: 100,
      render: (_, record) => {
        const status = statusMap[record.status || 0];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '处理意见',
      dataIndex: 'comment',
      ellipsis: true,
    },
    {
      title: '处理时间',
      dataIndex: 'handleTime',
      valueType: 'dateTime',
      width: 180,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 80,
      render: (_, record) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => history.push(`/workflow/task/${record.id}`)}
        >
          查看
        </Button>
      ),
    },
  ];

  return (
    <PageContainer>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pending',
            label: '待办任务',
            children: (
              <ProTable<API.WfTaskAssignee>
                actionRef={pendingRef}
                rowKey="id"
                search={false}
                request={async (params) => {
                  const res = await pageMyPending({
                    page: params.current,
                    size: params.pageSize,
                  });
                  return {
                    data: res.data?.records || [],
                    total: res.data?.total || 0,
                    success: res.code === 200,
                  };
                }}
                columns={pendingColumns}
                pagination={{ defaultPageSize: 10 }}
              />
            ),
          },
          {
            key: 'completed',
            label: '已办任务',
            children: (
              <ProTable<API.WfTaskAssignee>
                actionRef={completedRef}
                rowKey="id"
                search={false}
                request={async (params) => {
                  const res = await pageMyCompleted({
                    page: params.current,
                    size: params.pageSize,
                  });
                  return {
                    data: res.data?.records || [],
                    total: res.data?.total || 0,
                    success: res.code === 200,
                  };
                }}
                columns={completedColumns}
                pagination={{ defaultPageSize: 10 }}
              />
            ),
          },
        ]}
      />

      <ApproveModal
        visible={approveModalVisible}
        task={currentTask}
        type={approveType}
        onCancel={() => setApproveModalVisible(false)}
        onSuccess={handleApproveSuccess}
      />
    </PageContainer>
  );
};

export default TaskList;

