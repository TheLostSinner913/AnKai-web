import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Button, message, Modal, Form, Input, Select, DatePicker, Tag, Space, Switch } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SendOutlined, UndoOutlined } from '@ant-design/icons';
import { useRef, useState } from 'react';
import { useModel } from '@umijs/max';
import dayjs from 'dayjs';
import {
  getAnnouncementPage,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  publishAnnouncement,
  withdrawAnnouncement,
  Announcement,
} from '@/services/announcement';

const { TextArea } = Input;

const AnnouncementPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Announcement | null>(null);
  const [form] = Form.useForm();
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;
  const userRoles = currentUser?.roles || [];
  const permissions = currentUser?.permissions || [];

  // 超级管理员拥有所有权限
  const isSuperAdmin = userRoles.includes('SUPER_ADMIN');

  // 权限检查（支持 announcement:add 和 system:announcement:add 两种格式）
  const hasPermission = (code: string) => {
    if (isSuperAdmin) return true;
    return permissions.includes(code) || permissions.includes(`system:${code}`);
  };

  const canAdd = hasPermission('announcement:add');
  const canEdit = hasPermission('announcement:edit');
  const canDelete = hasPermission('announcement:delete');
  const canPublish = hasPermission('announcement:publish');

  const typeOptions = [
    { label: '普通', value: 1, color: 'default' },
    { label: '重要', value: 2, color: 'warning' },
    { label: '紧急', value: 3, color: 'error' },
  ];

  const statusOptions = [
    { label: '草稿', value: 0, color: 'default' },
    { label: '已发布', value: 1, color: 'success' },
    { label: '已撤回', value: 2, color: 'warning' },
  ];

  const recentOptions = [
    { label: '全部', value: undefined },
    { label: '近3天', value: 3 },
    { label: '近1周', value: 7 },
    { label: '近1个月', value: 30 },
    { label: '近3个月', value: 90 },
    { label: '近半年', value: 180 },
  ];

  const columns: ProColumns<Announcement>[] = [
    { title: 'ID', dataIndex: 'id', width: 60, hideInSearch: true },
    { title: '标题', dataIndex: 'title', ellipsis: true, width: 200 },
    {
      title: '类型', dataIndex: 'announcementType', width: 80,
      valueEnum: { 1: '普通', 2: '重要', 3: '紧急' },
      render: (_, record) => {
        const opt = typeOptions.find(o => o.value === record.announcementType);
        return <Tag color={opt?.color}>{opt?.label}</Tag>;
      },
    },
    {
      title: '状态', dataIndex: 'status', width: 80,
      valueEnum: { 0: '草稿', 1: '已发布', 2: '已撤回' },
      render: (_, record) => {
        const opt = statusOptions.find(o => o.value === record.status);
        return <Tag color={opt?.color}>{opt?.label}</Tag>;
      },
    },
    {
      title: '是否过期', dataIndex: 'expireTime', width: 90, hideInSearch: true,
      render: (_, record) => {
        if (!record.expireTime) return '-';
        const expired = dayjs(record.expireTime).isBefore(dayjs());
        return <Tag color={expired ? 'red' : 'default'}>{expired ? '已过期' : '未过期'}</Tag>;
      },
    },
    {
      title: '时间范围', dataIndex: 'recentDays', hideInTable: true,
      valueType: 'select',
      fieldProps: {
        options: recentOptions,
        placeholder: '全部',
      },
    },
    { title: '置顶', dataIndex: 'isTop', width: 60, hideInSearch: true,
      render: (_, record) => record.isTop ? <Tag color="red">是</Tag> : '-',
    },
    { title: '浏览量', dataIndex: 'viewCount', width: 80, hideInSearch: true },
    { title: '发布时间', dataIndex: 'publishTime', width: 150, hideInSearch: true,
      render: (_, record) => record.publishTime ? dayjs(record.publishTime).format('YYYY-MM-DD HH:mm') : '-',
    },
    { title: '创建时间', dataIndex: 'createTime', width: 150, hideInSearch: true,
      render: (_, record) => dayjs(record.createTime).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作', valueType: 'option', width: 220, fixed: 'right',
      render: (_, record) => [
        record.status === 0 && canPublish && (
          <Button key="publish" type="link" size="small" icon={<SendOutlined />}
            onClick={() => handlePublish(record.id!)}>发布</Button>
        ),
        record.status === 1 && canPublish && (
          <Button key="withdraw" type="link" size="small" icon={<UndoOutlined />}
            onClick={() => handleWithdraw(record.id!)}>撤回</Button>
        ),
        record.status === 2 && canPublish && (
          <Button key="republish" type="link" size="small" icon={<SendOutlined />}
            onClick={() => handlePublish(record.id!)}>再次发布</Button>
        ),
        canEdit && (
          <Button key="edit" type="link" size="small" icon={<EditOutlined />}
            onClick={() => openEditModal(record)}>编辑</Button>
        ),
        canDelete && (
          <Button key="delete" type="link" size="small" danger icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id!)}>删除</Button>
        ),
      ].filter(Boolean),
    },
  ];

  const openAddModal = () => {
    setEditingRecord(null);
    form.resetFields();
    form.setFieldsValue({ announcementType: 1, targetType: 1, isTop: false });
    setModalVisible(true);
  };

  const openEditModal = (record: Announcement) => {
    setEditingRecord(record);
    form.setFieldsValue({
      ...record,
      isTop: record.isTop === 1,
      expireTime: record.expireTime ? dayjs(record.expireTime) : null,
    });
    setModalVisible(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    const data = {
      ...values,
      isTop: values.isTop ? 1 : 0,
      expireTime: values.expireTime?.format('YYYY-MM-DD HH:mm:ss'),
    };
    const res = editingRecord
      ? await updateAnnouncement(editingRecord.id!, data)
      : await addAnnouncement(data);
    if (res.code === 200) {
      message.success(editingRecord ? '更新成功' : '添加成功');
      setModalVisible(false);
      actionRef.current?.reload();
    } else {
      message.error(res.message || '操作失败');
    }
  };

  const handlePublish = async (id: number) => {
    Modal.confirm({
      title: '确认发布', content: '确定要发布这条公告吗？',
      onOk: async () => {
        const res = await publishAnnouncement(id);
        if (res.code === 200) { message.success('发布成功'); actionRef.current?.reload(); }
      },
    });
  };

  const handleWithdraw = async (id: number) => {
    Modal.confirm({
      title: '确认撤回', content: '确定要撤回这条公告吗？',
      onOk: async () => {
        const res = await withdrawAnnouncement(id);
        if (res.code === 200) { message.success('撤回成功'); actionRef.current?.reload(); }
      },
    });
  };

  const handleDelete = async (id: number) => {
    Modal.confirm({
      title: '确认删除', content: '确定要删除这条公告吗？',
      onOk: async () => {
        const res = await deleteAnnouncement(id);
        if (res.code === 200) { message.success('删除成功'); actionRef.current?.reload(); }
      },
    });
  };

  return (
    <PageContainer>
      <ProTable<Announcement>
        headerTitle="公告列表"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        scroll={{ x: 1200 }}
        request={async (params) => {
          const res = await getAnnouncementPage({
            current: params.current,
            size: params.pageSize,
            title: params.title,
            status: params.status,
            announcementType: params.announcementType,
            recentDays: params.recentDays,
          });
          return {
            data: res.data?.records || [],
            total: res.data?.total || 0,
            success: res.code === 200,
          };
        }}
        toolBarRender={() => [
          canAdd && (
            <Button key="add" type="primary" icon={<PlusOutlined />} onClick={openAddModal}>
              新增公告
            </Button>
          ),
        ].filter(Boolean)}
        search={{
          labelWidth: 80,
          defaultCollapsed: false,
          collapsed: false,
        }}
      />

      <Modal
        title={editingRecord ? '编辑公告' : '新增公告'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="请输入公告标题" maxLength={200} />
          </Form.Item>

          <Form.Item name="content" label="内容" rules={[{ required: true, message: '请输入内容' }]}>
            <TextArea placeholder="请输入公告内容" rows={6} />
          </Form.Item>

          <Space size="large">
            <Form.Item name="announcementType" label="类型">
              <Select style={{ width: 120 }}>
                {typeOptions.map(o => <Select.Option key={o.value} value={o.value}>{o.label}</Select.Option>)}
              </Select>
            </Form.Item>

            <Form.Item name="targetType" label="发布范围">
              <Select style={{ width: 120 }}>
                <Select.Option value={1}>全员</Select.Option>
                <Select.Option value={2}>指定用户</Select.Option>
              </Select>
            </Form.Item>

            <Form.Item name="isTop" label="置顶" valuePropName="checked">
              <Switch />
            </Form.Item>

            <Form.Item name="expireTime" label="过期时间">
              <DatePicker showTime format="YYYY-MM-DD HH:mm:ss" />
            </Form.Item>
          </Space>
        </Form>
      </Modal>
    </PageContainer>
  );
};

export default AnnouncementPage;
