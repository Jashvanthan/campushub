import React, { useState } from 'react';
import { X, CheckSquare, Plus, Trash2, Calendar, AlertCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

export default function NewTaskModal({
  workspace,
  members = [],
  initialTask = null,
  onSubmit,
  onClose
}) {
  const [title, setTitle] = useState(initialTask?.title || '');
  const [description, setDescription] = useState(initialTask?.description || '');
  const [assigneeId, setAssigneeId] = useState(initialTask?.assigneeId || (members[0]?.userId || ''));
  const [priority, setPriority] = useState(initialTask?.priority || 'MEDIUM');
  const [status, setStatus] = useState(initialTask?.status || 'TODO');
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || '');
  const [labels, setLabels] = useState(initialTask?.labels || ['Feature']);
  const [labelInput, setLabelInput] = useState('');
  const [checklist, setChecklist] = useState(initialTask?.checklist || []);
  const [checkInput, setCheckInput] = useState('');
  const [error, setError] = useState('');

  const addLabel = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = labelInput.trim();
      if (val && !labels.includes(val)) {
        setLabels(prev => [...prev, val]);
      }
      setLabelInput('');
    }
  };

  const removeLabel = (lbl) => {
    setLabels(prev => prev.filter(l => l !== lbl));
  };

  const addChecklistItem = (e) => {
    e.preventDefault();
    if (!checkInput.trim()) return;
    setChecklist(prev => [
      ...prev,
      { id: `c-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, text: checkInput.trim(), done: false }
    ]);
    setCheckInput('');
  };

  const removeChecklistItem = (id) => {
    setChecklist(prev => prev.filter(c => c.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    const assignedMember = members.find(m => m.userId === assigneeId);

    const taskData = {
      id: initialTask?.id || `task-${Date.now()}`,
      workspaceId: workspace.id,
      title: title.trim(),
      description: description.trim(),
      assigneeId: assigneeId,
      assigneeName: assignedMember?.name || assigneeId || 'Unassigned',
      assigneeAvatar: assignedMember?.avatar || assigneeId?.slice(0, 2).toUpperCase() || 'U',
      priority,
      status,
      dueDate: dueDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      labels,
      checklist,
      createdAt: initialTask?.createdAt || new Date().toISOString()
    };

    onSubmit(taskData);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CheckSquare size={22} color="var(--accent-primary)" />
            {initialTask ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button className="icon-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {error && (
          <div className="idea-form-error-banner" style={{ margin: '1rem 0' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          {/* Title */}
          <div className="form-group">
            <label className="form-label">Task Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Implement AR indoor floor map"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Provide technical specifications, context, or acceptance criteria..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Row: Assignee, Priority, Status */}
          <div className="form-row grid-3">
            <div className="form-group">
              <label className="form-label">Assignee</label>
              <select
                className="form-control"
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
              >
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>
                    {m.name || m.userId} ({m.contributionRole || m.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select
                className="form-control"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Column / Status</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="BACKLOG">Backlog</option>
                <option value="TODO">To Do</option>
                <option value="IN PROGRESS">In Progress</option>
                <option value="REVIEW">Review</option>
                <option value="DONE">Done</option>
              </select>
            </div>
          </div>

          {/* Due Date */}
          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          {/* Labels */}
          <div className="form-group">
            <label className="form-label">Labels (Press Enter to add)</label>
            <div className="tags-input-wrapper">
              <div className="selected-tags-chips">
                {labels.map(l => (
                  <span key={l} className="tag-chip">
                    {l}
                    <button type="button" onClick={() => removeLabel(l)}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                className="tags-sub-input"
                placeholder="Frontend, Backend, UI/UX, QA..."
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={addLabel}
              />
            </div>
          </div>

          {/* Subtask Checklist */}
          <div className="form-group">
            <label className="form-label">Subtask Checklist</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Add checklist subtask..."
                value={checkInput}
                onChange={(e) => setCheckInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addChecklistItem(e); }}
              />
              <button type="button" className="secondary-btn" onClick={addChecklistItem}>
                <Plus size={16} /> Add
              </button>
            </div>

            {checklist.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {checklist.map(c => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{c.text}</span>
                    <button type="button" className="icon-btn-danger" onClick={() => removeChecklistItem(c.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn pulse-hover">
              {initialTask ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </ModalPortal>
  );
}
