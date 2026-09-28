import React from 'react';
import {
  CheckSquare, Users, MessageSquare, FileText, Target, Activity,
  Clock, ArrowUpRight, Plus, Sparkles, CheckCircle2, Terminal as TerminalIcon
} from 'lucide-react';

export default function WorkspaceOverview({
  workspace,
  tasks = [],
  milestones = [],
  discussions = [],
  files = [],
  activities = [],
  currentUser,
  onNavigateTab,
  onOpenNewTask
}) {
  const completedTasks = tasks.filter(t => t.status === 'DONE').length;
  const inProgressTasks = tasks.filter(t => t.status === 'IN PROGRESS').length;
  const pendingTasks = tasks.filter(t => t.status === 'TODO' || t.status === 'BACKLOG').length;
  const reviewTasks = tasks.filter(t => t.status === 'REVIEW').length;

  const completedMilestones = milestones.filter(m => m.completed).length;

  // Calculate dynamic progress if tasks exist
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : (workspace.progress || 0);

  return (
    <div className="workspace-overview-tab">
      {/* Progress & Quick Stats Card */}
      <div className="glass-panel workspace-progress-hero">
        <div className="workspace-progress-hero-left">
          <span className="overview-badge">
            <Sparkles size={14} /> Project Health &amp; Velocity
          </span>
          <h2 className="overview-title">Overall Development Progress</h2>
          <p className="overview-desc">
            {completedTasks} of {tasks.length} total tasks completed across all milestones.
          </p>

          <div className="overview-progress-bar-container">
            <div className="overview-progress-bar-bg">
              <div
                className="overview-progress-bar-fill"
                style={{ width: `${taskProgress}%` }}
              />
            </div>
            <span className="overview-progress-percentage">{taskProgress}%</span>
          </div>
        </div>

        <div className="workspace-progress-hero-right">
          <button
            className="primary-btn pulse-hover"
            onClick={onOpenNewTask}
            style={{ width: '100%', marginBottom: '0.6rem', justifyContent: 'center' }}
          >
            <Plus size={16} /> New Task
          </button>
          <button
            className="secondary-btn"
            onClick={() => onNavigateTab('terminal')}
            style={{ width: '100%', marginBottom: '0.6rem', justifyContent: 'center', background: 'rgba(99, 102, 241, 0.15)', borderColor: 'rgba(99, 102, 241, 0.35)', color: '#c7d2fe' }}
          >
            <TerminalIcon size={16} color="#818cf8" /> Open Code Terminal
          </button>
          <button
            className="secondary-btn"
            onClick={() => onNavigateTab('discussions')}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            <MessageSquare size={16} /> Join Discussions
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="responsive-grid grid-4" style={{ gap: '1rem', margin: '1.5rem 0' }}>
        {/* Code Terminal Card */}
        <div
          className="glass-panel overview-metric-card"
          onClick={() => onNavigateTab('terminal')}
          style={{ cursor: 'pointer', borderLeft: '3px solid #818cf8' }}
        >
          <div className="metric-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
            <TerminalIcon size={22} />
          </div>
          <div className="metric-info">
            <div className="metric-val">Code Terminal</div>
            <div className="metric-label">Online REPL Sandbox</div>
          </div>
          <div className="metric-sub">
            <span style={{ color: '#38bdf8' }}>⚡ JS, TS, Python, SQL</span>
          </div>
        </div>

        {/* Tasks Card */}
        <div
          className="glass-panel overview-metric-card"
          onClick={() => onNavigateTab('tasks')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon-wrap" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <CheckSquare size={22} />
          </div>
          <div className="metric-info">
            <div className="metric-val">{tasks.length}</div>
            <div className="metric-label">Tasks Total</div>
          </div>
          <div className="metric-sub">
            <span style={{ color: '#34d399' }}>✓ {completedTasks} Done</span> • <span>{inProgressTasks} In Dev</span>
          </div>
        </div>

        {/* Milestones Card */}
        <div
          className="glass-panel overview-metric-card"
          onClick={() => onNavigateTab('milestones')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
            <Target size={22} />
          </div>
          <div className="metric-info">
            <div className="metric-val">{completedMilestones} / {milestones.length}</div>
            <div className="metric-label">Milestones</div>
          </div>
          <div className="metric-sub">
            <span>{milestones.length - completedMilestones} in progress</span>
          </div>
        </div>

        {/* Team Members */}
        <div
          className="glass-panel overview-metric-card"
          onClick={() => onNavigateTab('members')}
          style={{ cursor: 'pointer' }}
        >
          <div className="metric-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24' }}>
            <Users size={22} />
          </div>
          <div className="metric-info">
            <div className="metric-val">{(workspace.members || []).length}</div>
            <div className="metric-label">Active Members</div>
          </div>
          <div className="metric-sub">
            <span>Collaborating</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Milestone Highlights & Recent Activity */}
      <div className="responsive-grid grid-2" style={{ gap: '1.25rem' }}>
        {/* Milestone Roadmap */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Target size={18} color="var(--accent-primary)" /> Project Milestones
            </h3>
            <button
              className="text-btn"
              onClick={() => onNavigateTab('milestones')}
              style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {milestones.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No milestones created yet.</p>
            ) : (
              milestones.slice(0, 3).map(m => (
                <div
                  key={m.id}
                  style={{
                    padding: '0.85rem 1rem',
                    background: m.completed ? 'rgba(16, 185, 129, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '10px',
                    border: m.completed ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem', color: m.completed ? '#34d399' : 'var(--text-primary)' }}>
                      {m.completed ? '✓ ' : ''}{m.title}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Due {m.dueDate}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
                    {m.description}
                  </p>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {(m.tasks || []).filter(t => t.done).length} / {(m.tasks || []).length} Deliverables Completed
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Live Activity Timeline Preview */}
        <div className="glass-panel" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={18} color="var(--accent-primary)" /> Recent Activity
            </h3>
            <button
              className="text-btn"
              onClick={() => onNavigateTab('activity')}
              style={{ fontSize: '0.82rem', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
            >
              Full Log <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {activities.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>No recorded activity yet.</p>
            ) : (
              activities.slice(0, 5).map(act => (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.85rem' }}>
                  <div className="post-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem', flexShrink: 0 }}>
                    {act.actorAvatar || act.actorName?.slice(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div>
                      <strong style={{ color: 'var(--text-primary)' }}>{act.actorName}</strong> {act.action}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
