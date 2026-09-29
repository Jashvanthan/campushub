import React, { useState } from 'react';
import {
  X, Lightbulb, Sparkles, Plus, Trash2, Paperclip, UploadCloud,
  Check, FileText, Image as ImageIcon, AlertCircle
} from 'lucide-react';
import { CATEGORIES, SKILLS_LIST, CONTRIBUTION_ROLES } from '../../data/seedIdeasAndWorkspaces';
import ModalPortal from '../common/ModalPortal';

export default function SubmitIdeaModal({ user, onSubmit, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    problem: '',
    solution: '',
    impact: '',
    category: CATEGORIES[0] || 'Technology',
    duration: '1–3 Months',
    teamSize: '4–6',
    autoCreateWorkspace: true
  });

  const [selectedSkills, setSelectedSkills] = useState(['React', 'Frontend', 'UI/UX']);
  const [customSkill, setCustomSkill] = useState('');

  const [selectedRoles, setSelectedRoles] = useState(['Frontend Developer', 'UI/UX Designer', 'Backend Developer']);
  const [customRole, setCustomRole] = useState('');

  const [tags, setTags] = useState(['SmartCampus', 'Innovation']);
  const [tagInput, setTagInput] = useState('');

  const [attachments, setAttachments] = useState([]);
  const [error, setError] = useState('');

  // Handle skill toggles
  const toggleSkill = (skill) => {
    setSelectedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const addCustomSkill = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = customSkill.trim();
    if (!val) return;
    if (!selectedSkills.includes(val)) {
      setSelectedSkills(prev => [...prev, val]);
    }
    setCustomSkill('');
  };

  // Handle role toggles
  const toggleRole = (role) => {
    setSelectedRoles(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
  };

  const addCustomRole = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = customRole.trim();
    if (!val) return;
    if (!selectedRoles.includes(val)) {
      setSelectedRoles(prev => [...prev, val]);
    }
    setCustomRole('');
  };

  // Handle tags
  const addTag = (e) => {
    if (e && (e.key === 'Enter' || e.key === ',')) {
      e.preventDefault();
      const val = tagInput.trim().replace(/^#/, '');
      if (val && !tags.includes(val)) {
        setTags(prev => [...prev, val]);
      }
      setTagInput('');
    }
  };

  const handleAddTagClick = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const val = tagInput.trim().replace(/^#/, '');
    if (val && !tags.includes(val)) {
      setTags(prev => [...prev, val]);
    }
    setTagInput('');
  };

  const removeTag = (t) => {
    setTags(prev => prev.filter(item => item !== t));
  };

  // Handle file uploads (Safe base64 data URLs for all files)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach(file => {
      const reader = new FileReader();
      const isImg = file.type.startsWith('image/');
      reader.onload = () => {
        setAttachments(prev => [
          ...prev,
          {
            id: `att-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
            type: file.type || (isImg ? 'image/png' : 'application/octet-stream'),
            url: reader.result,
            isImage: isImg
          }
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (id) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please enter your idea title.');
      return;
    }
    if (!formData.problem.trim()) {
      setError('Please describe the problem you are solving.');
      return;
    }
    if (!formData.solution.trim()) {
      setError('Please describe your proposed solution.');
      return;
    }
    if (!formData.impact.trim()) {
      setError('Please describe the expected impact.');
      return;
    }

    // Capture any pending inputs in custom fields
    const finalSkills = [...selectedSkills];
    if (customSkill.trim() && !finalSkills.includes(customSkill.trim())) {
      finalSkills.push(customSkill.trim());
    }

    const finalRoles = [...selectedRoles];
    if (customRole.trim() && !finalRoles.includes(customRole.trim())) {
      finalRoles.push(customRole.trim());
    }

    const finalTags = [...tags];
    const pendingTag = tagInput.trim().replace(/^#/, '');
    if (pendingTag && !finalTags.includes(pendingTag)) {
      finalTags.push(pendingTag);
    }

    if (finalSkills.length === 0) {
      setError('Please select at least one required skill.');
      return;
    }
    if (finalRoles.length === 0) {
      setError('Please select at least one contribution role needed.');
      return;
    }

    const currentUsername = user?.username || 'student1';
    const currentName = user?.name || user?.username || currentUsername;
    const currentAvatar = user?.avatar || currentUsername.slice(0, 2).toUpperCase();
    const currentDept = user?.department || 'Campus Community';

    const newIdeaId = `idea-${Date.now()}`;
    const newWorkspaceId = formData.autoCreateWorkspace ? `ws-${Date.now()}` : null;

    const newIdea = {
      id: newIdeaId,
      title: formData.title.trim(),
      problem: formData.problem.trim(),
      solution: formData.solution.trim(),
      impact: formData.impact.trim(),
      category: formData.category,
      status: 'OPEN FOR CONTRIBUTION',
      tags: finalTags.length ? finalTags : ['Innovation'],
      skillsRequired: finalSkills,
      contributionTypes: finalRoles,
      duration: formData.duration,
      teamSize: formData.teamSize,
      creatorId: currentUsername,
      creatorName: currentName,
      creatorAvatar: currentAvatar,
      creatorDepartment: currentDept,
      supportedBy: [currentUsername],
      supportCount: 1,
      followedBy: [currentUsername],
      progress: 0,
      workspaceId: newWorkspaceId,
      attachments: attachments,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let newWorkspace = null;
    if (newWorkspaceId) {
      newWorkspace = {
        id: newWorkspaceId,
        ideaId: newIdeaId,
        name: formData.title.trim(),
        description: formData.solution.trim(),
        category: formData.category,
        status: 'OPEN FOR CONTRIBUTION',
        progress: 0,
        ownerId: currentUsername,
        ownerName: currentName,
        createdAt: new Date().toISOString(),
        members: [
          {
            userId: currentUsername,
            name: currentName,
            avatar: currentAvatar,
            role: 'Owner',
            contributionRole: 'Idea Creator & Project Lead',
            department: currentDept,
            joinedAt: new Date().toISOString(),
            tasksCompleted: 0,
            totalAssigned: 0
          }
        ]
      };
    }

    onSubmit(newIdea, newWorkspace);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel idea-submit-modal" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <Sparkles size={24} color="#f59e0b" /> Submit Your Campus Idea
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
              Transform your innovation into a live student-led project and team workspace.
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {error && (
          <div className="idea-form-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="idea-submit-form">
          {/* Idea Title */}
          <div className="form-group">
            <label className="form-label">Idea Title *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Smart Campus Navigation & AR Wayfinding"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          {/* Category & Duration & Team Size */}
          <div className="form-row grid-3">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                className="form-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Estimated Duration</label>
              <select
                className="form-control"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
              >
                <option value="1 Week">1 Week</option>
                <option value="2–4 Weeks">2–4 Weeks</option>
                <option value="1–3 Months">1–3 Months</option>
                <option value="3+ Months">3+ Months</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Team Size</label>
              <select
                className="form-control"
                value={formData.teamSize}
                onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
              >
                <option value="1">1 (Solo)</option>
                <option value="2–3">2–3 Members</option>
                <option value="4–6">4–6 Members</option>
                <option value="7+">7+ Members</option>
              </select>
            </div>
          </div>

          {/* Problem Statement */}
          <div className="form-group">
            <label className="form-label">What problem are you trying to solve? *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Describe the real-world friction, inefficiency, or challenge faced by students or campus staff..."
              value={formData.problem}
              onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
              required
            />
          </div>

          {/* Proposed Solution */}
          <div className="form-group">
            <label className="form-label">Proposed Solution *</label>
            <textarea
              className="form-control"
              rows={3}
              placeholder="Explain your approach, architecture, technologies, and features..."
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              required
            />
          </div>

          {/* Expected Impact */}
          <div className="form-group">
            <label className="form-label">Expected Impact *</label>
            <textarea
              className="form-control"
              rows={2}
              placeholder="How will this help students, faculty, or the campus? (e.g. saves 200 staff hours, improves study scores by 30%)..."
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              required
            />
          </div>

          {/* Skills Required */}
          <div className="form-group">
            <label className="form-label">Skills Required * (Select all that apply)</label>
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
                    {active && <Check size={12} />}
                    {skill}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <input
                type="text"
                className="form-control"
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                placeholder="+ Add custom skill tag..."
                value={customSkill}
                onChange={(e) => setCustomSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomSkill(e); }}
              />
              <button type="button" className="secondary-btn" onClick={addCustomSkill}>Add</button>
            </div>
          </div>

          {/* Contribution Types / Roles Needed */}
          <div className="form-group">
            <label className="form-label">Contribution Roles Needed *</label>
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
                    {active && <Check size={12} />}
                    {role}
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.6rem' }}>
              <input
                type="text"
                className="form-control"
                style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                placeholder="+ Add other required role..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') addCustomRole(e); }}
              />
              <button type="button" className="secondary-btn" onClick={addCustomRole}>Add</button>
            </div>
          </div>

          {/* Tags */}
          <div className="form-group">
            <label className="form-label">Tags (Type &amp; press Enter or click Add)</label>
            <div className="tags-input-wrapper">
              <div className="selected-tags-chips">
                {tags.map(t => (
                  <span key={t} className="tag-chip">
                    #{t}
                    <button type="button" onClick={() => removeTag(t)}><X size={12} /></button>
                  </span>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                <input
                  type="text"
                  className="tags-sub-input"
                  style={{ flex: 1 }}
                  placeholder="Type tag (e.g. AI, Robotics) & press Enter..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={addTag}
                />
                {tagInput.trim() && (
                  <button type="button" className="secondary-btn" style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }} onClick={handleAddTagClick}>
                    Add Tag
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="form-group">
            <label className="form-label">Attachments (Architecture diagrams, PDFs, Wireframes)</label>
            <div className="file-dropzone">
              <input
                type="file"
                multiple
                className="file-dropzone-input"
                onChange={handleFileUpload}
                accept="image/*,application/pdf,.doc,.docx,.zip,.txt"
              />
              <UploadCloud size={28} className="text-accent" />
              <p>Drag and drop files here, or <span className="highlight-text">browse files</span></p>
              <span className="file-dropzone-sub">Supports PNG, JPG, PDF, DOCX, ZIP</span>
            </div>

            {attachments.length > 0 && (
              <div className="attachments-list">
                {attachments.map(att => (
                  <div key={att.id} className="attachment-item glass-panel">
                    <div className="att-left">
                      {att.isImage ? <ImageIcon size={18} /> : <FileText size={18} />}
                      <span className="att-name">{att.name}</span>
                      <span className="att-size">({att.size})</span>
                    </div>
                    <button
                      type="button"
                      className="icon-btn-danger"
                      onClick={() => removeAttachment(att.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Auto create Workspace toggle */}
          <div className="form-group checkbox-group glass-panel" style={{ padding: '0.85rem 1.2rem', margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: 0 }}>
              <input
                type="checkbox"
                checked={formData.autoCreateWorkspace}
                onChange={(e) => setFormData({ ...formData, autoCreateWorkspace: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
              />
              <div>
                <span style={{ fontWeight: 600, display: 'block' }}>Create Team Workspace automatically</span>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Initializes a dedicated workspace with Kanban task board, discussions, and file storage.
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn pulse-hover" style={{ minWidth: '160px' }}>
              <Lightbulb size={18} /> Submit Idea
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
