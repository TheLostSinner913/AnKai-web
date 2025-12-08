import {
  PlayCircleOutlined,
  StopOutlined,
  CheckCircleOutlined,
  BranchesOutlined,
  CopyOutlined,
  UserOutlined,
} from '@ant-design/icons';
import LogicFlow from '@logicflow/core';

interface NodePanelProps {
  lf: LogicFlow | null;
}

const nodeGroups = [
  {
    title: '基础节点',
    nodes: [
      { type: 'start-node', name: '开始', icon: <PlayCircleOutlined style={{ color: '#52c41a' }} /> },
      { type: 'end-node', name: '结束', icon: <StopOutlined style={{ color: '#ff4d4f' }} /> },
    ],
  },
  {
    title: '审批节点',
    nodes: [
      { type: 'approve-node', name: '审批', icon: <CheckCircleOutlined style={{ color: '#1890ff' }} /> },
      { type: 'copy-node', name: '抄送', icon: <CopyOutlined style={{ color: '#722ed1' }} /> },
      { type: 'handle-node', name: '办理', icon: <UserOutlined style={{ color: '#13c2c2' }} /> },
    ],
  },
  {
    title: '流程控制',
    nodes: [
      { type: 'condition-node', name: '条件分支', icon: <BranchesOutlined style={{ color: '#fa8c16' }} /> },
    ],
  },
];

const NodePanel: React.FC<NodePanelProps> = ({ lf }) => {
  const handleDragStart = (e: React.DragEvent, nodeType: string) => {
    if (!lf) return;
    
    // 使用LogicFlow的拖拽功能
    lf.dnd.startDrag({
      type: nodeType,
      text: nodeGroups
        .flatMap((g) => g.nodes)
        .find((n) => n.type === nodeType)?.name || '',
    });
  };

  return (
    <div className="node-panel">
      <div className="panel-title">节点面板</div>
      {nodeGroups.map((group) => (
        <div key={group.title} className="node-group">
          <div className="group-title">{group.title}</div>
          <div className="node-list">
            {group.nodes.map((node) => (
              <div
                key={node.type}
                className="node-item"
                draggable
                onMouseDown={() => {
                  if (lf) {
                    lf.dnd.startDrag({
                      type: node.type,
                      text: node.name,
                    });
                  }
                }}
              >
                <span className="node-icon">{node.icon}</span>
                <span className="node-name">{node.name}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NodePanel;

