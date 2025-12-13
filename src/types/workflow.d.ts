declare namespace API {
  /** 流程定义 */
  interface WfProcessDefinition {
    id?: number;
    name?: string;
    processKey?: string;
    category?: string;
    icon?: string;
    description?: string;
    processConfig?: string;
    formConfig?: string;
    version?: number;
    status?: number;
    createBy?: number;
    createTime?: string;
    updateBy?: number;
    updateTime?: string;
  }

  /** 流程实例 */
  interface WfProcessInstance {
    id?: number;
    definitionId?: number;
    processKey?: string;
    processName?: string;
    instanceNo?: string;
    title?: string;
    starterId?: number;
    starterName?: string;
    starterDept?: string;
    formData?: string;
    currentNodeId?: string;
    currentNodeName?: string;
    status?: number;
    result?: number;
    priority?: number;
    createTime?: string;
    completeTime?: string;
    tasks?: WfTask[];
    records?: WfProcessRecord[];
  }

  /** 任务 */
  interface WfTask {
    id?: number;
    instanceId?: number;
    nodeId?: string;
    nodeName?: string;
    nodeType?: number;
    approveType?: number;
    assigneeType?: number;
    totalCount?: number;
    completeCount?: number;
    passCount?: number;
    rejectCount?: number;
    status?: number;
    taskResult?: number;
    createTime?: string;
    completeTime?: string;
    assignees?: WfTaskAssignee[];
  }

  /** 任务审批人 */
  interface WfTaskAssignee {
    id?: number;
    taskId?: number;
    instanceId?: number;
    userId?: number;
    userName?: string;
    userDept?: string;
    orderNum?: number;
    isActive?: number;
    status?: number;
    comment?: string;
    handleTime?: string;
    createTime?: string;
    task?: WfTask;
    instance?: WfProcessInstance;
  }

  /** 流程操作记录 */
  interface WfProcessRecord {
    id?: number;
    instanceId?: number;
    taskId?: number;
    nodeId?: string;
    nodeName?: string;
    actionType?: number;
    actionName?: string;
    operatorId?: number;
    operatorName?: string;
    operatorDept?: string;
    comment?: string;
    createTime?: string;
  }

  /** 流程节点配置 */
  interface WfNodeConfig {
    id: string;
    type: string;
    text?: string;
    x?: number;
    y?: number;
    properties?: {
      name?: string;
      approveType?: number;
      assigneeType?: number;
      assignees?: number[];
      roleIds?: number[];
      deptIds?: number[];
      conditions?: WfCondition[];
      [key: string]: any;
    };
  }

  /** 流程边配置 */
  interface WfEdgeConfig {
    id: string;
    type: string;
    sourceNodeId: string;
    targetNodeId: string;
    properties?: {
      conditionExpression?: string;
      [key: string]: any;
    };
  }

  /** 流程配置 */
  interface WfProcessConfig {
    nodes: WfNodeConfig[];
    edges: WfEdgeConfig[];
  }

  /** 条件配置 */
  interface WfCondition {
    field: string;
    operator: string;
    value: any;
  }

  // ========== 考勤模块类型 ==========

  /** 请假申请 */
  interface LeaveApplication {
    id?: number;
    userId?: number;
    userName?: string;
    deptId?: number;
    deptName?: string;
    leaveType?: string;
    startDate?: string;
    endDate?: string;
    days?: number;
    reason?: string;
    status?: number;
    instanceId?: number;
    createTime?: string;
    updateTime?: string;
    attachmentIds?: number[];
  }

  /** 工作流模块绑定 */
  interface WfModuleBinding {
    id?: number;
    moduleCode?: string;
    moduleName?: string;
    definitionId?: number;
    processKey?: string;
    processName?: string;
    enabled?: number;
    createTime?: string;
    updateTime?: string;
  }
}

