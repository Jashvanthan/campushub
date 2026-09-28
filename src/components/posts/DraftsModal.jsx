import React from 'react';
import { FileText, Trash2, ArrowRight, X, Clock, Calendar } from 'lucide-react';
import { POST_TYPES } from './PostTypeSelector';
import ModalPortal from '../common/ModalPortal';

export default function DraftsModal({ drafts, onLoadDraft, onDeleteDraft, onClose }) {
  return (
    <ModalPortal>
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content glass-panel" style={{ maxWidth: '620px', background: 'var(--bg-secondary)' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileText size={22} color="var(--accent-primary)" />
            <h2 style={{ margin: 0, fontSize: '1.4rem' }}>Saved Drafts ({drafts.length})</h2>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>
            <X size={22} />
          </button>
        </div>

        {drafts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
            <FileText size={44} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>No saved drafts</p>
            <p style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>
              Incomplete posts you save will appear here for you to resume later.
            </p>
          </div>
        ) : (
          <div className="drafts-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '420px', overflowY: 'auto' }}>
            {drafts.map((d) => {
              const typeObj = POST_TYPES.find((t) => t.id === d.type) || POST_TYPES[0];
              const formattedDate = new Date(d.savedAt || d.createdAt || Date.now()).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={d.id} className="draft-item-card">
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                      <span
                        className="tag"
                        style={{
                          background: typeObj.bg,
                          color: typeObj.color,
                          borderColor: `${typeObj.color}40`,
                          fontSize: '0.72rem',
                          padding: '2px 8px',
                          margin: 0,
                        }}
                      >
                        {typeObj.label}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Clock size={12} /> {formattedDate}
                      </span>
                    </div>

                    <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#fff' }}>
                      {d.title || '(Untitled Draft)'}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                      {d.content || 'No content yet...'}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      className="primary-btn"
                      style={{ padding: '0.45rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                      onClick={() => onLoadDraft(d)}
                    >
                      Resume <ArrowRight size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ color: 'var(--danger)', padding: '0.45rem', background: 'rgba(239, 68, 68, 0.1)' }}
                      onClick={() => onDeleteDraft(d.id)}
                      title="Delete draft"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
