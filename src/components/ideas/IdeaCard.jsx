import React from 'react';
import {
  Lightbulb, Users, MessageSquare, ThumbsUp, Bell, ArrowRight,
  Sparkles, CheckCircle2, Clock, Layers, UserCheck, Shield, ExternalLink, Trash2
} from 'lucide-react';
import { usePopup } from '../common/PopupDialog';

export function getStatusStyle(status) {
  switch (status) {
    case 'OPEN FOR CONTRIBUTION':
      return { bg: 'rgba(16, 185, 129, 0.15)', text: '#34d399', border: 'rgba(16, 185, 129, 0.3)' };
    case 'IN DEVELOPMENT':
      return { bg: 'rgba(59, 130, 246, 0.15)', text: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' };
    case 'PILOT / TESTING':
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' };
    case 'COMPLETED':
      return { bg: 'rgba(139, 92, 246, 0.15)', text: '#c084fc', border: 'rgba(139, 92, 246, 0.3)' };
    case 'DISCUSSION':
      return { bg: 'rgba(6, 182, 212, 0.15)', text: '#22d3ee', border: 'rgba(6, 182, 212, 0.3)' };
    case 'REJECTED':
      return { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
    case 'ARCHIVED':
      return { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)' };
    default:
      return { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' };
  }
}

export default function IdeaCard({
  idea,
  workspaces = [],
  currentUser,
  onViewDetails,
  onJoinClick,
  onToggleSupport,
  onToggleFollow,
  onNavigateToWorkspace,
  onDeleteIdea,
  pendingRequestCount = 0
}) {
  const { showConfirm } = usePopup();
  const isOwner = currentUser?.username === idea.creatorId;
  const isAdmin = currentUser?.role === 'admin';
  const canDelete = isOwner || isAdmin;
  const isSupported = (idea.supportedBy || []).includes(currentUser?.username);
  const isFollowed = (idea.followedBy || []).includes(currentUser?.username);
  const statusStyle = getStatusStyle(idea.status);

  // Check if idea has a valid existing active workspace
  const activeWorkspace = idea.workspaceId 
    ? (workspaces || []).find(w => w.id === idea.workspaceId && w.status !== 'CLOSED')
    : (workspaces || []).find(w => (w.ideaId === idea.id || String(w.ideaId) === String(idea.id)) && w.status !== 'CLOSED');

  // Format date
  const timeAgo = (() => {
    try {
      const diff = Date.now() - new Date(idea.createdAt).getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days === 0) return 'Today';
      if (days === 1) return '1 day ago';
      if (days < 30) return `${days} days ago`;
      return `${Math.floor(days / 30)} mo ago`;
    } catch {
      return 'Recently';
    }
  })();

  return (
    <div className="idea-card glass-panel" id={`idea-${idea.id}`}>
      {/* Top Meta Bar */}
      <div className="idea-card-header">
        <div className="idea-category-tag">
          <Layers size={13} /> {idea.category || 'General'}
        </div>
        <div
          className={`idea-status-pill status-${(idea.status || '').toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
          style={{
            background: statusStyle.bg,
            color: statusStyle.text,
            border: `1px solid ${statusStyle.border}`
          }}
        >
          <span className="idea-status-dot" />
          {idea.status}
        </div>
      </div>

      {/* Title & Description */}
      <div className="idea-card-body" onClick={() => onViewDetails(idea)} style={{ cursor: 'pointer' }}>
        <h3 className="idea-card-title">
          <Lightbulb size={20} className="idea-icon-glow" />
          {idea.title}
        </h3>
        <p className="idea-card-description">
          {idea.problem || idea.solution || 'A collaborative student innovation for CampusHub.'}
        </p>

        {/* Tags */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="idea-card-tags">
            {idea.tags.slice(0, 4).map((tag, idx) => (
              <span key={idx} className="idea-tag">
                #{tag}
              </span>
            ))}
            {idea.tags.length > 4 && (
              <span className="idea-tag-more">+{idea.tags.length - 4}</span>
            )}
          </div>
        )}
      </div>

      {/* Creator and Stats */}
      <div className="idea-card-meta">
        <div className="idea-creator-info">
          <div className="idea-avatar">
            {idea.creatorAvatar || idea.creatorName?.slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="idea-creator-text">
            <span className="idea-creator-name">{idea.creatorName || idea.creatorId}</span>
            <span className="idea-created-date">{timeAgo}</span>
          </div>
        </div>

        {/* Progress meter */}
        <div className="idea-progress-section">
          <div className="idea-progress-label">
            <span>Progress</span>
            <span className="idea-progress-val">{idea.progress || 0}%</span>
          </div>
          <div className="idea-progress-bar-bg">
            <div
              className="idea-progress-bar-fill"
              style={{
                width: `${idea.progress || 0}%`,
                background:
                  (idea.progress || 0) >= 80
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : (idea.progress || 0) >= 40
                    ? 'linear-gradient(90deg, #6366f1, #8b5cf6)'
                    : 'linear-gradient(90deg, #f59e0b, #d97706)'
              }}
            />
          </div>
        </div>
      </div>

      {/* Interactive Engagement Row */}
      <div className="idea-card-metrics">
        <button
          className={`idea-metric-btn ${isSupported ? 'active-supported' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSupport(idea.id);
          }}
          title={isSupported ? '✓ You have already supported this idea' : 'Support this idea'}
        >
          <ThumbsUp size={15} />
          <span>{idea.supportCount || (idea.supportedBy || []).length || 0}</span>
          <span className="metric-text-label">{isSupported ? 'Supported' : 'Support'}</span>
        </button>

        <div className="idea-metric-item" title="Discussion threads">
          <MessageSquare size={15} />
          <span>{activeWorkspace?.discussions?.length || idea.discussionCount || 0}</span>
          <span className="metric-text-label">Discussions</span>
        </div>

        <div className="idea-metric-item" title="Team members">
          <Users size={15} />
          <span>{activeWorkspace?.members?.length || activeWorkspace?.membersCount || (idea.contributors || []).length || 1}</span>
          <span className="metric-text-label">Members</span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="idea-card-footer">
        <button
          className="secondary-btn idea-view-btn"
          onClick={() => onViewDetails(idea)}
        >
          View Idea
        </button>

        {canDelete && onDeleteIdea && (
          <button
            className="post-delete-btn"
            style={{ padding: '0.45rem 0.75rem', fontSize: '0.82rem' }}
            onClick={async (e) => {
              e.stopPropagation();
              const confirmed = await showConfirm(`Are you sure you want to delete idea "${idea.title}"?`, 'Delete Idea', {
                isDanger: true,
                confirmText: 'Yes, Delete'
              });
              if (confirmed) onDeleteIdea(idea.id);
            }}
            title="Delete Idea"
          >
            <Trash2 size={14} /> Delete
          </button>
        )}

        {activeWorkspace ? (
          <button
            className="primary-btn idea-workspace-btn pulse-hover"
            onClick={() => onNavigateToWorkspace(activeWorkspace.id)}
            title={`Open ${activeWorkspace.name} Workspace`}
          >
            <Sparkles size={15} /> Workspace
          </button>
        ) : isOwner ? (
          <button
            className="primary-btn idea-owner-manage-btn"
            onClick={() => onViewDetails(idea)}
          >
            Manage Idea {pendingRequestCount > 0 && <span className="badge-count">{pendingRequestCount}</span>}
          </button>
        ) : (
          <button
            className="primary-btn idea-join-btn pulse-hover"
            onClick={() => onJoinClick(idea)}
          >
            <UserCheck size={15} /> Join Contribution
          </button>
        )}
      </div>
    </div>
  );
}
