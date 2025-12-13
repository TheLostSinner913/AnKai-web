import { useModel } from '@umijs/max';
import {
  Card,
  Col,
  Row,
  Typography,
  Calendar,
  Badge,
  List,
  Tag,
  Button,
  Modal,
  Form,
  Input,
  DatePicker,
  TimePicker,
  Select,
  Checkbox,
  Empty,
  message,
  Spin,
  Statistic,
  Divider,
  Avatar,
  Tooltip,
} from 'antd';
import {
  UserOutlined,
  CheckSquareOutlined,
  BellOutlined,
  MailOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CloudOutlined,
  CalendarOutlined,
  SunOutlined,
  ClockCircleOutlined,
  NotificationOutlined,
  EyeInvisibleOutlined,
  CheckOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import dayjs, { Dayjs } from 'dayjs';
import { getDashboardStats, getGreeting, getWeather } from '@/services/dashboard';
import {
  getTodosByDate,
  getTodoDatesInMonth,
  addTodo,
  updateTodo,
  deleteTodo,
  completeTodo,
  ignoreTodo,
  unignoreTodo,
  Todo,
} from '@/services/todo';
import { getVisibleAnnouncements, markAnnouncementAsRead, Announcement } from '@/services/announcement';
import { pageMyPending } from '@/services/workflow';
import { history } from '@umijs/max';
import styles from './index.less';
import { wsClient, WebSocketEventData } from '@/utils/websocket';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const HomePage: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  // 状态
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState<any>({});
  const [stats, setStats] = useState<any>({});
  const [weather, setWeather] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [todoDates, setTodoDates] = useState<string[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementDetailVisible, setAnnouncementDetailVisible] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [workflowTasks, setWorkflowTasks] = useState<any[]>([]);
  const [todoModalVisible, setTodoModalVisible] = useState(false);
  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [form] = Form.useForm();

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  // 选中日期变化时加载待办
  useEffect(() => {
    loadTodos(selectedDate);
  }, [selectedDate]);

  // 月份变化时加载日期标记
  useEffect(() => {
    loadTodoDates(selectedDate.year(), selectedDate.month() + 1);
  }, [selectedDate.year(), selectedDate.month()]);

  const openAnnouncement = async (item: Announcement) => {
    setSelectedAnnouncement(item);
    setAnnouncementDetailVisible(true);
  };

  // WebSocket 推送时自动刷新首页数据
  useEffect(() => {
    const handler = (data: WebSocketEventData) => {
      if (data.type === 'new_announcement') {
        // 新公告：刷新统计和首页公告列表
        loadData();
      }
      if (data.type === 'new_todo') {
        // 新待办：刷新统计、当日待办和日历标记
        loadData();
        loadTodos(selectedDate);
        loadTodoDates(selectedDate.year(), selectedDate.month() + 1);
      }
    };

    wsClient.on('new_announcement', handler);
    wsClient.on('new_todo', handler);

    return () => {
      wsClient.off('new_announcement', handler);
      wsClient.off('new_todo', handler);
    };
  }, [selectedDate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [greetingRes, statsRes, announcementRes] = await Promise.all([
        getGreeting(),
        getDashboardStats(),
        getVisibleAnnouncements(5),
      ]);

      if (greetingRes.code === 200) setGreeting(greetingRes.data);
      if (statsRes.code === 200) setStats(statsRes.data);
      if (announcementRes.code === 200) setAnnouncements(announcementRes.data || []);

      // 加载工作流待办任务
      loadWorkflowTasks();
      
      // 加载天气（使用免费API）
      loadWeather();
    } catch (error) {
      console.error('加载数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWeather = async () => {
    try {
      const res = await getWeather();
      if (res.code === 200 && res.data) {
        setWeather({
          city: res.data.city,
          temp: res.data.temp,
          desc: res.data.desc,
          humidity: res.data.humidity,
          icon: res.data.icon,
        });
      }
    } catch (error) {
      console.error('获取天气失败:', error);
      // 失败时使用默认值
      setWeather({ city: '未知', temp: 20, desc: '晴', humidity: 50 });
    }
  };

  const loadTodoDates = async (year: number, month: number) => {
    try {
      const res = await getTodoDatesInMonth(year, month);
      if (res.code === 200) {
        setTodoDates(res.data || []);
      }
    } catch (error) {
      console.error('加载待办日期失败:', error);
    }
  };

  const loadTodos = async (date: Dayjs) => {
    try {
      const res = await getTodosByDate(date.format('YYYY-MM-DD'));
      if (res.code === 200) {
        setTodos(res.data || []);
      }
    } catch (error) {
      console.error('加载待办失败:', error);
    }
  };

  const loadWorkflowTasks = async () => {
    try {
      const res = await pageMyPending({ page: 1, size: 5 });
      if (res.code === 200) {
        setWorkflowTasks(res.data?.records || []);
      }
    } catch (error) {
      console.error('加载工作流待办失败:', error);
    }
  };

  // 日历单元格渲染
  const dateCellRender = (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    const hasTodo = todoDates.includes(dateStr);
    if (hasTodo) {
      return (
        <div style={{ position: 'absolute', bottom: 2, right: 2 }}>
          <Badge status="processing" />
        </div>
      );
    }
    return null;
  };

  // 处理日期选择
  const onDateSelect = (date: Dayjs) => {
    setSelectedDate(date);
  };

  // 打开新增待办弹窗
  const openAddTodoModal = () => {
    setEditingTodo(null);
    form.resetFields();
    form.setFieldsValue({
      todoDate: selectedDate,
      priority: 2,
      color: '#1890ff',
    });
    setTodoModalVisible(true);
  };

  // 打开编辑待办弹窗
  const openEditTodoModal = (todo: Todo) => {
    setEditingTodo(todo);
    form.setFieldsValue({
      ...todo,
      todoDate: dayjs(todo.todoDate),
      startTime: todo.startTime ? dayjs(todo.startTime, 'HH:mm') : null,
      endTime: todo.endTime ? dayjs(todo.endTime, 'HH:mm') : null,
    });
    setTodoModalVisible(true);
  };

  // 提交待办
  const handleTodoSubmit = async () => {
    try {
      const values = await form.validateFields();
      const todoData: Todo = {
        ...values,
        todoDate: values.todoDate.format('YYYY-MM-DD'),
        startTime: values.startTime?.format('HH:mm') || null,
        endTime: values.endTime?.format('HH:mm') || null,
      };

      let res;
      if (editingTodo) {
        res = await updateTodo(editingTodo.id!, todoData);
      } else {
        res = await addTodo(todoData);
      }

      if (res.code === 200) {
        message.success(editingTodo ? '更新成功' : '添加成功');
        setTodoModalVisible(false);
        loadTodos(selectedDate);
        loadTodoDates(selectedDate.year(), selectedDate.month() + 1);
        loadData(); // 刷新统计
      } else {
        message.error(res.message || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
    }
  };

  // 删除待办
  const handleDeleteTodo = async (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个待办事项吗？',
      onOk: async () => {
        const res = await deleteTodo(id);
        if (res.code === 200) {
          message.success('删除成功');
          loadTodos(selectedDate);
          loadTodoDates(selectedDate.year(), selectedDate.month() + 1);
          loadData();
        }
      },
    });
  };

  // 完成待办
  const handleCompleteTodo = async (id: number) => {
    const res = await completeTodo(id);
    if (res.code === 200) {
      message.success('已完成');
      loadTodos(selectedDate);
      loadData();
    }
  };

  // 忽略待办
  const handleIgnoreTodo = async (id: number) => {
    const res = await ignoreTodo(id);
    if (res.code === 200) {
      message.success('已忽略');
      loadTodos(selectedDate);
      loadData();
    }
  };

  // 取消忽略待办
  const handleUnignoreTodo = async (id: number) => {
    const res = await unignoreTodo(id);
    if (res.code === 200) {
      message.success('已取消忽略');
      loadTodos(selectedDate);
      loadData();
    }
  };

  // 优先级颜色
  const priorityColors: Record<number, string> = {
    1: 'default',
    2: 'blue',
    3: 'red',
  };
  const priorityLabels: Record<number, string> = {
    1: '低',
    2: '中',
    3: '高',
  };

  // 状态标签
  const statusLabels: Record<number, { text: string; color: string }> = {
    0: { text: '待办', color: 'orange' },
    1: { text: '进行中', color: 'processing' },
    2: { text: '已完成', color: 'success' },
    3: { text: '已取消', color: 'default' },
    4: { text: '已忽略', color: 'default' },
  };

  // 公告类型
  const announcementTypeLabels: Record<number, { text: string; color: string }> = {
    1: { text: '普通', color: 'default' },
    2: { text: '重要', color: 'warning' },
    3: { text: '紧急', color: 'error' },
  };


  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* 欢迎语区域 */}
      <div className={styles.greetingCard}>
        <Row align="middle" justify="space-between" wrap={false}>
          <Col flex="auto">
            <div className={styles.greetingMain}>
              <Avatar size={56} icon={<UserOutlined />} className={styles.avatar} />
              <div className={styles.greetingText}>
                <Title level={3} className={styles.greetingTitle}>
                  {greeting.timeGreeting || '你好'}，{currentUser?.realName || currentUser?.username || '用户'}！
                </Title>
                <div className={styles.greetingMeta}>
                  <CalendarOutlined style={{ marginRight: 6 }} />
                  <span>{greeting.date || dayjs().format('YYYY年MM月DD日')} {greeting.weekday || ''}</span>
                  {greeting.holiday && (
                    <Tag color="red" style={{ marginLeft: 12 }}>{greeting.holiday}</Tag>
                  )}
                </div>
              </div>
            </div>
            {/* 名人名言 */}
            {greeting.quote && (
              <div className={styles.quoteSection}>
                <div className={styles.quoteText}>"{greeting.quote}"</div>
                <div className={styles.quoteAuthor}>—— {greeting.quoteAuthor}</div>
              </div>
            )}
          </Col>
          <Col>
            <div className={styles.weatherInfo}>
              {weather ? (
                <>
                  <div className={styles.weatherCity}>{weather.city}</div>
                  <div className={styles.weatherMain}>
                    <SunOutlined className={styles.weatherIcon} />
                    <span className={styles.weatherTemp}>{weather.temp}°C</span>
                  </div>
                  <div className={styles.weatherDesc}>
                    <span>{weather.desc}</span>
                    <span style={{ marginLeft: 8 }}>湿度 {weather.humidity}%</span>
                  </div>
                </>
              ) : (
                <Text type="secondary" style={{ color: 'rgba(255,255,255,0.7)' }}>天气加载中...</Text>
              )}
            </div>
          </Col>
        </Row>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={12} md={6}>
          <div className={styles.statCard} style={{ borderLeft: '4px solid #1890ff' }}>
            <div className={styles.statIcon} style={{ background: 'rgba(24, 144, 255, 0.1)' }}>
              <UserOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
            <Statistic
              title={
                <span>
                  用户总数
                  <span style={{ color: '#52c41a', fontSize: 12, marginLeft: 8 }}>
                    在线: {stats.onlineUsers ?? 0}
                  </span>
                </span>
              }
              value={stats.totalUsers || 0}
              valueStyle={{ color: '#262626' }}
            />
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div className={styles.statCard} style={{ borderLeft: '4px solid #52c41a' }}>
            <div className={styles.statIcon} style={{ background: 'rgba(82, 196, 26, 0.1)' }}>
              <CheckSquareOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            </div>
            <Statistic title="待办事项" value={stats.pendingTodos || 0} valueStyle={{ color: '#262626' }} />
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div className={styles.statCard} style={{ borderLeft: '4px solid #fa8c16' }}>
            <div className={styles.statIcon} style={{ background: 'rgba(250, 140, 22, 0.15)' }}>
              <MailOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
            </div>
            <Statistic title="未读消息" value={stats.unreadMessages || 0} valueStyle={{ color: '#262626' }} />
          </div>
        </Col>
        <Col xs={12} sm={12} md={6}>
          <div className={styles.statCard} style={{ borderLeft: '4px solid #ff4d4f' }}>
            <div className={styles.statIcon} style={{ background: 'rgba(255, 77, 79, 0.1)' }}>
              <BellOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
            </div>
            <Statistic title="系统公告" value={stats.unreadAnnouncements || 0} valueStyle={{ color: '#262626' }} />
          </div>
        </Col>
      </Row>

      {/* 日历和待办区域 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {/* 日历 - 使用更紧凑的布局 */}
        <Col xs={24} md={10} lg={8}>
          <Card
            title={<><CalendarOutlined style={{ marginRight: 8 }} />日历</>}
            className={styles.calendarCard}
            bodyStyle={{ padding: '8px 12px' }}
          >
            <Calendar
              fullscreen={false}
              value={selectedDate}
              onSelect={onDateSelect}
              onPanelChange={(date) => {
                loadTodoDates(date.year(), date.month() + 1);
              }}
              cellRender={(date, info) => {
                if (info.type === 'date') {
                  return dateCellRender(date);
                }
                return info.originNode;
              }}
            />
          </Card>
        </Col>

        {/* 待办区域 */}
        <Col xs={24} md={14} lg={16}>
          <Row gutter={[0, 16]}>
            {/* 工作流待办任务 */}
            <Col span={24}>
              <Card
                title={
                  <span>
                    <BellOutlined style={{ marginRight: 8 }} />
                    待办任务
                    {stats.workflowTasks > 0 && (
                      <Tag color="red" style={{ marginLeft: 8 }}>{stats.workflowTasks}</Tag>
                    )}
                  </span>
                }
                extra={
                  <Button type="link" size="small" onClick={() => history.push('/workflow/task')}>
                    查看全部
                  </Button>
                }
                className={styles.todoCard}
                bodyStyle={{ padding: '12px 16px', maxHeight: 160, overflowY: 'auto' }}
              >
                {workflowTasks.length === 0 ? (
                  <Empty description="暂无待办任务" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '20px 0' }} />
                ) : (
                  <div className={styles.todoList}>
                    {workflowTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className={styles.todoItem}
                        style={{ borderLeftColor: '#fa8c16', cursor: 'pointer' }}
                        onClick={() => history.push('/workflow/task')}
                      >
                        <div className={styles.todoContent}>
                          <div className={styles.todoHeader}>
                            <span className={styles.todoTitle}>
                              {task.instance?.title || '待办任务'}
                            </span>
                            <div className={styles.todoTags}>
                              <Tag color="blue">{task.instance?.processName || '流程'}</Tag>
                              <Tag color="orange">{task.task?.nodeName || '审批'}</Tag>
                            </div>
                          </div>
                          <div className={styles.todoMeta}>
                            <span>发起人：{task.instance?.starterName || '未知'}</span>
                            <span style={{ marginLeft: 12 }}>
                              <ClockCircleOutlined style={{ marginRight: 4 }} />
                              {task.createTime ? dayjs(task.createTime).format('MM-DD HH:mm') : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </Col>
            
            {/* 日历待办事项 */}
            <Col span={24}>
              <Card
                title={
                  <span>
                    <CheckSquareOutlined style={{ marginRight: 8 }} />
                    待办事项 - {selectedDate.format('MM月DD日')}
                  </span>
                }
                extra={
                  <Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAddTodoModal}>
                    添加
                  </Button>
                }
                className={styles.todoCard}
                bodyStyle={{ padding: '12px 16px', maxHeight: 180, overflowY: 'auto' }}
              >
            {todos.length === 0 ? (
              <Empty description="暂无待办事项" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '40px 0' }} />
            ) : (
              <div className={styles.todoList}>
                {todos.map((todo) => {
                  const isIgnored = todo.status === 4;
                  const isCompleted = todo.status === 2;
                  return (
                    <div
                      key={todo.id}
                      className={`${styles.todoItem} ${isIgnored ? styles.todoItemIgnored : ''}`}
                      style={{ borderLeftColor: isIgnored ? '#d9d9d9' : (todo.color || '#1890ff') }}
                    >
                      <div className={styles.todoContent}>
                        <div className={styles.todoHeader}>
                          <span
                            className={styles.todoTitle}
                            style={{ textDecoration: isCompleted && !isIgnored ? 'line-through' : 'none' }}
                          >
                            {todo.title}
                          </span>
                          <div className={styles.todoTags}>
                            <Tag color={isIgnored ? 'default' : priorityColors[todo.priority || 2]} style={{ marginRight: 4 }}>
                              {priorityLabels[todo.priority || 2]}
                            </Tag>
                            <Tag color={statusLabels[todo.status || 0].color}>
                              {statusLabels[todo.status || 0].text}
                            </Tag>
                          </div>
                        </div>
                        {(todo.startTime || todo.description) && (
                          <div className={styles.todoMeta}>
                            {todo.startTime && (
                              <span><ClockCircleOutlined style={{ marginRight: 4 }} />{todo.startTime} - {todo.endTime || '未设置'}</span>
                            )}
                            {todo.description && <span style={{ marginLeft: todo.startTime ? 12 : 0 }}>{todo.description}</span>}
                          </div>
                        )}
                      </div>
                      <div className={styles.todoActions}>
                        {!isCompleted && (
                          <>
                            {isIgnored ? (
                              <>
                                <Tooltip title="取消忽略">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EyeInvisibleOutlined style={{ color: '#1890ff' }} />}
                                    onClick={() => handleUnignoreTodo(todo.id!)}
                                  />
                                </Tooltip>
                                <Tooltip title="完成">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CheckOutlined style={{ color: '#52c41a' }} />}
                                    onClick={() => handleCompleteTodo(todo.id!)}
                                  />
                                </Tooltip>
                              </>
                            ) : (
                              <>
                                <Tooltip title="完成">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<CheckOutlined style={{ color: '#52c41a' }} />}
                                    onClick={() => handleCompleteTodo(todo.id!)}
                                  />
                                </Tooltip>
                                <Tooltip title="忽略">
                                  <Button
                                    type="text"
                                    size="small"
                                    icon={<EyeInvisibleOutlined style={{ color: '#8c8c8c' }} />}
                                    onClick={() => handleIgnoreTodo(todo.id!)}
                                  />
                                </Tooltip>
                              </>
                            )}
                          </>
                        )}
                        {!isIgnored && (
                          <Tooltip title="编辑">
                            <Button type="text" size="small" icon={<EditOutlined />} onClick={() => openEditTodoModal(todo)} />
                          </Tooltip>
                        )}
                        <Tooltip title="删除">
                          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDeleteTodo(todo.id!)} />
                        </Tooltip>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* 系统公告 */}
      <Card
        title={<><NotificationOutlined style={{ marginRight: 8 }} />系统公告</>}
        className={styles.announcementCard}
        bodyStyle={{ padding: '12px 16px', maxHeight: 280, overflowY: 'auto' }}
      >
        {announcements.length === 0 ? (
          <Empty description="暂无公告" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: '20px 0' }} />
        ) : (
          <div className={styles.announcementList}>
            {announcements.map((item) => (
              <div key={item.id} className={styles.announcementItem} onClick={() => openAnnouncement(item)} style={{ cursor: 'pointer' }}>
                <div className={styles.announcementHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
                    {item.isTop === 1 && <Tag color="red">置顶</Tag>}
                    <Tag color={announcementTypeLabels[item.announcementType || 1].color}>
                      {announcementTypeLabels[item.announcementType || 1].text}
                    </Tag>
                    {item.isRead !== 1 && <Tag color="gold">未读</Tag>}
                    <span className={styles.announcementTitle}>{item.title}</span>
                  </div>
                  <Tooltip title="标记已读">
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckCircleOutlined style={{ color: item.isRead === 1 ? '#bfbfbf' : '#52c41a' }} />}
                      disabled={!item.id || item.isRead === 1}
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!item.id) return;
                        try {
                          await markAnnouncementAsRead(item.id);
                          if (selectedAnnouncement?.id === item.id) {
                            setSelectedAnnouncement({ ...selectedAnnouncement, isRead: 1 });
                          }
                        } catch (err) {
                          // ignore
                        } finally {
                          loadData();
                        }
                      }}
                    />
                  </Tooltip>
                </div>
                <div className={styles.announcementMeta}>
                  <span className={styles.announcementAuthor}>
                    <UserOutlined style={{ marginRight: 4 }} />
                    {item.createByName || '系统'}
                  </span>
                  <span className={styles.announcementTime}>
                    {item.publishTime ? dayjs(item.publishTime).format('YYYY-MM-DD HH:mm') : ''}
                  </span>
                </div>
                <Paragraph ellipsis={{ rows: 2 }} className={styles.announcementContent}>
                  {item.content}
                </Paragraph>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal
        title={selectedAnnouncement?.title || '公告详情'}
        open={announcementDetailVisible}
        onCancel={() => { setAnnouncementDetailVisible(false); setSelectedAnnouncement(null); }}
        footer={null}
        width={700}
        destroyOnClose
      >
        <div style={{ marginBottom: 12 }}>
          {selectedAnnouncement?.announcementType && (
            <Tag color={announcementTypeLabels[selectedAnnouncement.announcementType].color}>
              {announcementTypeLabels[selectedAnnouncement.announcementType].text}
            </Tag>
          )}
          {selectedAnnouncement?.isRead !== 1 && <Tag color="gold">未读</Tag>}
        </div>
        <div style={{ color: '#8c8c8c', fontSize: 12, marginBottom: 12 }}>
          {selectedAnnouncement?.createByName || '系统'}
          {selectedAnnouncement?.publishTime ? ` · ${dayjs(selectedAnnouncement.publishTime).format('YYYY-MM-DD HH:mm')}` : ''}
        </div>
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.8 }}>
          {selectedAnnouncement?.content}
        </div>
      </Modal>

      {/* 待办事项弹窗 */}
      <Modal
        title={editingTodo ? '编辑待办' : '新增待办'}
        open={todoModalVisible}
        onOk={handleTodoSubmit}
        onCancel={() => setTodoModalVisible(false)}
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="title"
            label="标题"
            rules={[{ required: true, message: '请输入待办标题' }]}
          >
            <Input placeholder="请输入待办标题" maxLength={100} />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea placeholder="请输入待办描述" rows={3} maxLength={500} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="todoDate"
                label="日期"
                rules={[{ required: true, message: '请选择日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priority" label="优先级">
                <Select>
                  <Select.Option value={1}>低</Select.Option>
                  <Select.Option value={2}>中</Select.Option>
                  <Select.Option value={3}>高</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="startTime" label="开始时间">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="endTime" label="结束时间">
                <TimePicker format="HH:mm" style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="color" label="颜色标记">
            <Select>
              <Select.Option value="#1890ff">🔵 蓝色</Select.Option>
              <Select.Option value="#52c41a">🟢 绿色</Select.Option>
              <Select.Option value="#fa8c16">🟠 橙色</Select.Option>
              <Select.Option value="#ff4d4f">🔴 红色</Select.Option>
              <Select.Option value="#722ed1">🟣 紫色</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default HomePage;