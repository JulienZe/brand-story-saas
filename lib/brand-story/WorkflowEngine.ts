export class WorkflowEngine {
  private stages: Map<string, any> = new Map();
  private middleware: any[] = [];
  private _listeners: Record<string, Function[]> = {};

  on(event: string, handler: Function) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(handler);
    return this;
  }

  off(event: string, handler: Function) {
    if (!this._listeners[event]) return this;
    this._listeners[event] = this._listeners[event].filter(h => h !== handler);
    return this;
  }

  emit(event: string, data: any) {
    const handlers = this._listeners[event];
    if (!handlers) return;
    for (const h of handlers) {
      try { h(data) } catch (e: any) { console.error(`[Workflow] 事件处理器错误:`, e.message) }
    }
  }

  addStage(name: string, config: any) {
    this.stages.set(name, {
      name,
      ...config,
      status: 'pending',
      result: null,
      error: null,
      startTime: null,
      endTime: null
    });
    return this;
  }

  use(middleware: any) {
    this.middleware.push(middleware);
    return this;
  }

  async execute(context: any) {
    const executionContext = {
      ...context,
      stageResults: {} as Record<string, any>,
      metadata: {
        startTime: Date.now(),
        stagesCompleted: 0,
        stagesFailed: 0
      }
    };

    const stageNames = Array.from(this.stages.keys());
    const totalStages = stageNames.length;

    for (const [stageName, stage] of this.stages) {
      try {
        for (const mw of this.middleware) {
          if (mw.before) await mw.before(stageName, executionContext);
        }

        const stageIndex = stageNames.indexOf(stageName);
        this.emit('stage:start', {
          stage: stageName,
          name: stage.name,
          description: stage.description,
          index: stageIndex,
          total: totalStages,
          progress: Math.round((stageIndex / totalStages) * 100),
          timestamp: Date.now(),
        });

        stage.status = 'running';
        stage.startTime = Date.now();

        const result = await stage.handler(executionContext);

        stage.status = 'completed';
        stage.endTime = Date.now();
        stage.result = result;

        executionContext.stageResults[stageName] = result;
        Object.assign(executionContext, result);
        executionContext.metadata.stagesCompleted++;

        this.emit('stage:complete', {
          stage: stageName,
          name: stage.name,
          index: stageIndex,
          total: totalStages,
          progress: Math.round(((stageIndex + 1) / totalStages) * 100),
          timestamp: Date.now(),
          resultKeys: Object.keys(result || {}),
        });

        for (const mw of this.middleware) {
          if (mw.after) await mw.after(stageName, result, executionContext);
        }

      } catch (error: any) {
        stage.status = 'failed';
        stage.endTime = Date.now();
        stage.error = error;
        executionContext.metadata.stagesFailed++;

        this.emit('stage:error', {
          stage: stageName,
          name: stage.name,
          error: error.message,
          timestamp: Date.now(),
        });

        throw new WorkflowError(
          `工作流在阶段 "${stage.name}" 失败: ${error.message}`,
          { stage: stageName, originalError: error }
        );
      }
    }

    executionContext.metadata.endTime = Date.now();
    executionContext.metadata.duration = executionContext.metadata.endTime - executionContext.metadata.startTime;

    return executionContext;
  }

  getStatus() {
    const stages = Array.from(this.stages.values());
    return {
      total: stages.length,
      completed: stages.filter((s: any) => s.status === 'completed').length,
      failed: stages.filter((s: any) => s.status === 'failed').length,
      running: stages.filter((s: any) => s.status === 'running').length,
      pending: stages.filter((s: any) => s.status === 'pending').length,
    };
  }

  reset() {
    for (const stage of this.stages.values()) {
      stage.status = 'pending';
      stage.result = null;
      stage.error = null;
      stage.startTime = null;
      stage.endTime = null;
    }
  }
}

export class WorkflowError extends Error {
  details: any;
  timestamp: string;

  constructor(message: string, details: any = {}) {
    super(message);
    this.name = 'WorkflowError';
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}
