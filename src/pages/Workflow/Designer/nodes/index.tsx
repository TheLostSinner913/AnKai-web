import LogicFlow, { CircleNode, CircleNodeModel, RectNode, RectNodeModel, DiamondNode, DiamondNodeModel, h } from '@logicflow/core';

// 开始节点
class StartNode extends CircleNode {
  getShape() {
    const { model } = this.props;
    const { x, y, r } = model;
    
    return h('g', {}, [
      h('circle', {
        cx: x,
        cy: y,
        r: r,
        fill: '#52c41a',
        stroke: '#389e0d',
        strokeWidth: 2,
      }),
      h('text', {
        x: x,
        y: y,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#fff',
        fontSize: 12,
      }, '开始'),
    ]);
  }
}

class StartNodeModel extends CircleNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data);
    this.r = 30;
    // 禁用默认文字显示，使用自定义文字
    this.text.editable = false;
  }

  // 不显示默认文本
  getTextStyle() {
    const style = super.getTextStyle();
    style.fontSize = 0;
    return style;
  }

  getConnectedTargetRules() {
    const rules = super.getConnectedTargetRules();
    rules.push({
      message: '开始节点只能作为起点',
      validate: () => false,
    });
    return rules;
  }
}

// 结束节点
class EndNode extends CircleNode {
  getShape() {
    const { model } = this.props;
    const { x, y, r } = model;
    
    return h('g', {}, [
      h('circle', {
        cx: x,
        cy: y,
        r: r,
        fill: '#ff4d4f',
        stroke: '#cf1322',
        strokeWidth: 2,
      }),
      h('text', {
        x: x,
        y: y,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#fff',
        fontSize: 12,
      }, '结束'),
    ]);
  }
}

class EndNodeModel extends CircleNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data);
    this.r = 30;
    this.text.editable = false;
  }

  getTextStyle() {
    const style = super.getTextStyle();
    style.fontSize = 0;
    return style;
  }

  getConnectedSourceRules() {
    const rules = super.getConnectedSourceRules();
    rules.push({
      message: '结束节点只能作为终点',
      validate: () => false,
    });
    return rules;
  }
}

// 审批节点
class ApproveNode extends RectNode {
  getShape() {
    const { model } = this.props;
    const { x, y, width, height } = model;
    const text = model.text?.value || model.properties?.name || '审批';
    
    return h('g', {}, [
      h('rect', {
        x: x - width / 2,
        y: y - height / 2,
        width: width,
        height: height,
        rx: 8,
        ry: 8,
        fill: '#1890ff',
        stroke: '#096dd9',
        strokeWidth: 2,
      }),
      h('text', {
        x: x,
        y: y,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#fff',
        fontSize: 14,
      }, text),
    ]);
  }
}

class ApproveNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data);
    this.width = 120;
    this.height = 50;
    this.text.editable = false;
  }

  getTextStyle() {
    const style = super.getTextStyle();
    style.fontSize = 0;
    return style;
  }
}

// 抄送节点
class CopyNode extends RectNode {
  getShape() {
    const { model } = this.props;
    const { x, y, width, height } = model;
    const text = model.text?.value || model.properties?.name || '抄送';
    
    return h('g', {}, [
      h('rect', {
        x: x - width / 2,
        y: y - height / 2,
        width: width,
        height: height,
        rx: 8,
        ry: 8,
        fill: '#722ed1',
        stroke: '#531dab',
        strokeWidth: 2,
      }),
      h('text', {
        x: x,
        y: y,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#fff',
        fontSize: 14,
      }, text),
    ]);
  }
}

class CopyNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data);
    this.width = 120;
    this.height = 50;
    this.text.editable = false;
  }

  getTextStyle() {
    const style = super.getTextStyle();
    style.fontSize = 0;
    return style;
  }
}

// 办理节点
class HandleNode extends RectNode {
  getShape() {
    const { model } = this.props;
    const { x, y, width, height } = model;
    const text = model.text?.value || model.properties?.name || '办理';

    return h('g', {}, [
      h('rect', {
        x: x - width / 2,
        y: y - height / 2,
        width: width,
        height: height,
        rx: 8,
        ry: 8,
        fill: '#13c2c2',
        stroke: '#08979c',
        strokeWidth: 2,
      }),
      h('text', {
        x: x,
        y: y,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#fff',
        fontSize: 14,
      }, text),
    ]);
  }
}

class HandleNodeModel extends RectNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data);
    this.width = 120;
    this.height = 50;
    this.text.editable = false;
  }

  getTextStyle() {
    const style = super.getTextStyle();
    style.fontSize = 0;
    return style;
  }
}

// 条件分支节点
class ConditionNode extends DiamondNode {
  getShape() {
    const { model } = this.props;
    const { x, y, rx, ry } = model;
    const text = model.text?.value || model.properties?.name || '条件';

    const points = [
      [x, y - ry],
      [x + rx, y],
      [x, y + ry],
      [x - rx, y],
    ].map(p => p.join(',')).join(' ');

    return h('g', {}, [
      h('polygon', {
        points: points,
        fill: '#fa8c16',
        stroke: '#d48806',
        strokeWidth: 2,
      }),
      h('text', {
        x: x,
        y: y,
        textAnchor: 'middle',
        dominantBaseline: 'middle',
        fill: '#fff',
        fontSize: 12,
      }, text),
    ]);
  }
}

class ConditionNodeModel extends DiamondNodeModel {
  initNodeData(data: any) {
    super.initNodeData(data);
    this.rx = 50;
    this.ry = 35;
    this.text.editable = false;
  }

  getTextStyle() {
    const style = super.getTextStyle();
    style.fontSize = 0;
    return style;
  }
}

// 注册所有自定义节点
export function registerCustomNodes(lf: LogicFlow) {
  lf.register({
    type: 'start-node',
    view: StartNode,
    model: StartNodeModel,
  });

  lf.register({
    type: 'end-node',
    view: EndNode,
    model: EndNodeModel,
  });

  lf.register({
    type: 'approve-node',
    view: ApproveNode,
    model: ApproveNodeModel,
  });

  lf.register({
    type: 'copy-node',
    view: CopyNode,
    model: CopyNodeModel,
  });

  lf.register({
    type: 'handle-node',
    view: HandleNode,
    model: HandleNodeModel,
  });

  lf.register({
    type: 'condition-node',
    view: ConditionNode,
    model: ConditionNodeModel,
  });
}

