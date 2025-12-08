import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Statistic, Table, Tag, Select, DatePicker, Input, Space, Button } from 'antd';
import { TeamOutlined, ClockCircleOutlined, CheckCircleOutlined, FieldTimeOutlined, DownloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Pie, Line } from '@ant-design/charts';
import { pageAllLeave, getAdminStats } from '@/services/attendance';

const { Search } = Input;

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

const statusMap: Record<number, { text: string; color: string }> = {
  0: { text: '草稿', color: 'default' },
  1: { text: '审批中', color: 'processing' },
  2: { text: '已通过', color: 'success' },
  3: { text: '已拒绝', color: 'error' },
  4: { text: '已撤回', color: 'warning' },
  5: { text: '已取消', color: 'default' },
};

const Management: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<API.LeaveApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [stats, setStats] = useState<any>({});
  const [filters, setFilters] = useState<any>({
    year: dayjs().year(),
    month: dayjs().month() + 1,
  });

  useEffect(() => {
    loadData();
    loadStats();
  }, [page, pageSize, filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await pageAllLeave({ page, size: pageSize, ...filters });
      if (res.code === 200) {
        setData(res.data?.records || []);
        setTotal(res.data?.total || 0);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await getAdminStats(filters.year, filters.month);
      if (res.code === 200) {
        setStats(res.data || {});
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getLeaveTypeInfo = (type: string) => {
    return leaveTypes.find(t => t.value === type) || { label: type, color: 'default' };
  };

  // 饼图数据
  const pieData = (stats.byType || []).map((item: any) => ({
    type: getLeaveTypeInfo(item.leave_type).label,
    value: Number(item.days) || 0,
  }));

  // 折线图数据
  const lineData = (stats.monthlyTrend || []).map((item: any) => ({
    month: `${item.month}月`,
    days: Number(item.days) || 0,
  }));

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: { type: 'outer', content: '{name} {percentage}' },
    interactions: [{ type: 'element-active' }],
  };

  const lineConfig = {
    data: lineData,
    xField: 'month',
    yField: 'days',
    smooth: true,
    point: { size: 4, shape: 'circle' },
    color: '#1890ff',
  };

  const columns: ColumnsType<API.LeaveApplication> = [
    { title: '姓名', dataIndex: 'userName', width: 100 },
    { title: '部门', dataIndex: 'deptName', width: 120 },
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
      width: 200,
      render: (_, record) => `${record.startDate} 至 ${record.endDate}`,
    },
    { title: '天数', dataIndex: 'days', width: 80, render: (days) => `${days}天` },
    { title: '原因', dataIndex: 'reason', ellipsis: true },
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
  ];

  return (
    <PageContainer>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="本月请假"
              value={stats.monthCount || 0}
              suffix="人次"
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="待审批"
              value={stats.pendingCount || 0}
              suffix="个"
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已审批"
              value={(stats.monthCount || 0) - (stats.pendingCount || 0)}
              suffix="个"
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="平均请假"
              value={stats.avgDays || 0}
              suffix="天/人"
              prefix={<FieldTimeOutlined />}
              valueStyle={{ color: '#eb2f96' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 图表区域 */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={12}>
          <Card title="请假类型分布" size="small">
            {pieData.length > 0 ? (
              <Pie {...pieConfig} height={250} />
            ) : (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="月度请假趋势" size="small">
            {lineData.length > 0 ? (
              <Line {...lineConfig} height={250} />
            ) : (
              <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                暂无数据
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* 请假明细 */}
      <Card
        title="请假明细"
        extra={
          <Space>
            <Select
              value={filters.year}
              style={{ width: 100 }}
              onChange={(v) => setFilters({ ...filters, year: v })}
              options={[2023, 2024, 2025].map(y => ({ value: y, label: `${y}年` }))}
            />
            <Select
              value={filters.month}
              style={{ width: 100 }}
              onChange={(v) => setFilters({ ...filters, month: v })}
              options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `${i + 1}月` }))}
            />
            <Select
              placeholder="请假类型"
              allowClear
              style={{ width: 120 }}
              onChange={(v) => setFilters({ ...filters, leaveType: v })}
              options={leaveTypes}
            />
            <Search
              placeholder="搜索姓名"
              allowClear
              style={{ width: 150 }}
              onSearch={(v) => setFilters({ ...filters, userName: v })}
            />
            <Button icon={<DownloadOutlined />}>导出</Button>
          </Space>
        }
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
    </PageContainer>
  );
};

export default Management;

