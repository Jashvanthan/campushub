import React, { useState } from 'react';
import { X, Target, Plus, Trash2, AlertCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

export default function NewMilestoneModal({
  workspace,
  onSubmit,
  onClose
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [tasks, setTasks] = useState([]);
  const [taskInput, setTaskInput] = useState('');
  const [error, setError] = useState('');

  const addTask = (e) => {
    e.preventDefault();
    if (!taskInput.trim()) return;
    setTasks(prev => [
      ...prev,
      { id: `mt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, title: taskInput.trim(), done: false }
    ]);
    setTaskInput('');
  };

  const removeTask = (id) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Milestone title is required.');
      return;
    }

    const newMilestone = {
      id: `ms-${Date.now()}`,
      workspaceId: workspace.id,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      completed: false,
      tasks: tasks.length ? tasks : [{ id: `mt-init`, title: 'Core milestone setup', done: false }]
    };

    onSubmit(newMilestone);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '600px', background: 'var(--bg-secondary)' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={22} color="var(--accent-primary)" /> Add Project Milestone
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
          <div className="form-group">
            <label className="form-label">Milestone Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Milestone 2: Core Algorithm & API Integration"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description / Deliverables</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Outline what must be achieved to complete this milestone..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target Completion Date</label>
            <input
              type="date"
              className="form-control"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Key Deliverable Subtasks</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Conduct user testing with 20 students"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addTask(e); }}
              />
              <button type="button" className="secondary-btn" onClick={addTask}>
                <Plus size={16} /> Add
              </button>
            </div>

            {tasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {tasks.map(t => (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.8rem', background: 'rgba(255,255,255,0.03)', borderRadius: '6px' }}>
                    <span style={{ fontSize: '0.85rem' }}>{t.title}</span>
                    <button type="button" className="icon-btn-danger" onClick={() => removeTask(t.id)}>
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
              Create Milestone
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
