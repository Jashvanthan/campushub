import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, AlertCircle, FileText, CheckCircle2 } from 'lucide-react';

export default function MediaUploader({ media, onMediaChange, error, onError }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    onError('');

    const validFiles = [];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        onError('Unsupported file type. Please upload images (PNG, JPG, WebP) or PDFs.');
        return;
      }
      if (file.size > MAX_SIZE) {
        onError(`"${file.name}" exceeds the 5MB size limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    setUploading(true);
    setProgress(20);

    const promises = validFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve({
            id: Date.now() + Math.random().toString(36).substring(2, 7),
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            type: file.type,
            url: reader.result,
          });
        };
        reader.readAsDataURL(file);
      });
    });

    const timer = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 25 : prev));
    }, 100);

    Promise.all(promises).then((newItems) => {
      clearInterval(timer);
      setProgress(100);
      setTimeout(() => {
        onMediaChange([...media, ...newItems]);
        setUploading(false);
        setProgress(0);
      }, 300);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeMedia = (id) => {
    onMediaChange(media.filter((m) => m.id !== id));
  };

  return (
    <div className="media-uploader-wrapper">
      <div className="media-uploader-header">
        <label className="form-label">
          Attach Photos / Documents <span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>(Max 5MB each)</span>
        </label>
        {media.length > 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
            {media.length} file{media.length > 1 ? 's' : ''} attached
          </span>
        )}
      </div>

      {/* Drag & Drop Area */}
      <div
        className={`media-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,application/pdf"
          style={{ display: 'none' }}
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="dropzone-content">
          <div className="dropzone-icon">
            <UploadCloud size={28} />
          </div>
          <div className="dropzone-text">
            <p className="dropzone-title">
              <span className="text-accent">Click to upload</span> or drag and drop files here
            </p>
            <p className="dropzone-subtitle">Supported formats: JPEG, PNG, WebP, GIF, PDF</p>
          </div>
        </div>

        {uploading && (
          <div className="upload-progress-container">
            <div className="upload-progress-bar" style={{ width: `${progress}%` }} />
            <span className="upload-progress-text">Processing files... {progress}%</span>
          </div>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="media-error-alert">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Thumbnails Preview Grid */}
      {media.length > 0 && (
        <div className="media-preview-grid">
          {media.map((item) => (
            <div key={item.id} className="media-preview-card">
              {item.type.startsWith('image/') ? (
                <img src={item.url} alt={item.name} className="media-thumbnail" />
              ) : (
                <div className="pdf-thumbnail">
                  <FileText size={28} color="var(--accent-primary)" />
                  <span className="pdf-filename">{item.name}</span>
                </div>
              )}
              <div className="media-card-info">
                <span className="media-name" title={item.name}>{item.name}</span>
                <span className="media-size">{item.size}</span>
              </div>
              <button
                type="button"
                className="media-remove-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  removeMedia(item.id);
                }}
                title="Remove attachment"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
