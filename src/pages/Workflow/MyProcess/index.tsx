import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag } from 'antd';
import { useRef } from 'react';
import { history } from '@umijs/max';
import { EyeOutlined, RollbackOutlined, CloseCircleOutlined, BellOutlined } from '@ant-design/icons';
import { pageMyStarted, withdrawProcess, cancelProcess, urgeProcess } from '@/services/workflow';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '进行中', color: 'processing' },
  1: { text: '已完成', color: 'success' },
  2: { text: '已拒绝', color: 'error' },
  3: { text: '已撤回', color: 'orange' },
  4: { text: '已取消', color: 'default' },
};

const resultMap: Record<number, { text: string; color: string }> = {
  1: { text: '通过', color: 'success' },
  2: { text: '拒绝', color: 'error' },
};

const MyProcessList: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const handleWithdraw = async (id: number) => {
    try {
      await withdrawProcess(id);
      message.success('撤回成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('撤回失败');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await cancelProcess(id, '用户取消');
      message.success('取消成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('取消失败');
    }
  };

  const handleUrge = async (id: number) => {
    try {
      await urgeProcess(id);
      message.success('催办成功');
    } catch (error) {
      message.error('催办失败');
    }
  };

  const columns: ProColumns<API.WfProcessInstance>[] = [
    {
      title: '流程编号',
      dataIndex: 'instanceNo',
      width: 180,
      ellipsis: true,
    },
    {
      title: '流程标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '流程名称',
      dataIndex: 'processName',
      width: 120,
    },
    {
      title: '当前节点',
      dataIndex: 'currentNodeName',
      width: 120,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        0: { text: '进行中', status: 'Processing' },
        1: { text: '已完成', status: 'Success' },
        2: { text: '已拒绝', status: 'Error' },
        3: { text: '已撤回', status: 'Warning' },
        4: { text: '已取消', status: 'Default' },
      },
      render: (_, record) => {
        const status = statusMap[record.status || 0];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '结果',
      dataIndex: 'result',
      width: 80,
      search: false,
      render: (_, record) => {
        if (!record.result) return '-';
        const result = resultMap[record.result];
        return <Tag color={result.color}>{result.text}</Tag>;
      },
    },
    {
      title: '发起时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 180,
      search: false,
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
            onClick={() => history.push(`/workflow/instance/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 0 && (
            <>
              <Popconfirm
                title="确定撤回该流程吗？"
                onConfirm={() => handleWithdraw(record.id!)}
              >
                <Button type="link" size="small" icon={<RollbackOutlined />}>
                  撤回
                </Button>
              </Popconfirm>
              <Button
                type="link"
                size="small"
                icon={<BellOutlined />}
                onClick={() => handleUrge(record.id!)}
              >
                催办
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.WfProcessInstance>
        headerTitle="我发起的流程"
        actionRef={actionRef}
        rowKey="id"
        request={async (params) => {
          const res = await pageMyStarted({
            page: params.current,
            size: params.pageSize,
            status: params.status,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
        columns={columns}
        pagination={{ defaultPageSize: 10 }}
      />
    </PageContainer>
  );
};

export default MyProcessList;

