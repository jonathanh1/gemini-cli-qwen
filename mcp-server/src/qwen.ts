#!/usr/bin/env node

/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { spawn } from 'child_process';
import { randomUUID } from 'crypto';

const server = new McpServer({
  name: 'qwen-mcp-server',
  version: '0.1.0',
});

interface Task {
  id: string;
  status: 'running' | 'completed' | 'failed';
  output: string;
  error: string;
  startTime: number;
}

const tasks = new Map<string, Task>();

export async function startNewQwenTask(
  { user_task_description }: { user_task_description: string }
): Promise<CallToolResult> {
  const taskId = randomUUID().substring(0, 8);
  
  const task: Task = {
    id: taskId,
    status: 'running',
    output: '',
    error: '',
    startTime: Date.now(),
  };

  tasks.set(taskId, task);

  const child = spawn('qwen', ['-p', user_task_description], {
    shell: true
  });

  child.stdout.on('data', (data) => {
    task.output += data.toString();
  });

  child.stderr.on('data', (data) => {
    task.error += data.toString();
  });

  child.on('close', (code) => {
    if (code === 0) {
      task.status = 'completed';
    } else {
      task.status = 'failed';
      task.error += `\nProcess exited with code ${code}`;
    }
  });

  child.on('error', (err) => {
    task.status = 'failed';
    task.error += `\nFailed to start process: ${err.message}`;
  });

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          status: "started", 
          task_id: taskId, 
          message: "Task started in background. Use check_qwen_task_status to view progress."
        }),
      },
    ],
  };
}

export async function checkQwenTaskStatus(
  { task_id }: { task_id: string }
): Promise<CallToolResult> {
  const task = tasks.get(task_id);

  if (!task) {
    return {
      content: [{ type: 'text', text: JSON.stringify({ error: "Task ID not found." }) }],
      isError: true,
    };
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          id: task.id,
          status: task.status,
          output_preview: task.output.substring(0, 200) + (task.output.length > 200 ? "..." : ""),
          full_output: task.status !== 'running' ? task.output : undefined,
          error: task.error || undefined,
        }),
      },
    ],
  };
}

const startNewQwenTaskSchema = {
  user_task_description: z.string().describe('The prompt or description of the task.'),
};

// @ts-ignore
server.tool(
  'start_new_qwen_task',
  'Starts a new Qwen task asynchronously. Returns a Task ID.',
  startNewQwenTaskSchema,
  startNewQwenTask
);

const checkQwenTaskStatusSchema = {
  task_id: z.string().describe('The ID of the task to check.'),
};

// @ts-ignore
server.tool(
  'check_qwen_task_status',
  'Checks the status and gets the output of a running or completed Qwen task.',
  checkQwenTaskStatusSchema,
  checkQwenTaskStatus
);

/* v8 ignore start */
async function startServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.env.NODE_ENV !== 'test') {
  startServer();
}
/* v8 ignore stop */

export default server;
