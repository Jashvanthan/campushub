import React, { useState } from 'react';
import {
  Plus, CheckSquare, Clock, AlertCircle, Edit3, Trash2,
  Check, ChevronRight, Tag, User, Layers, Calendar, Filter, Flag, X
} from 'lucide-react';
import NewTaskModal from './NewTaskModal';
import { usePopup } from '../common/PopupDialog';

const COLUMNS = [
  { id: 'BACKLOG', title: 'Backlog', color: '#94a3b8' },
  { id: 'TODO', title: 'To Do', color: '#60a5fa' },
  { id: 'IN PROGRESS', title: 'In Progress', color: '#fbbf24' },
  { id: 'REVIEW', title: 'Review', color: '#c084fc' },
  { id: 'DONE', title: 'Done', color: '#34d399' }
];

function getPriorityBadge(priority) {
  switch (priority) {
    case 'URGENT':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
    case 'HIGH':
      return { bg: 'rgba(249, 115, 22, 0.15)', text: '#fb923c', border: 'rgba(249, 115, 22, 0.3)' };
    case 'MEDIUM':
      return { bg: 'rgba(234, 179, 8, 0.15)', text: '#facc15', border: 'rgba(234, 179, 8, 0.3)' };
    case 'LOW':
    default:
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
  }
}

