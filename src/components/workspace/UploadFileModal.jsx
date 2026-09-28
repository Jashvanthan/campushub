import React, { useState } from 'react';
import { X, UploadCloud, FileText, AlertCircle } from 'lucide-react';
import ModalPortal from '../common/ModalPortal';

export default function UploadFileModal({
  workspace,
  user,
  onSubmit,
  onClose
}) {
  const [name, setName] = useState('');
  const [folder, setFolder] = useState('Documentation');
  const [category, setCategory] = useState('Architecture');
  const [fileObject, setFileObject] = useState(null);
  const [fileSize, setFileSize] = useState('1.5 MB');
  const [fileType, setFileType] = useState('application/pdf');
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileObject(file);
      setName(file.name);
      setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
      setFileType(file.type || 'application/octet-stream');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('File name is required.');
      return;
    }

    const newFile = {
      id: `file-${Date.now()}`,
      workspaceId: workspace.id,
      name: name.trim(),
      folder,
      category,
      uploadedBy: user.name || user.username,
      uploaderId: user.username,
      size: fileSize,
      type: fileType,
      url: '#',
      uploadedAt: new Date().toISOString()
    };

    onSubmit(newFile);
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal-content glass-panel" style={{ maxWidth: '550px', background: 'var(--bg-secondary)' }}>
        <div className="modal-header">
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <UploadCloud size={22} color="var(--accent-primary)" /> Upload Workspace File
          </h2>
          <button className="icon-btn" onClick={onClose}><X size={22} /></button>
        </div>

        {error && (
          <div className="idea-form-error-banner" style={{ margin: '1rem 0' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <div className="file-dropzone" style={{ padding: '1.5rem 1rem' }}>
              <input
                type="file"
                className="file-dropzone-input"
                onChange={handleFileChange}
              />
              <UploadCloud size={32} className="text-accent" />
              <p style={{ margin: '0.4rem 0' }}>
                {fileObject ? <strong>Selected: {fileObject.name}</strong> : 'Choose file or drag & drop here'}
              </p>
              <span className="file-dropzone-sub">PDF, Figma, Code, Diagrams, Spreadsheets</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Display Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., campus_navigation_architecture.pdf"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Folder</label>
              <select
                className="form-control"
                value={folder}
                onChange={(e) => setFolder(e.target.value)}
              >
                <option value="Documentation">Documentation</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Research">Research</option>
                <option value="Reports">Reports</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Architecture">Architecture</option>
                <option value="Design">Design</option>
                <option value="Development">Development</option>
                <option value="Research">Research</option>
                <option value="Reports">Reports</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="secondary-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-btn pulse-hover">
              Upload File
            </button>
          </div>
        </form>
      </div>
    </div>
  </ModalPortal>
  );
}
