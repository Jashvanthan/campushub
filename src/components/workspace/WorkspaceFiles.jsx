import React, { useState } from 'react';
import {
  FileText, UploadCloud, Folder, Plus, Download, Trash2,
  Image as ImageIcon, FileCode, FileSpreadsheet, Eye
} from 'lucide-react';
import UploadFileModal from './UploadFileModal';
import { usePopup } from '../common/PopupDialog';

const FOLDERS = ['All', 'Documentation', 'Design', 'Development', 'Research', 'Reports'];

function getFileIcon(name = '', type = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) return ImageIcon;
  if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'json', 'html', 'css'].includes(ext)) return FileCode;
  if (['xls', 'xlsx', 'csv'].includes(ext)) return FileSpreadsheet;
  return FileText;
}

export default function WorkspaceFiles({
  workspace,
  files = [],
  currentUser,
  onAddFile,
  onDeleteFile
}) {
  const { showConfirm } = usePopup();
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [showUploadModal, setShowUploadModal] = useState(false);

  const filteredFiles = files.filter(f =>
    selectedFolder === 'All' ? true : f.folder === selectedFolder
  );

  return (
    <div className="workspace-files-tab">
      {/* Header and Folder Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {FOLDERS.map(f => (
            <button
              key={f}
              className={`tag-pill-btn ${selectedFolder === f ? 'active' : ''}`}
              onClick={() => setSelectedFolder(f)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
            >
              <Folder size={13} /> {f}
            </button>
          ))}
        </div>

        <button className="primary-btn pulse-hover" onClick={() => setShowUploadModal(true)}>
          <UploadCloud size={16} /> Upload Document
        </button>
      </div>

      {/* Files Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        {filteredFiles.length === 0 ? (
          <div className="glass-panel" style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', opacity: 0.8 }}>
            <Folder size={40} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto' }} />
            <h3>No files in {selectedFolder}</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Upload specifications, UI mockups, architecture charts, or research spreadsheets.
            </p>
            <button className="primary-btn" onClick={() => setShowUploadModal(true)} style={{ marginTop: '1rem' }}>
              <UploadCloud size={16} /> Upload First File
            </button>
          </div>
        ) : (
          filteredFiles.map(file => {
            const Icon = getFileIcon(file.name, file.type);

            return (
              <div
                key={file.id}
                className="glass-panel file-card"
                style={{
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  transition: 'transform 0.2s, background 0.2s'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8', padding: '10px', borderRadius: '10px' }}>
                      <Icon size={24} />
                    </div>
                    <span className="tag" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                      {file.folder || file.category}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.3rem 0', wordBreak: 'break-all' }}>
                    {file.name}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    {file.size} • by {file.uploadedBy}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {new Date(file.uploadedAt).toLocaleDateString()}
                  </span>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <a
                      href={file.url || '#'}
                      download={file.name}
                      className="icon-btn"
                      style={{ padding: '4px' }}
                      title="Download"
                    >
                      <Download size={15} />
                    </a>

                    {(file.uploaderId === currentUser?.username || currentUser?.role === 'admin') && (
                      <button
                        className="icon-btn"
                        style={{ padding: '4px', color: 'var(--danger)' }}
                        onClick={async () => {
                          const confirmed = await showConfirm(`Are you sure you want to delete "${file.name}"?`, 'Delete File', {
                            isDanger: true,
                            confirmText: 'Yes, Delete'
                          });
                          if (confirmed) {
                            onDeleteFile(file.id);
                          }
                        }}
                        title="Delete File"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showUploadModal && (
        <UploadFileModal
          workspace={workspace}
          user={currentUser}
          onSubmit={(newFile) => {
            onAddFile(newFile);
            setShowUploadModal(false);
          }}
          onClose={() => setShowUploadModal(false)}
        />
      )}
    </div>
  );
}
