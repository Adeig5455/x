import React, { useState, useCallback, useMemo } from 'react';

// ============================================================================
// Task Runner - npm scripts, build tasks, custom commands with output
// ============================================================================

export type TaskStatus = 'idle' | 'running' | 'success' | 'error' | 'cancelled';

export interface TaskDefinition {
  id: string;
  name: string;
  command: string;
  type: 'npm' | 'shell' | 'gulp' | 'grunt' | 'make' | 'custom';
  group?: 'build' | 'test' | 'clean' | 'deploy' | 'watch' | 'none';
  isDefault?: boolean;
  problemMatcher?: string;
  dependsOn?: string[];
  cwd?: string;
  env?: Record<string, string>;
}

export interface TaskExecution {
  id: string;
  taskId: string;
  status: TaskStatus;
  startTime: number;
  endTime?: number;
  exitCode?: number;
  output: string[];
  pid?: number;
}

interface TaskRunnerProps {
  tasks: TaskDefinition[];
  executions: TaskExecution[];
  onRunTask: (taskId: string) => void;
  onStopTask: (executionId: string) => void;
  onRestartTask: (executionId: string) => void;
  onConfigureTask: (taskId: string) => void;
  onAddTask: () => void;
  onRemoveTask: (taskId: string) => void;
}

const STATUS_STYLES: Record<TaskStatus, { color: string; icon: string }> = {
  idle: { color: '#969696', icon: '○' },
  running: { color: '#3794ff', icon: '◉' },
  success: { color: '#4ec9b0', icon: '●' },
  error: { color: '#f44747', icon: '●' },
  cancelled: { color: '#cca700', icon: '◌' },
};

const TYPE_ICONS: Record<TaskDefinition['type'], string> = {
  npm: '📦', shell: '💻', gulp: '🥤', grunt: '🐗', make: '🔨', custom: '⚙',
};

const formatDuration = (start: number, end?: number): string => {
  const ms = (end || Date.now()) - start;
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

export const TaskRunner: React.FC<TaskRunnerProps> = ({
  tasks,
  executions,
  onRunTask,
  onStopTask,
  onRestartTask,
  onConfigureTask,
  onAddTask,
  onRemoveTask,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [showOutput, setShowOutput] = useState(true);

  const filteredTasks = useMemo(() => {
    if (filterGroup === 'all') return tasks;
    return tasks.filter((t) => t.group === filterGroup);
  }, [tasks, filterGroup]);

  const selectedExecution = useMemo(() => {
    if (!selectedTaskId) return null;
    return executions.filter((e) => e.taskId === selectedTaskId).sort((a, b) => b.startTime - a.startTime)[0] || null;
  }, [selectedTaskId, executions]);

  const runningCount = executions.filter((e) => e.status === 'running').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-primary)' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '4px 8px',
        borderBottom: '1px solid var(--border-color)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
          Tasks
        </span>
        {runningCount > 0 && (
          <span style={{
            fontSize: 9, padding: '1px 5px', borderRadius: 8, background: 'rgba(55,148,255,0.2)', color: '#3794ff',
          }}>
            {runningCount} running
          </span>
        )}
        <div style={{ flex: 1 }} />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          style={{
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
            color: 'var(--text-secondary)', borderRadius: 3, padding: '1px 4px', fontSize: 10, outline: 'none',
          }}
        >
          <option value="all">All Tasks</option>
          <option value="build">Build</option>
          <option value="test">Test</option>
          <option value="watch">Watch</option>
          <option value="deploy">Deploy</option>
          <option value="clean">Clean</option>
        </select>
        <button
          onClick={onAddTask}
          style={{
            background: 'none', border: 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: 14,
          }}
          title="Add Task"
        >
          +
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Task List */}
        <div style={{ width: 280, borderRight: '1px solid var(--border-color)', overflow: 'auto' }}>
          {filteredTasks.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-secondary)', fontSize: 12 }}>
              No tasks configured
            </div>
          ) : (
            filteredTasks.map((task) => {
              const execution = executions.filter((e) => e.taskId === task.id).sort((a, b) => b.startTime - a.startTime)[0];
              const status = execution?.status || 'idle';
              const statusStyle = STATUS_STYLES[status];
              const isSelected = selectedTaskId === task.id;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                    cursor: 'pointer', borderBottom: '1px solid rgba(60,60,60,0.2)',
                    background: isSelected ? 'var(--bg-active)' : 'transparent',
                    borderLeft: isSelected ? '2px solid var(--accent-color)' : '2px solid transparent',
                  }}
                  onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                  onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = isSelected ? 'var(--bg-active)' : 'transparent'; }}
                >
                  <span style={{ fontSize: 12 }}>{TYPE_ICONS[task.type]}</span>
                  <span style={{ color: statusStyle.color, fontSize: 10 }}>{statusStyle.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: task.isDefault ? 600 : 400 }}>
                      {task.name}
                      {task.isDefault && <span style={{ fontSize: 9, color: 'var(--accent-color)', marginLeft: 4 }}>DEFAULT</span>}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.command}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onClick={(e) => e.stopPropagation()}>
                    {status === 'running' ? (
                      <button onClick={() => execution && onStopTask(execution.id)} style={{
                        background: 'none', border: 'none', color: '#f44747', cursor: 'pointer', fontSize: 12, padding: 2,
                      }} title="Stop">■</button>
                    ) : (
                      <button onClick={() => onRunTask(task.id)} style={{
                        background: 'none', border: 'none', color: '#4ec9b0', cursor: 'pointer', fontSize: 12, padding: 2,
                      }} title="Run">▶</button>
                    )}
                    <button onClick={() => onConfigureTask(task.id)} style={{
                      background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11, padding: 2,
                    }} title="Configure">⚙</button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Task Output */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedExecution ? (
            <>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px',
                borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              }}>
                <span style={{ color: STATUS_STYLES[selectedExecution.status].color, fontSize: 10 }}>
                  {STATUS_STYLES[selectedExecution.status].icon}
                </span>
                <span style={{ fontSize: 11, color: 'var(--text-primary)', fontWeight: 500 }}>
                  {tasks.find((t) => t.id === selectedExecution.taskId)?.name}
                </span>
                <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
                  {formatDuration(selectedExecution.startTime, selectedExecution.endTime)}
                </span>
                {selectedExecution.exitCode != null && (
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 3,
                    background: selectedExecution.exitCode === 0 ? 'rgba(78,201,176,0.15)' : 'rgba(244,71,71,0.15)',
                    color: selectedExecution.exitCode === 0 ? '#4ec9b0' : '#f44747',
                  }}>
                    exit {selectedExecution.exitCode}
                  </span>
                )}
                <div style={{ flex: 1 }} />
                {selectedExecution.status === 'running' && (
                  <button onClick={() => onStopTask(selectedExecution.id)} style={{
                    background: 'none', border: 'none', color: '#f44747', cursor: 'pointer', fontSize: 11,
                  }}>Stop</button>
                )}
                <button onClick={() => onRestartTask(selectedExecution.id)} style={{
                  background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 11,
                }}>Restart</button>
              </div>
              <div style={{
                flex: 1, overflow: 'auto', fontFamily: 'monospace', fontSize: 11, padding: 8,
                background: '#1a1a1a', color: 'var(--text-primary)', lineHeight: '18px',
              }}>
                {selectedExecution.output.map((line, i) => (
                  <div key={i} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{line}</div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', fontSize: 12 }}>
              Select a task to view output
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
