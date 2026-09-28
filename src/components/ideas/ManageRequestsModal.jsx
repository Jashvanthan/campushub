import React from 'react';
import { X, Check, Trash2, UserCheck, ShieldAlert, Mail, MessageSquare, Clock } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

export default function ManageRequestsModal({
  idea,
  requests,
  onAccept,
  onReject,
  onClose
}) {
  const ideaRequests = (requests || []).filter(r => r.ideaId === idea.id);

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '750px', background: 'var(--bg-secondary)' }}>
        <div className="modal-header">
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <UserCheck size={22} color="var(--accent-primary)" /> Contribution Requests
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: '0.2rem 0 0 0' }}>
              Review student applications to join "{idea.title}"
            </p>
          </div>
          <button className="icon-btn" onClick={onClose}><X size={22} /></button>
        </div>

        <div style={{ marginTop: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {ideaRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed var(--border-color)' }}>
              <Clock size={32} color="var(--text-secondary)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.6 }} />
              <h3 style={{ margin: 0, fontSize: '1.1rem' }}>No Pending Applications</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.4rem' }}>
                When other students request to contribute to this idea, their applications will appear here.
              </p>
            </div>
          ) : (
            ideaRequests.map(req => {
              const isPending = req.status === 'PENDING';
              const isAccepted = req.status === 'ACCEPTED';
              const isRejected = req.status === 'REJECTED';

              return (
                <div
                  key={req.id}
                  className="glass-panel"
                  style={{
                    padding: '1.25rem',
                    border: isAccepted
                      ? '1px solid rgba(16, 185, 129, 0.3)'
                      : isRejected
                      ? '1px solid rgba(239, 68, 68, 0.2)'
                      : '1px solid var(--border-color)',
                    background: isAccepted
                      ? 'rgba(16, 185, 129, 0.04)'
                      : isRejected
                      ? 'rgba(239, 68, 68, 0.03)'
                      : 'rgba(255, 255, 255, 0.03)',
                    borderRadius: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="post-avatar" style={{ width: '42px', height: '42px', fontSize: '1rem' }}>
                        {req.applicantAvatar || req.applicantName?.slice(0, 2).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>{req.applicantName || req.applicantId}</h4>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {req.applicantDepartment || 'Student'} • Applied {new Date(req.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isPending ? (
                        <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', padding: '3px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                          Pending Review
                        </span>
                      ) : isAccepted ? (
                        <span style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', padding: '3px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                          ✓ Accepted as Contributor
                        </span>
                      ) : (
                        <span style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', padding: '3px 10px', borderRadius: '100px', fontSize: '0.78rem', fontWeight: 600 }}>
                          Declined
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Roles and Skills */}
                  <div style={{ margin: '0.75rem 0' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.4rem' }}>
                      <strong style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginRight: '0.3rem', alignSelf: 'center' }}>
                        Desired Roles:
                      </strong>
                      {(req.roles || []).map((r, i) => (
                        <span key={i} style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem' }}>
                          {r}
                        </span>
                      ))}
                    </div>

                    {req.skills && req.skills.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        <strong style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', textTransform: 'uppercase', marginRight: '0.3rem', alignSelf: 'center' }}>
                          Skills:
                        </strong>
                        {req.skills.map((s, i) => (
                          <span key={i} style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.75rem' }}>
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Statement */}
                  <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border-color)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', lineHeight: 1.5, margin: '0.75rem 0', fontStyle: 'italic', color: 'var(--text-primary)' }}>
                    "{req.message}"
                  </div>

                  {/* Actions if pending */}
                  {isPending && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                      <button
                        type="button"
                        className="secondary-btn"
                        style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                        onClick={() => onReject(req.id)}
                      >
                        Decline
                      </button>
                      <button
                        type="button"
                        className="primary-btn pulse-hover"
                        style={{ background: 'var(--success)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)', padding: '0.4rem 1.25rem', fontSize: '0.85rem' }}
                        onClick={() => onAccept(req)}
                      >
                        <Check size={16} /> Accept &amp; Add to Workspace
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
          <button type="button" className="secondary-btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  </ModalPortal>
  );
}
