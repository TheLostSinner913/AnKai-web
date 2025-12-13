import { Modal, Descriptions, Tag, Divider, Image, Button, Space, Empty } from 'antd';
import { DownloadOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { getTaskDetail } from '@/services/workflow';
import request, { download } from '@/utils/request';

interface TaskDetailModalProps {
  visible: boolean;
  assigneeId: number | null;
  onClose: () => void;
}

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '待审批', color: 'processing' },
  1: { text: '已通过', color: 'success' },
  2: { text: '已拒绝', color: 'error' },
  3: { text: '已转交', color: 'orange' },
  4: { text: '被跳过', color: 'default' },
};

const instanceStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '进行中', color: 'processing' },
  1: { text: '已完成', color: 'success' },
  2: { text: '已拒绝', color: 'error' },
  3: { text: '已撤回', color: 'warning' },
  4: { text: '已取消', color: 'default' },
};

const getFileIcon = (ext: string) => {
  const lowerExt = ext?.toLowerCase() || '';
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(lowerExt)) {
    return <FileImageOutlined style={{ color: '#52c41a' }} />;
  }
  if (lowerExt === 'pdf') {
    return <FilePdfOutlined style={{ color: '#ff4d4f' }} />;
  }
  if (['doc', 'docx'].includes(lowerExt)) {
    return <FileWordOutlined style={{ color: '#1890ff' }} />;
  }
  if (['xls', 'xlsx'].includes(lowerExt)) {
    return <FileExcelOutlined style={{ color: '#52c41a' }} />;
  }
  return <FileOutlined />;
};

const isImageFile = (ext: string) => {
  const lowerExt = ext?.toLowerCase() || '';
  return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(lowerExt);
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ visible, assigneeId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && assigneeId) {
      loadDetail();
    }
  }, [visible, assigneeId]);

  const loadDetail = async () => {
    if (!assigneeId) return;
    setLoading(true);
    try {
      const res = await getTaskDetail(assigneeId);
      if (res.code === 200) {
        setDetail(res.data);
      }
    } catch (error) {
      console.error('加载任务详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const urlsToRevoke: string[] = [];

    const loadImages = async () => {
      const attachments = detail?.instance?.attachments || [];
      const images = attachments.filter((f: any) => isImageFile(f.fileExt));
      if (images.length === 0) return;

      const next: Record<string, string> = {};
      for (const f of images) {
        try {
          const resp = await request.get(f.filePath, { responseType: 'blob' });
          const rawBlob: Blob = resp.data;
          const blob = new Blob([rawBlob], { type: f.fileType || rawBlob.type || 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          next[String(f.id)] = url;
          urlsToRevoke.push(url);
        } catch (e) {
          // ignore
        }
      }

      if (!cancelled) {
        setImageUrls((prev) => {
          Object.values(prev).forEach((u) => window.URL.revokeObjectURL(u));
          return next;
        });
      } else {
        urlsToRevoke.forEach((u) => window.URL.revokeObjectURL(u));
      }
    };

    loadImages();

    return () => {
      cancelled = true;
      urlsToRevoke.forEach((u) => window.URL.revokeObjectURL(u));
    };
  }, [detail]);

  const handleDownload = async (filePath: string, fileName: string) => {
    await download(filePath, fileName);
  };

  const instance = detail?.instance;
  const task = detail?.task;
  const attachments = instance?.attachments || [];

  return (
    <Modal
      title="任务详情"
      open={visible}
      onCancel={onClose}
      footer={<Button onClick={onClose}>关闭</Button>}
      width={700}
      loading={loading}
    >
      {detail ? (
        <>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="流程标题" span={2}>
              {instance?.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="流程名称">
              {instance?.processName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="流程编号">
              {instance?.instanceNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发起人">
              {instance?.starterName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发起时间">
              {instance?.createTime ? dayjs(instance.createTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="流程状态">
              <Tag color={instanceStatusMap[instance?.status || 0]?.color}>
                {instanceStatusMap[instance?.status || 0]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="当前节点">
              {task?.nodeName || '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">审批信息</Divider>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="审批状态">
              <Tag color={statusMap[detail?.status || 0]?.color}>
                {statusMap[detail?.status || 0]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="接收时间">
              {detail?.createTime ? dayjs(detail.createTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
            {detail?.handleTime && (
              <>
                <Descriptions.Item label="处理时间">
                  {dayjs(detail.handleTime).format('YYYY-MM-DD HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="处理意见">
                  {detail?.comment || '-'}
                </Descriptions.Item>
              </>
            )}
          </Descriptions>

          <Divider orientation="left">附件 ({attachments.length})</Divider>
          {attachments.length === 0 ? (
            <Empty description="暂无附件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              {attachments.map((file: any) => (
                <div
                  key={file.id}
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: 8,
                    padding: 12,
                    width: 200,
                  }}
                >
                  {isImageFile(file.fileExt) ? (
                    <Image
                      src={imageUrls[String(file.id)]}
                      alt={file.fileName}
                      style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 4 }}
                      preview={{ mask: '预览' }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 120,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#fafafa',
                        borderRadius: 4,
                      }}
                    >
                      <span style={{ fontSize: 48 }}>{getFileIcon(file.fileExt)}</span>
                    </div>
                  )}
                  <div style={{ marginTop: 8 }}>
                    <div style={{ fontSize: 12, color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {file.fileName}
                    </div>
                    <Space style={{ marginTop: 4 }}>
                      <Button
                        type="link"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={() => handleDownload(file.filePath, file.fileName)}
                      >
                        下载
                      </Button>
                    </Space>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <Empty description="加载中..." />
      )}
    </Modal>
  );
};

export default TaskDetailModal;
