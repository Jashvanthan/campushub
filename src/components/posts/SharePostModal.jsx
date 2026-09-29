import React, { useState } from 'react';
import {
  X, Check, Copy, Share2, MessageCircle, Send, Twitter,
  Linkedin, Mail, Globe, ExternalLink
} from 'lucide-react';
import ModalPortal from '../common/ModalPortal';
import { encodePostShareData } from '../../App';

export default function SharePostModal({ post, onClose, onToast }) {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const payload = encodePostShareData ? encodePostShareData(post) : '';
  const postUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/post/${post.id}${payload ? `?pdata=${payload}` : ''}`
    : `/post/${post.id}`;

  const cleanDisplayUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/post/${post.id}`
    : `/post/${post.id}`;

  const shareTitle = post.title || 'Check out this post on CampusHub';
  const shareText = post.description
    ? `${post.title} — ${post.description.substring(0, 120)}...`
    : `Check out "${post.title}" on CampusHub!`;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = postUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      if (onToast) onToast('✓ Post link copied to clipboard!');
      setTimeout(() => setCopied(false), 3000);
    } catch (_) {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: postUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopy();
        }
      }
    } else {
      handleCopy();
    }
  };

  // Social Share URLs
  const encodedUrl = encodeURIComponent(postUrl);
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent(shareTitle);

  const shareChannels = [
    {
      name: 'WhatsApp',
      icon: <MessageCircle size={18} color="#25D366" />,
      url: `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
      bg: 'rgba(37, 211, 102, 0.12)',
      border: 'rgba(37, 211, 102, 0.3)'
    },
    {
      name: 'Telegram',
      icon: <Send size={18} color="#229ED9" />,
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      bg: 'rgba(34, 158, 217, 0.12)',
      border: 'rgba(34, 158, 217, 0.3)'
    },
    {
      name: 'X (Twitter)',
      icon: <Twitter size={18} color="#1DA1F2" />,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      bg: 'rgba(29, 161, 242, 0.12)',
      border: 'rgba(29, 161, 242, 0.3)'
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin size={18} color="#0A66C2" />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      bg: 'rgba(10, 102, 194, 0.12)',
      border: 'rgba(10, 102, 194, 0.3)'
    },
    {
      name: 'Email',
      icon: <Mail size={18} color="#EA4335" />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}%0A%0AView%20post:%20${encodedUrl}`,
      bg: 'rgba(234, 67, 53, 0.12)',
      border: 'rgba(234, 67, 53, 0.3)'
    }
  ];

  return (
    <ModalPortal>
      <div className="modal-overlay" style={{ zIndex: 999999 }} onClick={onClose}>
        <div
          className="glass-panel"
          style={{
            maxWidth: '520px',
            width: '92%',
            padding: '1.5rem',
            borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.75)',
            animation: 'scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.25), rgba(236, 72, 153, 0.25))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(99, 102, 241, 0.4)'
              }}>
                <Share2 size={18} color="var(--accent-primary)" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Share Post
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Anyone with this link can view this post on CampusHub
                </p>
              </div>
            </div>
            <button
              type="button"
              className="icon-btn"
              onClick={onClose}
              title="Close"
              style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Post Preview Card */}
          <div style={{
            padding: '0.85rem 1rem',
            background: 'rgba(255, 255, 255, 0.03)',
            borderRadius: '12px',
            border: '1px solid var(--border-color)',
            marginBottom: '1.25rem',
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            {post.image ? (
              <img
                src={post.image}
                alt={post.title}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
              />
            ) : (
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                color: 'var(--accent-primary)',
                fontWeight: 700,
                fontSize: '1rem'
              }}>
                {post.type?.charAt(0).toUpperCase() || 'P'}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.5px' }}>
                {post.type || 'Post'} • {post.author?.name || post.authorId || 'Campus Member'}
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {post.title}
              </div>
            </div>
          </div>

          {/* Copy Link Input Section */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Direct Post Link
            </label>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              background: 'rgba(0, 0, 0, 0.3)',
              border: copied ? '1px solid var(--success)' : '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '0.35rem 0.5rem 0.35rem 0.85rem',
              gap: '0.5rem',
              transition: 'border-color 0.2s ease'
            }}>
              <Globe size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              <input
                type="text"
                readOnly
                value={cleanDisplayUrl}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontFamily: 'monospace'
                }}
                onClick={(e) => e.target.select()}
              />
              <button
                type="button"
                className={copied ? 'success-btn' : 'primary-btn'}
                onClick={handleCopy}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '7px',
                  flexShrink: 0
                }}
              >
                {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
              </button>
            </div>
          </div>

          {/* Social Share Grid */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.6rem' }}>
              Share via
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '0.6rem' }}>
              {shareChannels.map((ch) => (
                <a
                  key={ch.name}
                  href={ch.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0.65rem 0.4rem',
                    background: ch.bg,
                    border: `1px solid ${ch.border}`,
                    borderRadius: '10px',
                    textDecoration: 'none',
                    color: 'var(--text-primary)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    gap: '0.35rem',
                    transition: 'transform 0.15s ease, background 0.15s ease'
                  }}
                  className="hover-lift"
                >
                  {ch.icon}
                  <span>{ch.name}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Native Share Button (if supported) */}
          {typeof navigator !== 'undefined' && navigator.share && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
              <button
                type="button"
                className="secondary-btn"
                onClick={handleNativeShare}
                style={{ width: '100%', padding: '0.55rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', borderRadius: '8px' }}
              >
                <ExternalLink size={15} /> More Sharing Options...
              </button>
            </div>
          )}
        </div>
      </div>
    </ModalPortal>
  );
}
