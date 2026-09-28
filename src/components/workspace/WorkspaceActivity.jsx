import React from 'react';
import { Activity, Clock, CheckSquare, Target, UploadCloud, MessageSquare, UserPlus } from 'lucide-react';

function getActivityIcon(type = '') {
  switch (type) {
    case 'task':
      return CheckSquare;
    case 'milestone':
      return Target;
    case 'file':
      return UploadCloud;
    case 'discussion':
      return MessageSquare;
    case 'member':
      return UserPlus;
    default:
      return Activity;
  }
}

export default function WorkspaceActivity({
  activities = []
}) {
  return (
    <div className="workspace-activity-tab">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Activity size={22} color="var(--accent-primary)" /> Team Activity &amp; Audit Log
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
          Real-time timeline of tasks completed, files added, milestones achieved, and members joined.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        {activities.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', opacity: 0.7 }}>
            <Clock size={36} color="var(--text-secondary)" style={{ margin: '0 auto 0.75rem auto' }} />
            <p>No activity recorded yet for this project workspace.</p>
          </div>
        ) : (
          <div className="activity-timeline-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {activities.map(act => {
              const Icon = getActivityIcon(act.type);

              return (
                <div key={act.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                  <div
                    style={{
                      background: 'rgba(99, 102, 241, 0.15)',
                      color: '#818cf8',
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Icon size={16} />
                  </div>

                  <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.02)', padding: '0.75rem 1rem', borderRadius: '10px' }}>
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{act.actorName}</strong> {act.action}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.3rem', display: 'block' }}>
                      {new Date(act.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
