import React, { useState } from 'react';
import { Target, Plus, CheckCircle2, Circle, Clock, Trash2, Calendar } from 'lucide-react';
import NewMilestoneModal from './NewMilestoneModal';
import { usePopup } from '../common/PopupDialog';

export default function WorkspaceMilestones({
  workspace,
  milestones = [],
  currentUser,
  onAddMilestone,
  onUpdateMilestone,
  onDeleteMilestone
}) {
  const { showConfirm } = usePopup();
  const [showModal, setShowModal] = useState(false);

  const isOwnerOrAdmin = (workspace.members || []).some(
    m => m.userId === currentUser?.username && (m.role === 'Owner' || m.role === 'Admin')
  ) || currentUser?.role === 'admin';

  // Toggle subtask in milestone
  const handleToggleSubtask = (milestone, subtaskId) => {
    const updatedTasks = (milestone.tasks || []).map(t =>
      t.id === subtaskId ? { ...t, done: !t.done } : t
    );
    const allDone = updatedTasks.length > 0 && updatedTasks.every(t => t.done);
    onUpdateMilestone({
      ...milestone,
      tasks: updatedTasks,
      completed: allDone
    });
  };

  // Toggle milestone overall completion
  const handleToggleMilestone = (milestone) => {
    const newCompleted = !milestone.completed;
    const updatedTasks = (milestone.tasks || []).map(t => ({ ...t, done: newCompleted }));
    onUpdateMilestone({
      ...milestone,
      completed: newCompleted,
      tasks: updatedTasks
    });
  };

  return (
    <div className="workspace-milestones-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Target size={22} color="var(--accent-primary)" /> Project Milestones &amp; Roadmap
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            Track key delivery phases, research stages, and pilot release checkpoints.
          </p>
        </div>

        {isOwnerOrAdmin && (
          <button className="primary-btn pulse-hover" onClick={() => setShowModal(true)}>
            <Plus size={16} /> + New Milestone
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {milestones.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.8 }}>
            <Target size={40} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto' }} />
            <h3>No milestones yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Break this project down into major development phases and goals.
            </p>
            {isOwnerOrAdmin && (
              <button className="primary-btn" onClick={() => setShowModal(true)} style={{ marginTop: '1rem' }}>
                <Plus size={16} /> Create First Milestone
              </button>
            )}
          </div>
        ) : (
          milestones.map(milestone => {
            const completedCount = (milestone.tasks || []).filter(t => t.done).length;
            const totalCount = (milestone.tasks || []).length;
            const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : (milestone.completed ? 100 : 0);

            return (
              <div
                key={milestone.id}
                className="glass-panel milestone-card"
                style={{
                  padding: '1.5rem',
                  border: milestone.completed ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border-color)',
                  background: milestone.completed ? 'rgba(16, 185, 129, 0.03)' : 'rgba(255, 255, 255, 0.02)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                      className="icon-btn"
                      onClick={() => handleToggleMilestone(milestone)}
                      style={{ color: milestone.completed ? '#34d399' : 'var(--text-secondary)', padding: '4px' }}
                      title={milestone.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {milestone.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                    </button>
                    <div>
                      <h3 style={{ margin: 0, fontSize: '1.15rem', color: milestone.completed ? '#34d399' : 'var(--text-primary)' }}>
                        {milestone.title}
                      </h3>
                      {milestone.description && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: '0.2rem 0 0 0' }}>
                          {milestone.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {milestone.dueDate && (
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={14} /> Target: {milestone.dueDate}
                      </span>
                    )}

                    {isOwnerOrAdmin && (
                      <button
                        className="icon-btn"
                        style={{ color: 'var(--danger)' }}
                        onClick={async () => {
                          const confirmed = await showConfirm(`Are you sure you want to delete milestone "${milestone.title}"?`, 'Delete Milestone', {
                            isDanger: true,
                            confirmText: 'Yes, Delete'
                          });
                          if (confirmed) {
                            onDeleteMilestone(milestone.id);
                          }
                        }}
                        title="Delete Milestone"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ margin: '1rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                    <span>Deliverables Progress</span>
                    <span>{completedCount} of {totalCount} completed ({pct}%)</span>
                  </div>
                  <div className="overview-progress-bar-bg" style={{ height: '8px' }}>
                    <div
                      className="overview-progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: milestone.completed ? '#10b981' : 'var(--accent-gradient)'
                      }}
                    />
                  </div>
                </div>

                {/* Subtask list */}
                {totalCount > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.5rem', marginTop: '1rem' }}>
                    {milestone.tasks.map(task => (
                      <label
                        key={task.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.6rem',
                          padding: '0.5rem 0.75rem',
                          background: 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          fontSize: '0.85rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={task.done}
                          onChange={() => handleToggleSubtask(milestone, task.id)}
                          style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                        />
                        <span style={{ textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? 0.6 : 1 }}>
                          {task.title}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showModal && (
        <NewMilestoneModal
          workspace={workspace}
          onSubmit={(newMs) => {
            onAddMilestone(newMs);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
