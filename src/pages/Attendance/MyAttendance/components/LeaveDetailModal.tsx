import { Modal, Descriptions, Tag, Divider, Image, Button, Space, Empty, Timeline } from 'antd';
import { DownloadOutlined, FileOutlined, FilePdfOutlined, FileWordOutlined, FileExcelOutlined, FileImageOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { getInstance } from '@/services/workflow';
import request, { download } from '@/utils/request';

interface LeaveDetailModalProps {
  visible: boolean;
  instanceId: number | null;
  onClose: () => void;
}

const leaveTypeMap: Record<string, { text: string; color: string }> = {
  ANNUAL: { text: '年假', color: 'blue' },
  PERSONAL: { text: '事假', color: 'orange' },
  SICK: { text: '病假', color: 'red' },
  MARRIAGE: { text: '婚假', color: 'pink' },
  MATERNITY: { text: '产假', color: 'purple' },
  PATERNITY: { text: '陪产假', color: 'cyan' },
  BEREAVEMENT: { text: '丧假', color: 'default' },
  OTHER: { text: '其他', color: 'default' },
};

const instanceStatusMap: Record<number, { text: string; color: string }> = {
  0: { text: '进行中', color: 'processing' },
  1: { text: '已完成', color: 'success' },
  2: { text: '已拒绝', color: 'error' },
  3: { text: '已撤回', color: 'warning' },
  4: { text: '已取消', color: 'default' },
};

const actionTypeMap: Record<number, { text: string; color: string }> = {
  1: { text: '发起', color: 'blue' },
  2: { text: '通过', color: 'green' },
  3: { text: '拒绝', color: 'red' },
  4: { text: '转交', color: 'purple' },
  5: { text: '退回', color: 'orange' },
  6: { text: '撤回', color: 'orange' },
  7: { text: '催办', color: 'geekblue' },
  8: { text: '评论', color: 'default' },
  9: { text: '取消', color: 'default' },
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

const LeaveDetailModal: React.FC<LeaveDetailModalProps> = ({ visible, instanceId, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && instanceId) {
      loadDetail();
    }
  }, [visible, instanceId]);

  const loadDetail = async () => {
    if (!instanceId) return;
    setLoading(true);
    try {
      const res = await getInstance(instanceId);
      if (res.code === 200) {
        setDetail(res.data);
      }
    } catch (error) {
      console.error('加载详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const urlsToRevoke: string[] = [];

    const loadImages = async () => {
      if (!detail) return;
      const attachments = detail?.attachments || [];
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

  const attachments = detail?.attachments || [];
  const records = detail?.records || [];
  
  // 解析表单数据
  let formData: any = {};
  try {
    if (detail?.formData) {
      formData = JSON.parse(detail.formData);
    }
  } catch (e) {
    console.error('解析表单数据失败:', e);
  }

  const leaveType = leaveTypeMap[formData.leaveType] || { text: formData.leaveType || '-', color: 'default' };

  return (
    <Modal
      title="请假详情"
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
              {detail.title || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="流程编号">
              {detail.instanceNo || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="流程状态">
              <Tag color={instanceStatusMap[detail.status || 0]?.color}>
                {instanceStatusMap[detail.status || 0]?.text}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="发起人">
              {detail.starterName || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="发起时间">
              {detail.createTime ? dayjs(detail.createTime).format('YYYY-MM-DD HH:mm') : '-'}
            </Descriptions.Item>
          </Descriptions>

          <Divider orientation="left">请假信息</Divider>
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="请假类型">
              <Tag color={leaveType.color}>{leaveType.text}</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="请假天数">
              {formData.days || '-'} 天
            </Descriptions.Item>
            <Descriptions.Item label="开始日期">
              {formData.startDate || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="结束日期">
              {formData.endDate || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="请假原因" span={2}>
              {formData.reason || '-'}
            </Descriptions.Item>
          </Descriptions>

          {records.length > 0 && (
            <>
              <Divider orientation="left">审批记录</Divider>
              <Timeline
                items={records.map((record: any) => ({
                  color: actionTypeMap?.[record.actionType || 0]?.color || 'blue',
                  children: (
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {(record.nodeName || '流程')} <Tag color={actionTypeMap?.[record.actionType || 0]?.color || 'default'}>
                          {record.actionName || actionTypeMap?.[record.actionType || 0]?.text || '未知'}
                        </Tag>
                      </div>
                      <div style={{ color: '#666', fontSize: 12 }}>
                        操作人：{record.operatorName || '系统'}
                        {record.operatorDept ? `（${record.operatorDept}）` : ''}
                        {record.comment ? ` | 意见：${record.comment}` : ' | 意见：无'}
                      </div>
                      <div style={{ color: '#999', fontSize: 12 }}>
                        {record.createTime ? dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') : ''}
                      </div>
                    </div>
                  ),
                }))}
              />
            </>
          )}

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

export default LeaveDetailModal;
