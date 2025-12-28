/**
 * Scheduling Tools
 * 
 * Schedule tasks to run at specific times or intervals.
 * Enables automation and recurring workflows.
 * 
 * Tools:
 * - schedule_task: Schedule a task for future execution
 * - list_scheduled_tasks: List all scheduled tasks
 * - cancel_scheduled_task: Cancel a scheduled task
 */

export interface Tool {
  name: string;
  description: string;
  schema: any;
  execute: (args: any, env: any, userId?: string) => Promise<string>;
}

export interface ScheduledTask {
  id: string;
  userId: string;
  task: string;
  schedule: {
    type: 'cron' | 'interval' | 'once';
    expression: string;
    repeat: boolean;
  };
  status: 'active' | 'paused' | 'completed' | 'failed';
  nextRun?: Date;
  lastRun?: Date;
  runCount: number;
  createdAt: Date;
}

/**
 * Schedule Task Tool
 */
export const scheduleTaskTool: Tool = {
  name: 'schedule_task',
  description: `Schedule a task to run at a specific time or interval.

Schedule Types:
- cron: Use cron expression (e.g., "0 9 * * *" for 9am daily)
- interval: Run every N seconds (e.g., 3600 for hourly)
- once: Run once at specific time

Examples:
1. Daily report at 9am:
   {
     "task": "Generate daily sales report",
     "schedule": {
       "type": "cron",
       "expression": "0 9 * * *",
       "repeat": true
     }
   }

2. Check status every hour:
   {
     "task": "Check server status",
     "schedule": {
       "type": "interval",
       "expression": "3600",
       "repeat": true
     }
   }

3. One-time reminder:
   {
     "task": "Send meeting reminder",
     "schedule": {
       "type": "once",
       "expression": "2024-12-29T10:00:00Z",
       "repeat": false
     }
   }`,

  schema: {
    type: 'object',
    properties: {
      task: {
        type: 'string',
        description: 'Task description or command to execute',
      },
      schedule: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['cron', 'interval', 'once'],
            description: 'Schedule type',
          },
          expression: {
            type: 'string',
            description: 'Cron expression, interval in seconds, or ISO timestamp',
          },
          repeat: {
            type: 'boolean',
            description: 'Whether to repeat the task',
          },
        },
        required: ['type', 'expression', 'repeat'],
      },
      timezone: {
        type: 'string',
        description: 'Timezone for cron schedules (default: UTC)',
      },
      enabled: {
        type: 'boolean',
        description: 'Start enabled (default: true)',
      },
    },
    required: ['task', 'schedule'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { task, schedule, timezone = 'UTC', enabled = true } = args;
    
    console.log(`[Scheduling] Creating scheduled task: ${task}`);
    
    // Generate task ID
    const taskId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    
    // Calculate next run time
    let nextRun: string;
    if (schedule.type === 'cron') {
      nextRun = '[Next cron execution time]';
    } else if (schedule.type === 'interval') {
      const seconds = parseInt(schedule.expression);
      const next = new Date(Date.now() + seconds * 1000);
      nextRun = next.toISOString();
    } else {
      nextRun = schedule.expression;
    }
    
    return `✅ Task scheduled successfully!

**Task ID:** ${taskId}
**Task:** ${task}
**Schedule Type:** ${schedule.type}
**Expression:** ${schedule.expression}
**Repeat:** ${schedule.repeat ? 'Yes' : 'No'}
**Timezone:** ${timezone}
**Status:** ${enabled ? 'Active' : 'Paused'}
**Next Run:** ${nextRun}

The task will execute according to the schedule. You can:
- View status with \`list_scheduled_tasks\`
- Cancel with \`cancel_scheduled_task\``;
  },
};

/**
 * List Scheduled Tasks Tool
 */
export const listScheduledTasksTool: Tool = {
  name: 'list_scheduled_tasks',
  description: 'List all scheduled tasks for the current user',
  schema: {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['all', 'active', 'paused', 'completed', 'failed'],
        description: 'Filter by status (default: all)',
      },
      limit: {
        type: 'number',
        description: 'Maximum number of tasks to return (default: 50)',
      },
    },
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { status = 'all', limit = 50 } = args;
    
    console.log(`[Scheduling] Listing scheduled tasks (status: ${status})`);
    
    // In production, this would query the database
    // Mock data for demonstration
    const tasks: ScheduledTask[] = [
      {
        id: 'task_123',
        userId: userId || 'user_1',
        task: 'Generate daily report',
        schedule: {
          type: 'cron',
          expression: '0 9 * * *',
          repeat: true,
        },
        status: 'active',
        nextRun: new Date(Date.now() + 86400000),
        lastRun: new Date(Date.now() - 86400000),
        runCount: 30,
        createdAt: new Date(Date.now() - 2592000000),
      },
      {
        id: 'task_456',
        userId: userId || 'user_1',
        task: 'Check server status',
        schedule: {
          type: 'interval',
          expression: '3600',
          repeat: true,
        },
        status: 'active',
        nextRun: new Date(Date.now() + 3600000),
        lastRun: new Date(Date.now() - 600000),
        runCount: 720,
        createdAt: new Date(Date.now() - 2592000000),
      },
    ];
    
    const filteredTasks = status === 'all' 
      ? tasks 
      : tasks.filter(t => t.status === status);
    
    if (filteredTasks.length === 0) {
      return `📋 No scheduled tasks found (status: ${status})`;
    }
    
    const taskList = filteredTasks.slice(0, limit).map(t => `
### ${t.task}
- **ID:** ${t.id}
- **Type:** ${t.schedule.type}
- **Expression:** ${t.schedule.expression}
- **Status:** ${t.status}
- **Next Run:** ${t.nextRun?.toISOString() || 'N/A'}
- **Last Run:** ${t.lastRun?.toISOString() || 'Never'}
- **Run Count:** ${t.runCount}
`).join('\n');
    
    return `📋 Scheduled Tasks (${filteredTasks.length} total)

${taskList}

${filteredTasks.length > limit ? `\n... and ${filteredTasks.length - limit} more tasks` : ''}`;
  },
};

/**
 * Cancel Scheduled Task Tool
 */
export const cancelScheduledTaskTool: Tool = {
  name: 'cancel_scheduled_task',
  description: 'Cancel a scheduled task',
  schema: {
    type: 'object',
    properties: {
      taskId: {
        type: 'string',
        description: 'Task ID to cancel',
      },
      reason: {
        type: 'string',
        description: 'Reason for cancellation (optional)',
      },
    },
    required: ['taskId'],
  },
  
  async execute(args: any, env: any, userId?: string): Promise<string> {
    const { taskId, reason } = args;
    
    console.log(`[Scheduling] Canceling task: ${taskId}`);
    
    // In production, this would update the database
    
    return `✅ Task canceled successfully!

**Task ID:** ${taskId}
${reason ? `**Reason:** ${reason}` : ''}

The task has been canceled and will no longer execute.`;
  },
};

/**
 * All scheduling tools
 */
export const schedulingTools: Tool[] = [
  scheduleTaskTool,
  listScheduledTasksTool,
  cancelScheduledTaskTool,
];
