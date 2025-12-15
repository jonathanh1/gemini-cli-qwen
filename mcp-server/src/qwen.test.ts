import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { startNewQwenTask, checkQwenTaskStatus } from './qwen.js';
import { EventEmitter } from 'events';

// Mock child_process
const mockSpawn = vi.fn();

vi.mock('child_process', () => ({
  spawn: (...args: any[]) => mockSpawn(...args),
}));

describe('Qwen MCP Server', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should start a new task successfully', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(mockChildProcess);

    const result = await startNewQwenTask({ user_task_description: 'test task' });
    
    expect(mockSpawn).toHaveBeenCalledWith('qwen', ['-p', 'test task'], { shell: true });
    expect(result.content[0].text).toContain('task_id');
    
    const response = JSON.parse(result.content[0].text);
    expect(response.status).toBe('started');
  });

  it('should update task status on stdout data', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(mockChildProcess);

    const startResult = await startNewQwenTask({ user_task_description: 'test task' });
    const taskId = JSON.parse(startResult.content[0].text).task_id;

    // Simulate stdout data
    mockChildProcess.stdout.emit('data', Buffer.from('Processing...'));

    const statusResult = await checkQwenTaskStatus({ task_id: taskId });
    const statusResponse = JSON.parse(statusResult.content[0].text);

    expect(statusResponse.status).toBe('running');
    expect(statusResponse.output_preview).toContain('Processing...');
  });

  it('should mark task as completed on process exit 0', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(mockChildProcess);

    const startResult = await startNewQwenTask({ user_task_description: 'test task' });
    const taskId = JSON.parse(startResult.content[0].text).task_id;

    // Simulate process exit
    mockChildProcess.emit('close', 0);

    const statusResult = await checkQwenTaskStatus({ task_id: taskId });
    const statusResponse = JSON.parse(statusResult.content[0].text);

    expect(statusResponse.status).toBe('completed');
  });

  it('should mark task as failed on process exit non-0', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(mockChildProcess);

    const startResult = await startNewQwenTask({ user_task_description: 'test task' });
    const taskId = JSON.parse(startResult.content[0].text).task_id;

    // Simulate process error exit
    mockChildProcess.emit('close', 1);

    const statusResult = await checkQwenTaskStatus({ task_id: taskId });
    const statusResponse = JSON.parse(statusResult.content[0].text);

    expect(statusResponse.status).toBe('failed');
    expect(statusResponse.error).toContain('Process exited with code 1');
  });

  it('should capture stderr output', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(mockChildProcess);

    const startResult = await startNewQwenTask({ user_task_description: 'test task' });
    const taskId = JSON.parse(startResult.content[0].text).task_id;

    // Simulate stderr data
    mockChildProcess.stderr.emit('data', Buffer.from('Warning message'));

    const statusResult = await checkQwenTaskStatus({ task_id: taskId });
    const statusResponse = JSON.parse(statusResult.content[0].text);

    expect(statusResponse.error).toContain('Warning message');
  });

  it('should handle process startup error', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(mockChildProcess);

    const startResult = await startNewQwenTask({ user_task_description: 'test task' });
    const taskId = JSON.parse(startResult.content[0].text).task_id;

    // Simulate startup error
    mockChildProcess.emit('error', new Error('Spawn failed'));

    const statusResult = await checkQwenTaskStatus({ task_id: taskId });
    const statusResponse = JSON.parse(statusResult.content[0].text);

    expect(statusResponse.status).toBe('failed');
    expect(statusResponse.error).toContain('Failed to start process: Spawn failed');
  });

  it('should truncate long output in preview', async () => {
    const mockChildProcess = new EventEmitter() as any;
    mockChildProcess.stdout = new EventEmitter();
    mockChildProcess.stderr = new EventEmitter();
    mockSpawn.mockReturnValue(mockChildProcess);

    const startResult = await startNewQwenTask({ user_task_description: 'test task' });
    const taskId = JSON.parse(startResult.content[0].text).task_id;

    // Simulate long stdout data (> 200 chars)
    const longOutput = 'a'.repeat(205);
    mockChildProcess.stdout.emit('data', Buffer.from(longOutput));

    const statusResult = await checkQwenTaskStatus({ task_id: taskId });
    const statusResponse = JSON.parse(statusResult.content[0].text);

    expect(statusResponse.output_preview).toHaveLength(203); // 200 chars + "..."
    expect(statusResponse.output_preview).toContain('...');
  });

   it('should return error for non-existent task ID', async () => {
    const result = await checkQwenTaskStatus({ task_id: 'non-existent-id' });
    expect(result.isError).toBe(true);
    const response = JSON.parse(result.content[0].text);
    expect(response.error).toBe('Task ID not found.');
  });
});
