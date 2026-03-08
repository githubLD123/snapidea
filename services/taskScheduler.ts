import { AnalysisResult } from '../types';

export interface Task {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  result?: AnalysisResult;
  error?: string;
  timestamp: number;
  retryCount: number;
}

class TaskScheduler {
  private tasks: Map<string, Task> = new Map();
  private queue: string[] = [];
  private runningCount: number = 0;
  private maxConcurrent: number = parseInt(process.env.MAX_CONCURRENT_TASKS || '3');
  private maxRetries: number = parseInt(process.env.MAX_RETRIES || '3');
  private timeout: number = parseInt(process.env.API_TIMEOUT || '30000');

  constructor() {
    this.loadTasks();
  }

  private loadTasks(): void {
    const saved = localStorage.getItem('analysis-tasks');
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.entries(parsed).forEach(([id, task]) => {
        this.tasks.set(id, task);
        if (task.status === 'pending') {
          this.queue.push(id);
        }
      });
    }
  }

  private saveTasks(): void {
    localStorage.setItem('analysis-tasks', JSON.stringify(Object.fromEntries(this.tasks)));
  }

  createTask(): string {
    const id = Date.now().toString();
    const task: Task = {
      id,
      status: 'pending',
      progress: 0,
      timestamp: Date.now(),
      retryCount: 0
    };
    this.tasks.set(id, task);
    this.queue.push(id);
    this.saveTasks();
    return id;
  }

  async runTask(id: string, handler: () => Promise<AnalysisResult>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error('Task not found');

    task.status = 'running';
    task.progress = 20;
    this.saveTasks();

    try {
      const timeoutPromise = new Promise<AnalysisResult>((_, reject) => {
        setTimeout(() => reject(new Error('Task timeout')), this.timeout);
      });

      const result = await Promise.race([
        handler(),
        timeoutPromise
      ]);

      task.status = 'completed';
      task.progress = 100;
      task.result = result;
      this.saveTasks();
      this.runningCount--;
      this.processQueue();

      return task;

    } catch (error: any) {
      task.status = 'failed';
      task.error = error.message;

      if (task.retryCount < this.maxRetries) {
        task.retryCount++;
        task.status = 'pending';
        this.queue.push(id);
        console.log(`Task ${id} failed, retrying (${task.retryCount}/${this.maxRetries})`);
      } else {
        console.error(`Task ${id} failed after ${this.maxRetries} retries:`, error);
      }

      this.saveTasks();
      this.runningCount--;
      this.processQueue();

      return task;
    }
  }

  private async processQueue(): Promise<void> {
    while (this.runningCount < this.maxConcurrent && this.queue.length > 0) {
      const taskId = this.queue.shift()!;
      this.runningCount++;

      const resultTask = this.tasks.get(taskId);
      if (resultTask && resultTask.status === 'pending') {
        // 任务会在 handler 中处理
      }
    }
  }

  start(): void {
    this.processQueue();
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  getTasks(): Task[] {
    return Array.from(this.tasks.values());
  }

  getStats() {
    const statusCounts: { [key: string]: number } = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0
    };

    this.tasks.forEach(task => {
      statusCounts[task.status]++;
    });

    return {
      total: this.tasks.size,
      ...statusCounts,
      runningCount: this.runningCount,
      queueLength: this.queue.length
    };
  }
}

// 单例模式
const taskScheduler = new TaskScheduler();
export { taskScheduler };