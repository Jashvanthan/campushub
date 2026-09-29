import React, { useState } from 'react';
import {
  X, Lightbulb, Users, MessageSquare, ThumbsUp, Bell, Sparkles,
  ArrowRight, CheckCircle2, Clock, Layers, UserCheck, Shield, FileText,
  Image as ImageIcon, Download, Edit3, Trash2, Check, AlertCircle, Share2
} from 'lucide-react';
import { IDEA_STATUSES } from '../../data/seedIdeasAndWorkspaces';
import { getStatusStyle } from './IdeaCard';
import { usePopup } from '../common/PopupDialog';
import ModalPortal from '../common/ModalPortal';

export default function IdeaDetailModal({
  idea,
  currentUser,
  workspace,
  pendingRequestCount = 0,
  onClose,
  onJoinClick,
  onToggleSupport,
  onToggleFollow,
  onNavigateToWorkspace,
  onManageRequests,
  onUpdateStatus,
  onDeleteIdea
}) {
  const { showAlert, showConfirm } = usePopup();
  const isOwner = currentUser?.username === idea.creatorId;
  const isAdmin = currentUser?.role === 'admin';
  const isSupported = (idea.supportedBy || []).includes(currentUser?.username);
  const isFollowed = (idea.followedBy || []).includes(currentUser?.username);
  const isMember = workspace?.members?.some(m => m.userId === currentUser?.username);
  const statusStyle = getStatusStyle(idea.status);

  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  const handleShare = async () => {
    try {
      const compact = {
        id: idea.id,
        title: idea.title,
        description: idea.description || '',
        type: 'idea',
        department: idea.department || '',
        author: { name: idea.creatorName || 'Student', avatar: idea.creatorAvatar || 'S1' },
        authorId: idea.creatorId || 'student1',
        tags: idea.tags || [],
        likes: (idea.supportedBy || []).length || 0,
        status: idea.status || 'Proposed'
      };
      const json = JSON.stringify(compact);
      const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
      const shareUrl = `${window.location.origin}/post/${idea.id}?pdata=${b64}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        showAlert('Idea link has been copied to your clipboard!', 'Link Copied', 'success');
      }
    } catch (_) {
      const fallbackUrl = `${window.location.origin}/post/${idea.id}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fallbackUrl);
        showAlert('Idea link has been copied to your clipboard!', 'Link Copied', 'success');
      }
    }
  };

  const handleDelete = async () => {
    const confirmed = await showConfirm(`Are you sure you want to delete "${idea.title}"?`, 'Delete Idea', {
      isDanger: true,
      confirmText: 'Yes, Delete'
    });
    if (confirmed) {
      onDeleteIdea(idea.id);
      onClose();
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel idea-detail-modal" style={{ maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto' }}>
        {/* Header */}
        <div className="modal-header" style={{ alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
              <span className="idea-category-tag">
                <Layers size={13} /> {idea.category}
              </span>

              {/* Status Pill with Change capability for Owner/Admin */}
              {(isOwner || isAdmin) ? (
                <div style={{ position: 'relative' }}>
                  <button
                    type="button"
                    className="idea-status-pill"
                    style={{
                      background: statusStyle.bg,
                      color: statusStyle.text,
                      border: `1px solid ${statusStyle.border}`,
                      cursor: 'pointer'
                    }}
                    onClick={() => setStatusMenuOpen(!statusMenuOpen)}
                    title="Click to update idea status"
                  >
                    <span className="idea-status-dot" style={{ background: statusStyle.text }} />
                    {idea.status} ▾
                  </button>
                  {statusMenuOpen && (
                    <div className="glass-panel" style={{ position: 'absolute', top: '100%', left: 0, marginTop: '0.4rem', zIndex: 50, background: 'var(--bg-secondary)', padding: '0.4rem', minWidth: '200px', borderRadius: '10px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', padding: '0.3rem 0.6rem', textTransform: 'uppercase', fontWeight: 700 }}>
                        Change Lifecycle Status:
                      </div>
                      {IDEA_STATUSES.map(st => (
                        <button
                          key={st}
                          className="nav-link"
                          style={{ width: '100%', textAlign: 'left', padding: '0.4rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px' }}
                          onClick={() => {
                            onUpdateStatus(idea.id, st);
                            setStatusMenuOpen(false);
                          }}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="idea-status-pill"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.text,
                    border: `1px solid ${statusStyle.border}`
                  }}
                >
                  <span className="idea-status-dot" style={{ background: statusStyle.text }} />
                  {idea.status}
                </div>
              )}
            </div>

            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', lineHeight: 1.3, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lightbulb size={26} className="idea-icon-glow" />
              {idea.title}
            </h1>

            {/* Creator line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <div className="idea-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                {idea.creatorAvatar || idea.creatorName?.slice(0, 2).toUpperCase() || 'U'}
              </div>
              <span>Proposed by <strong style={{ color: 'var(--text-primary)' }}>{idea.creatorName || idea.creatorId}</strong> ({idea.creatorDepartment || 'Campus'})</span>
              <span>•</span>
              <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button className="icon-btn" onClick={handleShare} title="Share Idea"><Share2 size={20} /></button>
            {(isOwner || isAdmin) && (
              <button
                className="icon-btn"
                style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)' }}
                onClick={handleDelete}
                title="Delete Idea"
              >
                <Trash2 size={20} />
              </button>
            )}
            <button className="icon-btn" onClick={onClose}><X size={24} /></button>
          </div>
        </div>

        {/* Progress & Quick Stats Card */}
        <div className="glass-panel" style={{ margin: '1.25rem 0', padding: '1rem 1.25rem', background: 'rgba(255, 255, 255, 0.02)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', alignItems: 'center' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Estimated Timeline</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>⏱ {idea.duration || '1–3 Months'}</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Target Team</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>👥 {idea.teamSize || '4–6'} Members</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Support</span>
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>💡 {idea.supportCount || (idea.supportedBy || []).length || 0} Supporters</span>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, display: 'block' }}>Progress ({idea.progress || 0}%)</span>
              <div className="idea-progress-bar-bg" style={{ marginTop: '4px' }}>
                <div
                  className="idea-progress-bar-fill"
                  style={{ width: `${idea.progress || 0}%`, background: 'var(--accent-gradient)' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="idea-detail-sections" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Problem */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#f87171', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🎯 Problem Statement
            </h3>
            <p style={{ lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{idea.problem}</p>
          </div>

          {/* Solution */}
          <div className="glass-panel" style={{ padding: '1.25rem', background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
            <h3 style={{ fontSize: '1.05rem', color: '#60a5fa', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              💡 Proposed Solution &amp; Architecture
            </h3>
            <p style={{ lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{idea.solution}</p>
          </div>

          {/* Impact */}
          <div className="glass-panel idea-impact-box" style={{ padding: '1.25rem' }}>
            <h3 className="idea-impact-title" style={{ fontSize: '1.05rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              🚀 Expected Campus Impact
            </h3>
            <p className="idea-impact-text" style={{ lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>{idea.impact}</p>
          </div>

          {/* Skills & Roles */}
          <div className="responsive-grid grid-2" style={{ gap: '1rem' }}>
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Required Skills
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(idea.skillsRequired || []).map((skill, i) => (
                  <span key={i} className="idea-skill-tag">
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Contribution Roles Needed
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {(idea.contributionTypes || []).map((role, i) => (
                  <span key={i} className="idea-role-tag">
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Attachments */}
          {idea.attachments && idea.attachments.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Attachments &amp; Architecture Documents ({idea.attachments.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {idea.attachments.map((att, idx) => (
                  <div key={idx} className="glass-panel" style={{ padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.03)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                      <FileText size={18} color="var(--accent-primary)" />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{att.name}</div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{att.size || 'Document'}</span>
                      </div>
                    </div>
                    {att.url && (
                      <a href={att.url} download={att.name} className="icon-btn" title="Download">
                        <Download size={16} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Contributors in Workspace */}
          {workspace?.members && workspace.members.length > 0 && (
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
              <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Contributors ({workspace.members.length})
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {workspace.members.map(member => (
                  <div key={member.userId} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 0.85rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px' }}>
                    <div className="post-avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                      {member.avatar || member.name?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{member.name}</div>
                      <span style={{ fontSize: '0.75rem', color: member.role === 'Owner' ? '#a78bfa' : 'var(--text-secondary)' }}>
                        {member.contributionRole || member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className={`idea-metric-btn ${isSupported ? 'active-supported' : ''}`}
              onClick={() => onToggleSupport(idea.id)}
              style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}
            >
              <ThumbsUp size={16} />
              <span>{idea.supportCount || (idea.supportedBy || []).length || 0} Support</span>
            </button>

            <button
              className={`idea-metric-btn ${isFollowed ? 'active-followed' : ''}`}
              onClick={() => onToggleFollow(idea.id)}
              style={{ padding: '0.5rem 1rem', borderRadius: '10px' }}
            >
              <Bell size={16} />
              <span>{isFollowed ? 'Following' : 'Follow Idea'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Manage Requests Button for Owner */}
            {(isOwner || isAdmin) && (
              <button
                className="secondary-btn"
                style={{ position: 'relative' }}
                onClick={() => onManageRequests(idea)}
              >
                <UserCheck size={16} /> Review Applications
                {pendingRequestCount > 0 && (
                  <span className="badge-count" style={{ marginLeft: '0.4rem', background: 'var(--danger)', color: '#fff', padding: '1px 6px', borderRadius: '10px', fontSize: '0.75rem' }}>
                    {pendingRequestCount}
                  </span>
                )}
              </button>
            )}

            {/* Enter Workspace if already a member/owner */}
            {(isOwner || isMember || isAdmin) && idea.workspaceId ? (
              <button
                className="primary-btn pulse-hover"
                onClick={() => onNavigateToWorkspace(idea.workspaceId)}
              >
                <Sparkles size={16} /> Enter Team Workspace 🚀
              </button>
            ) : (
              <button
                className="primary-btn pulse-hover"
                onClick={() => onJoinClick(idea)}
              >
                <UserCheck size={16} /> Join This Project
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
