import { Modal, Form, Input, message } from 'antd';
import { useState } from 'react';
import { approveTask, rejectTask } from '@/services/workflow';

interface ApproveModalProps {
  visible: boolean;
  task: API.WfTaskAssignee | null;
  type: 'approve' | 'reject';
  onCancel: () => void;
  onSuccess: () => void;
}

const ApproveModal: React.FC<ApproveModalProps> = ({
  visible,
  task,
  type,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleOk = async () => {
    if (!task) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      if (type === 'approve') {
        await approveTask(task.id!, { comment: values.comment });
        message.success('审批通过');
      } else {
        await rejectTask(task.id!, { comment: values.comment });
        message.success('已拒绝');
      }

      form.resetFields();
      onSuccess();
    } catch (error) {
      // 表单验证失败或请求失败
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  return (
    <Modal
      title={type === 'approve' ? '审批通过' : '审批拒绝'}
      open={visible}
      onOk={handleOk}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText={type === 'approve' ? '确认通过' : '确认拒绝'}
      okButtonProps={{ danger: type === 'reject' }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="审批意见"
          name="comment"
          rules={[
            {
              required: type === 'reject',
              message: '拒绝时必须填写审批意见',
            },
          ]}
        >
          <Input.TextArea
            rows={4}
            placeholder={
              type === 'approve'
                ? '请输入审批意见（可选）'
                : '请输入拒绝原因'
            }
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ApproveModal;

