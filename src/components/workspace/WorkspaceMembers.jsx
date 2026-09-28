import React, { useState } from 'react';
import { Users, Shield, CheckCircle, Plus, Mail, UserCheck, ShieldAlert, LogOut } from 'lucide-react';
import { usePopup } from '../common/PopupDialog';

export default function WorkspaceMembers({
  workspace,
  currentUser,
  onUpdateMemberRole,
  onLeaveWorkspace
}) {
  const { showConfirm } = usePopup();
  const members = workspace.members || [];
  const isOwner = workspace.ownerId === currentUser?.username;
  const isAdmin = currentUser?.role === 'admin' || members.some(m => m.userId === currentUser?.username && m.role === 'Admin');

  return (
    <div className="workspace-members-tab">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={22} color="var(--accent-primary)" /> Project Team Directory
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
            {members.length} active contributors collaborating on this workspace.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {members.map(member => {
          const isCurrent = member.userId === currentUser?.username;

          return (
            <div
              key={member.userId}
              className="glass-panel member-card"
              style={{
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: member.role === 'Owner' ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid var(--border-color)'
              }}
            >
              <div>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem' }}>
                  <div
                    className="post-avatar"
                    style={{
                      width: '46px',
                      height: '46px',
                      fontSize: '1.1rem',
                      border: member.role === 'Owner'
                        ? '2px solid #a78bfa'
                        : member.role === 'Admin'
                        ? '2px solid var(--accent-primary)'
                        : '2px solid var(--success)'
                    }}
                  >
                    {member.avatar || member.name?.slice(0, 2).toUpperCase() || 'U'}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>{member.name}</h4>
                      {isCurrent && (
                        <span style={{ fontSize: '0.7rem', background: 'rgba(255, 255, 255, 0.08)', padding: '1px 6px', borderRadius: '4px' }}>
                          You
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 500 }}>
                      {member.contributionRole || 'Contributor'}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  <div>🏢 {member.department || 'Campus Community'}</div>
                  <div>📅 Joined {new Date(member.joinedAt || Date.now()).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Task stats & Role selector */}
              <div style={{ marginTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--success)', fontWeight: 600 }}>
                  ✓ {member.tasksCompleted || 0} Tasks Completed
                </span>

                {(isOwner || isAdmin) && member.role !== 'Owner' ? (
                  <select
                    className="form-control"
                    style={{ width: 'auto', padding: '0.2rem 0.5rem', fontSize: '0.75rem', height: 'auto' }}
                    value={member.role}
                    onChange={(e) => onUpdateMemberRole(member.userId, e.target.value)}
                  >
                    <option value="Admin">Admin</option>
                    <option value="Contributor">Contributor</option>
                    <option value="Viewer">Viewer</option>
                  </select>
                ) : (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: member.role === 'Owner' ? '#a78bfa' : member.role === 'Admin' ? '#818cf8' : '#34d399'
                    }}
                  >
                    {member.role}
                  </span>
                )}
              </div>

              {isCurrent && member.role !== 'Owner' && onLeaveWorkspace && (
                <div style={{ marginTop: '0.85rem', paddingTop: '0.65rem', borderTop: '1px dashed rgba(239, 68, 68, 0.2)' }}>
                  <button
                    className="secondary-btn"
                    style={{ width: '100%', color: '#f87171', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.35rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}
                    onClick={async () => {
                      const confirmed = await showConfirm(
                        `Are you sure you want to leave "${workspace.name}"? You will lose access to team discussions, tasks, and chat. If you want to rejoin later, you will need to submit a new contribution request.`,
                        'Leave Workspace',
                        { isDanger: true, confirmText: 'Yes, Leave Workspace' }
                      );
                      if (confirmed) onLeaveWorkspace(workspace.id);
                    }}
                  >
                    <LogOut size={13} /> Leave Workspace
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
