import React from 'react';
import {
  Code2, Calendar, Flag, Lightbulb, Heart, MessageCircle, Share2,
  Sparkles, MapPin, Clock, Link as LinkIcon, Users, Globe
} from 'lucide-react';
import { POST_TYPES } from './PostTypeSelector';
import { VISIBILITY_OPTIONS } from './PostVisibility';
import FormattedText from '../common/FormattedText';

export default function PostPreview({ postData, user }) {
  const currentType = POST_TYPES.find((t) => t.id === postData.type) || POST_TYPES[0];
  const currentVis = VISIBILITY_OPTIONS.find((v) => v.id === postData.visibility) || VISIBILITY_OPTIONS[0];
  const TypeIcon = currentType.icon;
  const VisIcon = currentVis.icon;

  const tagsList = postData.tags
    ? typeof postData.tags === 'string'
      ? postData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : postData.tags
    : [];

  return (
    <div className="live-preview-container">
      <div className="preview-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <Sparkles size={16} color="var(--accent-primary)" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Live Card Preview</span>
        </div>
        <span className="preview-badge">Real-Time Sync</span>
      </div>

      <div className="post-card glass-panel preview-post-card">
        {/* Post Header */}
        <div className="post-header">
          <div className="post-author-row">
            <div className="post-avatar">
              {user?.avatar && typeof user.avatar === 'string' && (user.avatar.startsWith('http') || user.avatar.startsWith('data:image') || user.avatar.startsWith('blob:') || user.avatar.startsWith('/')) ? (
                <img src={user.avatar} alt="User avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                (user?.avatar && typeof user.avatar === 'string' && user.avatar.length <= 4) ? user.avatar : (user?.username || 'You').slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="post-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ margin: 0 }}>{user?.username || 'Current User'}</h3>
                <span className="user-role-badge">{user?.role || 'member'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem' }}>
                <span>Just now</span>
                <span style={{ color: 'var(--text-secondary)' }}>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <VisIcon size={12} /> {currentVis.label}
                </span>
              </div>
            </div>
          </div>

          <div className="post-badges-wrap">
            <div
              className="post-type-badge-box"
              style={{
                background: currentType.bg,
                border: `1px solid ${currentType.color}40`,
                color: currentType.color,
              }}
            >
              <TypeIcon size={15} /> <span>{currentType.label}</span>
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div className="post-content">
          <h2 style={{ wordBreak: 'break-word', color: 'var(--text-primary)', opacity: postData.title ? 1 : 0.3 }}>
            {postData.title || 'Your Post Title will appear here...'}
          </h2>

          {tagsList.length > 0 && (
            <div className="post-tags">
              {tagsList.map((tag, idx) => (
                <span key={idx} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div
            className="post-description"
            style={{
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              color: 'var(--text-secondary)',
              opacity: postData.content ? 1 : 0.5,
              fontStyle: postData.content ? 'normal' : 'italic',
            }}
          >
            {postData.content ? (
              <FormattedText text={postData.content} />
            ) : (
              'Your detailed announcement, project summary, or event overview will be formatted and previewed here in real-time...'
            )}
          </div>

          {/* Event Specific Card Details */}
          {postData.type === 'event' && postData.eventDetails && (
            <div className="preview-event-box">
              <div className="preview-event-grid">
                {postData.eventDetails.eventDate && (
                  <div className="event-meta-item">
                    <Calendar size={14} color="#10b981" />
                    <span>{postData.eventDetails.eventDate}</span>
                  </div>
                )}
                {postData.eventDetails.startTime && (
                  <div className="event-meta-item">
                    <Clock size={14} color="#10b981" />
                    <span>
                      {postData.eventDetails.startTime} {postData.eventDetails.endTime ? `- ${postData.eventDetails.endTime}` : ''}
                    </span>
                  </div>
                )}
                {postData.eventDetails.venue && (
                  <div className="event-meta-item">
                    <MapPin size={14} color="#10b981" />
                    <span>{postData.eventDetails.venue}</span>
                  </div>
                )}
                {postData.eventDetails.category && (
                  <div className="event-meta-item">
                    <span className="tag" style={{ margin: 0, padding: '2px 8px', fontSize: '0.75rem' }}>
                      {postData.eventDetails.category}
                    </span>
                  </div>
                )}
              </div>

              {postData.eventDetails.registrationUrl && (
                <div style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}>
                    <LinkIcon size={13} /> {postData.eventDetails.registrationUrl}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Media Attachments Preview */}
          {postData.media && postData.media.length > 0 && (
            <div className={`preview-media-layout count-${Math.min(postData.media.length, 4)}`}>
              {postData.media.slice(0, 4).map((item, idx) => (
                <div key={item.id || idx} className="preview-media-item">
                  {item.type?.startsWith('image/') || typeof item === 'string' ? (
                    <img src={item.url || item} alt="Attachment" className="preview-image" loading="lazy" />
                  ) : (
                    <div className="pdf-preview-block">
                      <span>📄 {item.name || 'Document attachment'}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mock Actions */}
        <div className="post-actions" style={{ opacity: 0.75 }}>
          <button className="action-btn" type="button">
            <Heart size={18} /> 0 Likes
          </button>
          <button className="action-btn" type="button">
            <MessageCircle size={18} /> 0 Comments
          </button>
          <button className="action-btn" type="button">
            <Share2 size={18} /> Share
          </button>
        </div>
      </div>
    </div>
  );
}
