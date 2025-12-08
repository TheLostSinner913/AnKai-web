import { PageContainer } from '@ant-design/pro-components';
import { Button, Card, message, Space, Spin } from 'antd';
import { useEffect, useRef, useState } from 'react';
import { history, useParams } from '@umijs/max';
import LogicFlow from '@logicflow/core';
import { Menu, DndPanel, SelectionSelect } from '@logicflow/extension';
import '@logicflow/core/lib/style/index.css';
import '@logicflow/extension/lib/style/index.css';
import { getDefinition, saveDefinition, updateDefinition, publishDefinition } from '@/services/workflow';
import NodePanel from './components/NodePanel';
import PropertyPanel from './components/PropertyPanel';
import { registerCustomNodes } from './nodes';
import './index.less';

const Designer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const containerRef = useRef<HTMLDivElement>(null);
  const lfRef = useRef<LogicFlow | null>(null);
  const [loading, setLoading] = useState(false);
  const [definition, setDefinition] = useState<API.WfProcessDefinition>({});
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedEdge, setSelectedEdge] = useState<any>(null);

  // 初始化LogicFlow
  useEffect(() => {
    if (!containerRef.current) return;

    const lf = new LogicFlow({
      container: containerRef.current,
      grid: {
        size: 10,
        visible: true,
      },
      plugins: [Menu, DndPanel, SelectionSelect],
      keyboard: {
        enabled: true,
      },
      edgeType: 'polyline',
      style: {
        rect: {
          radius: 8,
        },
      },
    });

    // 注册自定义节点
    registerCustomNodes(lf);

    // 监听节点选中
    lf.on('node:click', ({ data }) => {
      setSelectedNode(data);
      setSelectedEdge(null);
    });

    // 监听边选中
    lf.on('edge:click', ({ data }) => {
      setSelectedEdge(data);
      setSelectedNode(null);
    });

    lf.on('blank:click', () => {
      setSelectedNode(null);
      setSelectedEdge(null);
    });

    lfRef.current = lf;

    // 如果有id，加载流程定义
    if (id) {
      loadDefinition(parseInt(id));
    } else {
      // 新建流程，初始化默认节点
      initDefaultNodes(lf);
    }

    return () => {
      lf.destroy();
    };
  }, []);

  // 加载流程定义
  const loadDefinition = async (defId: number) => {
    setLoading(true);
    try {
      const res = await getDefinition(defId);
      if (res.code === 200 && res.data) {
        setDefinition(res.data);
        if (res.data.processConfig && lfRef.current) {
          const config = JSON.parse(res.data.processConfig);
          lfRef.current.render(config);
        }
      }
    } catch (error) {
      message.error('加载流程定义失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化默认节点
  const initDefaultNodes = (lf: LogicFlow) => {
    lf.render({
      nodes: [
        { id: 'start', type: 'start-node', x: 300, y: 100, text: '开始' },
        { id: 'end', type: 'end-node', x: 300, y: 400, text: '结束' },
      ],
      edges: [],
    });
  };

  // 保存流程
  const handleSave = async () => {
    if (!lfRef.current) return;

    const graphData = lfRef.current.getGraphData();
    const processConfig = JSON.stringify(graphData);

    try {
      if (definition.id) {
        await updateDefinition({ ...definition, processConfig });
        message.success('保存成功');
      } else {
        const res = await saveDefinition({ ...definition, processConfig });
        if (res.code === 200 && res.data) {
          setDefinition(res.data);
          history.replace(`/workflow/designer/${res.data.id}`);
          message.success('保存成功');
        }
      }
    } catch (error) {
      message.error('保存失败');
    }
  };

  // 发布流程
  const handlePublish = async () => {
    if (!definition.id) {
      message.warning('请先保存流程');
      return;
    }
    try {
      await publishDefinition(definition.id);
      message.success('发布成功');
      loadDefinition(definition.id);
    } catch (error) {
      message.error('发布失败');
    }
  };

  // 更新节点属性
  const handleNodePropertyChange = (nodeId: string, properties: any) => {
    if (!lfRef.current) return;
    lfRef.current.setProperties(nodeId, properties);
    setSelectedNode({ ...selectedNode, properties: { ...selectedNode.properties, ...properties } });
  };

  // 更新边属性
  const handleEdgePropertyChange = (edgeId: string, properties: any) => {
    if (!lfRef.current) return;
    lfRef.current.setProperties(edgeId, properties);
    setSelectedEdge({ ...selectedEdge, properties: { ...selectedEdge.properties, ...properties } });
  };

  return (
    <PageContainer
      title={definition.name || '新建流程'}
      extra={
        <Space>
          <Button onClick={() => history.push('/workflow/definition')}>返回</Button>
          <Button type="primary" onClick={handleSave}>保存</Button>
          <Button type="primary" onClick={handlePublish} disabled={!definition.id}>发布</Button>
        </Space>
      }
    >
      <Spin spinning={loading}>
        <div className="workflow-designer">
          <NodePanel lf={lfRef.current} />
          <div className="designer-canvas" ref={containerRef} />
          <PropertyPanel
            node={selectedNode}
            edge={selectedEdge}
            definition={definition}
            onDefinitionChange={setDefinition}
            onNodePropertyChange={handleNodePropertyChange}
            onEdgePropertyChange={handleEdgePropertyChange}
          />
        </div>
      </Spin>
    </PageContainer>
  );
};

export default Designer;