export default function WorkspaceTasks({
  workspace,
  tasks = [],
  currentUser,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) {
  const { showConfirm } = usePopup();
  const [editingTask, setEditingTask] = useState(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [filterAssignee, setFilterAssignee] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');

  const members = workspace.members || [];
  const isOwnerOrAdmin = members.some(
    m => m.userId === currentUser?.username && (m.role === 'Owner' || m.role === 'Admin')
  ) || currentUser?.role === 'admin';

  // Toggle checklist item
  const handleToggleChecklist = (task, checklistId) => {
    const updatedChecklist = (task.checklist || []).map(item =>
      item.id === checklistId ? { ...item, done: !item.done } : item
    );
    const allDone = updatedChecklist.length > 0 && updatedChecklist.every(i => i.done);
    onUpdateTask({
      ...task,
      checklist: updatedChecklist,
      status: allDone ? 'DONE' : task.status
    });
  };

  // Change task column status
  const handleChangeStatus = (task, newStatus) => {
    onUpdateTask({ ...task, status: newStatus });
  };

  // Filter tasks
  const filteredTasks = tasks.filter(t => {
    if (filterAssignee !== 'ALL' && t.assigneeId !== filterAssignee) return false;
    if (filterPriority !== 'ALL' && t.priority !== filterPriority) return false;
    return true;
  });

  const isFiltered = filterAssignee !== 'ALL' || filterPriority !== 'ALL';

  return (
    <div className="workspace-tasks-tab">
      {/* Task Toolbar */}
      <div className="tasks-toolbar glass-panel">
        <div className="tasks-filters-group">
          {/* Assignee Filter */}
          <div className="task-filter-box" title="Filter by Assignee">
            <User size={14} className="task-filter-icon" />
            <span className="task-filter-label">Assignee:</span>
            <select
              className="task-filter-select"
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
            >
              <option value="ALL">All Assignees</option>
              {members.map(m => (
                <option key={m.userId} value={m.userId}>{m.name || m.userId}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="task-filter-box" title="Filter by Priority">
            <Flag size={14} className="task-filter-icon" />
            <span className="task-filter-label">Priority:</span>
            <select
              className="task-filter-select"
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* Clear Filter Button */}
          {isFiltered && (
            <button
              type="button"
              className="task-clear-filter-btn"
              onClick={() => { setFilterAssignee('ALL'); setFilterPriority('ALL'); }}
              title="Reset all filters"
            >
              <X size={14} /> Clear Filters
            </button>
          )}

          {/* Tasks counter */}
          <span className="tasks-count-pill">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <button
          className="primary-btn pulse-hover"
          onClick={() => { setEditingTask(null); setShowNewTaskModal(true); }}
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Kanban Board Grid / Column Container View */}
      <div className="kanban-board-grid stacked-columns">
        {COLUMNS.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.id);

          return (
            <div key={col.id} className="kanban-column glass-panel">
              {/* Column Header */}
              <div className="kanban-column-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span className="kanban-col-dot" style={{ background: col.color }} />
                  <span className="kanban-col-title">{col.title}</span>
                </div>
                <span className="kanban-col-count">{colTasks.length}</span>
              </div>

              {/* Tasks List */}
              <div className="kanban-cards-list">
                {colTasks.length === 0 ? (
                  <div className="kanban-empty-col">
                    <span>No tasks in {col.title}</span>
                  </div>
                ) : (
                  colTasks.map(task => {
                    const priorityStyle = getPriorityBadge(task.priority);
                    const doneChecks = (task.checklist || []).filter(c => c.done).length;
                    const totalChecks = (task.checklist || []).length;

                    return (
                      <div key={task.id} className="kanban-task-card glass-panel" id={`task-${task.id}`}>
                        {/* Top card row: Priority + Column status changer */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span
                            className="task-priority-pill"
                            style={{
                              background: priorityStyle.bg,
                              color: priorityStyle.text,
                              border: `1px solid ${priorityStyle.border}`
                            }}
                          >
                            {task.priority}
                          </span>

                          <select
                            className="kanban-status-select"
                            value={task.status}
                            onChange={(e) => handleChangeStatus(task, e.target.value)}
                            title="Move to another status column"
                          >
                            {COLUMNS.map(c => (
                              <option key={c.id} value={c.id}>{c.title}</option>
                            ))}
                          </select>
                        </div>

                        {/* Title */}
                        <h4 className="kanban-task-title">{task.title}</h4>

                        {/* Description */}
                        {task.description && (
                          <p className="kanban-task-desc">{task.description}</p>
                        )}

                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="kanban-task-labels">
                            {task.labels.map((l, i) => (
                              <span key={i} className="task-label-chip">#{l}</span>
                            ))}
                          </div>
                        )}

                        {/* Subtask Checklist */}
                        {totalChecks > 0 && (
                          <div className="kanban-checklist-box">
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                              <span>Checklist</span>
                              <span>{doneChecks} / {totalChecks}</span>
                            </div>
                            <div className="kanban-checklist-items">
                              {task.checklist.map(c => (
                                <label key={c.id} className="kanban-check-item">
                                  <input
                                    type="checkbox"
                                    checked={c.done}
                                    onChange={() => handleToggleChecklist(task, c.id)}
                                  />
                                  <span style={{ textDecoration: c.done ? 'line-through' : 'none', opacity: c.done ? 0.6 : 1 }}>
                                    {c.text}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Footer: Assignee, Due date & Actions */}
                        <div className="kanban-card-footer">
                          <div className="kanban-assignee-wrap" title={`Assigned to ${task.assigneeName}`}>
                            <div className="post-avatar" style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                              {task.assigneeAvatar || task.assigneeName?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                            <span className="kanban-assignee-name">{task.assigneeName}</span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {task.dueDate && (
                              <span className="kanban-due-date" title={`Due on ${task.dueDate}`}>
                                📅 {task.dueDate.slice(5)}
                              </span>
                            )}

                            <button
                              className="icon-btn"
                              style={{ padding: '3px' }}
                              onClick={() => { setEditingTask(task); setShowNewTaskModal(true); }}
                              title="Edit Task"
                            >
                              <Edit3 size={13} />
                            </button>

                            {(isOwnerOrAdmin || task.assigneeId === currentUser?.username) && (
                              <button
                                className="icon-btn"
                                style={{ padding: '3px', color: 'var(--danger)' }}
                                onClick={async () => {
                                  const confirmed = await showConfirm(`Are you sure you want to delete task "${task.title}"?`, 'Delete Task', {
                                    isDanger: true,
                                    confirmText: 'Yes, Delete'
                                  });
                                  if (confirmed) onDeleteTask(task.id);
                                }}
                                title="Delete Task"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* New / Edit Task Modal */}
      {showNewTaskModal && (
        <NewTaskModal
          workspace={workspace}
          members={members}
          initialTask={editingTask}
          onSubmit={(taskData) => {
            if (editingTask) {
              onUpdateTask(taskData);
            } else {
              onAddTask(taskData);
            }
            setShowNewTaskModal(false);
            setEditingTask(null);
          }}
          onClose={() => {
            setShowNewTaskModal(false);
            setEditingTask(null);
          }}
        />
      )}
    </div>
  );
}
