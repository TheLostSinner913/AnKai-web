import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Popconfirm, Space, Tag } from 'antd';
import { useRef } from 'react';
import { history } from '@umijs/max';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, PlayCircleOutlined, StopOutlined } from '@ant-design/icons';
import { pageDefinitions, deleteDefinition, publishDefinition, disableDefinition, copyDefinition } from '@/services/workflow';

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '已发布', color: 'success' },
  2: { text: '已停用', color: 'error' },
};

const DefinitionList: React.FC = () => {
  const actionRef = useRef<ActionType>();

  const handlePublish = async (id: number) => {
    try {
      await publishDefinition(id);
      message.success('发布成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('发布失败');
    }
  };

  const handleDisable = async (id: number) => {
    try {
      await disableDefinition(id);
      message.success('停用成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('停用失败');
    }
  };

  const handleCopy = async (id: number) => {
    try {
      const res = await copyDefinition(id);
      if (res.code === 200 && res.data) {
        message.success('复制成功');
        history.push(`/workflow/designer/${res.data.id}`);
      }
    } catch (error) {
      message.error('复制失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDefinition(id);
      message.success('删除成功');
      actionRef.current?.reload();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns: ProColumns<API.WfProcessDefinition>[] = [
    {
      title: '流程名称',
      dataIndex: 'name',
      ellipsis: true,
    },
    {
      title: '流程标识',
      dataIndex: 'processKey',
      ellipsis: true,
    },
    {
      title: '分类',
      dataIndex: 'category',
      ellipsis: true,
    },
    {
      title: '版本',
      dataIndex: 'version',
      width: 80,
      search: false,
      render: (_, record) => `V${record.version}`,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      valueType: 'select',
      valueEnum: {
        0: { text: '草稿', status: 'Default' },
        1: { text: '已发布', status: 'Success' },
        2: { text: '已停用', status: 'Error' },
      },
      render: (_, record) => {
        const status = statusMap[record.status || 0];
        return <Tag color={status.color}>{status.text}</Tag>;
      },
    },
    {
      title: '创建时间',
      dataIndex: 'createTime',
      valueType: 'dateTime',
      width: 180,
      search: false,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 280,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => history.push(`/workflow/designer/${record.id}`)}
          >
            编辑
          </Button>
          {record.status === 0 && (
            <Button
              type="link"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handlePublish(record.id!)}
            >
              发布
            </Button>
          )}
          {record.status === 1 && (
            <Button
              type="link"
              size="small"
              danger
              icon={<StopOutlined />}
              onClick={() => handleDisable(record.id!)}
            >
              停用
            </Button>
          )}
          <Button
            type="link"
            size="small"
            icon={<CopyOutlined />}
            onClick={() => handleCopy(record.id!)}
          >
            复制
          </Button>
          <Popconfirm
            title="确定删除该流程定义吗？"
            onConfirm={() => handleDelete(record.id!)}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.WfProcessDefinition>
        headerTitle="流程定义列表"
        actionRef={actionRef}
        rowKey="id"
        toolBarRender={() => [
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => history.push('/workflow/designer')}
          >
            新建流程
          </Button>,
        ]}
        request={async (params) => {
          const res = await pageDefinitions({
            page: params.current,
            size: params.pageSize,
            name: params.name,
            category: params.category,
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

export default DefinitionList;

