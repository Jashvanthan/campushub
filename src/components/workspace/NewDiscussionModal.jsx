import React, { useState } from 'react';
import { X, MessageSquare, AlertCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

export default function NewDiscussionModal({
  workspace,
  user,
  onSubmit,
  onClose
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [content, setContent] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Discussion title is required.');
      return;
    }
    if (!content.trim()) {
      setError('Please provide initial topic content or questions.');
      return;
    }

    const newDisc = {
      id: `disc-${Date.now()}`,
      workspaceId: workspace.id,
      title: title.trim(),
      category,
      authorId: user.username,
      authorName: user.name || user.username,
      authorAvatar: user.avatar || user.username.slice(0, 2).toUpperCase(),
      content: content.trim(),
      likes: [],
      replies: [],
      isPinned: false,
      isSolved: false,
      createdAt: new Date().toISOString()
    };

    onSubmit(newDisc);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div className="modal-content glass-panel" style={{ maxWidth: '600px', background: 'var(--bg-secondary)' }}>
          <div className="modal-header">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <MessageSquare size={22} color="var(--accent-primary)" /> Start Team Discussion
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
              <label className="form-label">Discussion Title *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., Should we use PostgreSQL or MongoDB for telemetry data?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="General">General</option>
                <option value="Development">Development</option>
                <option value="Design">Design</option>
                <option value="Research">Research</option>
                <option value="Announcements">Announcements</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Message / Details *</label>
              <textarea
                className="form-control"
                rows={5}
                placeholder="Explain the technical problem, tradeoffs, or share context with your team..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
              <button type="button" className="secondary-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="primary-btn pulse-hover">
                Post Discussion
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
