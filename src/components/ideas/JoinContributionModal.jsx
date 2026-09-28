import React, { useState } from 'react';
import { X, UserPlus, CheckCircle, Send, AlertCircle } from 'lucide-react';
import { SKILLS_LIST, CONTRIBUTION_ROLES } from '../../data/seedIdeasAndWorkspaces';
import ModalPortal from '../common/ModalPortal';

export default function JoinContributionModal({ idea, user, onSubmit, onClose }) {
  const [selectedRoles, setSelectedRoles] = useState(
    idea.contributionTypes && idea.contributionTypes.length ? [idea.contributionTypes[0]] : ['Frontend Developer']
  );
  const [selectedSkills, setSelectedSkills] = useState(
    idea.skillsRequired && idea.skillsRequired.length ? idea.skillsRequired.slice(0, 2) : ['React']
  );
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const toggleRole = (r) => {
    setSelectedRoles(prev =>
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const toggleSkill = (s) => {
    setSelectedSkills(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      setError('Please select at least one role you wish to contribute as.');
      return;
    }
    if (!message.trim()) {
      setError('Please write a brief statement on how you plan to contribute.');
      return;
    }

    const request = {
      id: `req-${Date.now()}`,
      ideaId: idea.id,
      workspaceId: idea.workspaceId,
      applicantId: user.username,
      applicantName: user.name || user.username,
      applicantAvatar: user.avatar || user.username.slice(0, 2).toUpperCase(),
      applicantDepartment: user.department || 'Student',
      roles: selectedRoles,
      skills: selectedSkills,
      message: message.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    onSubmit(request);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '600px', background: 'var(--bg-secondary)' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserPlus size={22} color="var(--accent-primary)" /> Join Project Team
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Apply to collaborate on <strong style={{ color: 'var(--text-primary)' }}>"{idea.title}"</strong>
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {error && (
          <div className="idea-form-error-banner" style={{ margin: '1rem 0' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          {/* Roles */}
          <div className="form-group">
            <label className="form-label">How would you like to contribute? *</label>
            <div className="tag-selector-container">
              {CONTRIBUTION_ROLES.map(role => {
                const active = selectedRoles.includes(role);
                return (
                  <button
                    type="button"
                    key={role}
                    className={`tag-pill-btn ${active ? 'active' : ''}`}
                    onClick={() => toggleRole(role)}
                  >
                    {active && <CheckCircle size={12} />}
                    {role}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Skills */}
          <div className="form-group">
            <label className="form-label">Skills you bring to the table</label>
            <div className="tag-selector-container">
              {SKILLS_LIST.map(skill => {
                const active = selectedSkills.includes(skill);
                return (
                  <button
                    type="button"
                    key={skill}
                    className={`tag-pill-btn ${active ? 'active' : ''}`}
                    onClick={() => toggleSkill(skill)}
                  >
                    {active && <CheckCircle size={12} />}
                    {skill}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Statement */}
          <div className="form-group">
            <label className="form-label">Why are you interested? / Contribution Statement *</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Describe your background, what components you would like to build, or your experience relevant to this idea..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn pulse-hover">
              <Send size={16} /> Send Contribution Request
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
