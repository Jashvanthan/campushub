import { useState, useEffect, useRef, useCallback } from 'react';
import { storageManager } from './services/storageManager';

import {
  Code2, Calendar, Flag, Lightbulb, Heart, MessageCircle, Share2,
  Plus, X, Moon, Sun, LogOut, User, Users, Shield, Trash2,
  Eye, EyeOff, Menu, EllipsisVertical, CircleCheckBig, Mail,
  Sparkles, Play, Edit3, Megaphone, Trophy, Bell, HelpCircle, Briefcase, FileText,
  Search, Lock, CheckCircle, ExternalLink, UserPlus, UserCheck, ArrowLeft,
  Building, GraduationCap, Tag, FolderKanban
} from 'lucide-react';
import WarpSpeedCanvas from './components/WarpSpeedCanvas';
import VoidBackground from './components/VoidBackground';
import IntroAnimation from './components/IntroAnimation';
import LoginPage from './components/LoginPage';
import CreatePost from './components/posts/CreatePost';
import IdeasPage from './components/ideas/IdeasPage';
import WorkspacesPage from './components/workspace/WorkspacesPage';
import SearchPage from './components/search/SearchPage';
import JoinContributionModal from './components/ideas/JoinContributionModal';
import ManageRequestsModal from './components/ideas/ManageRequestsModal';
import ModalPortal from './components/common/ModalPortal';
import FormattedText from './components/common/FormattedText';
import UserProfileModal, { DEFAULT_USER_PROFILES, getUserInitials } from './components/common/UserProfileModal';
import SharePostModal from './components/posts/SharePostModal';
import {
  SEED_IDEAS,
  SEED_WORKSPACES,
  SEED_TASKS,
  SEED_MILESTONES,
  SEED_DISCUSSIONS,
  SEED_FILES,
  SEED_ACTIVITIES,
  SEED_CONTRIBUTION_REQUESTS,
  SEED_CHAT_MESSAGES,
  SEED_NOTIFICATIONS
} from './data/seedIdeasAndWorkspaces';
import { api } from './services/api';
import { sendWelcomeEmail } from './services/emailJsService';
import NetworkConnectionLoader from './components/common/NetworkConnectionLoader';
import { usePopup } from './components/common/PopupDialog';

/* ─────────────────────────────────────────────────
   Utilities
───────────────────────────────────────────────── */
async function hashPassword(password) {
  const enc = new TextEncoder().encode(password);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
async function verifyPassword(plain, hash) { return (await hashPassword(plain)) === hash; }

function passwordStrength(p) {
  let score = 0;
  if (p.length >= 8) score++;
  if (p.length >= 12) score++;
  if (/[A-Z]/.test(p)) score++;
  if (/[0-9]/.test(p)) score++;
  if (/[^A-Za-z0-9]/.test(p)) score++;
  const s = Math.min(score, 4);
  return {
    score: s,
    label: ['Very Weak','Weak','Fair','Strong','Very Strong'][s],
    color: ['#ef4444','#f97316','#eab308','#22c55e','#10b981'][s],
  };
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function getTypeIcon(type, size=18) {
  const icons = {
    general: FileText,
    announcement: Megaphone,
    event: Calendar,
    achievement: Trophy,
    notice: Bell,
    question: HelpCircle,
    lost_found: Search,
    internship: Briefcase,
    club: Users,
    project: Code2,
    idea: Lightbulb,
    issue: Flag,
  };
  const Icon = icons[type] || Code2;
  return <Icon size={size} />;
}
function getTypeColor(type) {
  return {
    general: '#6366f1',
    announcement: '#ec4899',
    event: '#10b981',
    achievement: '#f59e0b',
    notice: '#eab308',
    question: '#06b6d4',
    lost_found: '#f97316',
    internship: '#8b5cf6',
    club: '#3b82f6',
    project: '#3b82f6',
    idea: '#f59e0b',
    issue: '#ef4444',
    admin: '#a78bfa'
  }[type] || '#fff';
}

export function isImageAvatar(avatar) {
  if (!avatar || typeof avatar !== 'string') return false;
  const s = avatar.trim();
  return s.startsWith('data:image/') || s.startsWith('http://') || s.startsWith('https://') || s.startsWith('blob:') || s.startsWith('/');
}

export function renderAvatarContent(avatar, name, username, fallback = 'U') {
  if (isImageAvatar(avatar)) {
    return (
      <img
        src={avatar}
        alt={name || username || 'avatar'}
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  const text = (avatar && typeof avatar === 'string' && avatar.length <= 4)
    ? avatar
    : ((name || username || fallback).slice(0, 2).toUpperCase());
  return <span>{text}</span>;
}

/* ─────────────────────────────────────────────────
   Seed Data
───────────────────────────────────────────────── */
const SEED_POSTS = [
  {
    id:1, type:'project', title:'Smart Campus Attendance & Recognition System',
    description:'Face recognition-based attendance system using Python and OpenCV. Automatically captures faces and marks attendance in a database, providing a dashboard for analysis.',
    author:{name:'Student One', avatar:'S1'}, department:'Computer Science',
    tags:['AI/ML','Computer Vision','Python'],
    image:'https://images.unsplash.com/photo-1555949963-aa79dcee57d5?auto=format&fit=crop&q=80&w=800',
    likes:120, likedBy:[], comments:[{id:101,author:'admin',text:'Great architecture! Server integration looks solid.'},{id:102,author:'student1',text:'Thanks! The repository is linked.'}],
    date:'2 hours ago', authorId:'student1',
  },
  {
    id:2, type:'event', title:'Campus Innovators Hackathon 2026',
    description:'Join us for a 48-hour coding marathon! Build innovative solutions to real-world problems. Free food, swag, and huge cash prizes for the winning teams.',
    author:{name:'Campus Admin', avatar:'AD'}, location:'Main Auditorium & Virtual Hub', eventDate:'2026-04-15',
    tags:['Hackathon','Coding','Innovation'],
    image:'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=800',
    likes:85, likedBy:[], comments:[{id:103,author:'student1',text:'Registered and excited!'}],
    date:'5 hours ago', authorId:'admin',
  },
  {
    id:3, type:'idea', title:'Automated Digital Campus Library Kiosk',
    description:'A system where books are tracked using RFID tags, reducing manual checkout times and easily locating misplaced books on the shelves.',
    author:{name:'Student One', avatar:'S1'}, status:'Under Review',
    tags:['IoT','Library','Hardware'],
    image:'https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&q=80&w=800',
    likes:245, likedBy:[], comments:[], date:'1 day ago', authorId:'student1',
  },
  {
    id:4, type:'issue', title:'Campus Wi-Fi Bandwidth Optimization in Engineering Wing',
    description:'Systems in Lab 2 are experiencing intermittent connectivity during peak hours. Network operations team is upgrading local access points.',
    author:{name:'Campus Admin', avatar:'AD'}, priority:'High',
    tags:['Network','Infrastructure','Urgent'], resolved:false,
    likes:42, likedBy:[], comments:[{id:104,author:'student1',text:'Thanks for looking into this.'}],
    date:'1 day ago', authorId:'admin',
  },
];

/* ─────────────────────────────────────────────────
   RevealOnScroll wrapper
───────────────────────────────────────────────── */
function Reveal({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.unobserve(ref.current); }
    }, { threshold: 0.08 });
    if (ref.current) obs.observe(ref.current);
    return () => ref.current && obs.unobserve(ref.current);
  }, []);
  return (
    <div
      ref={ref}
      className={`reveal-element${visible ? ' reveal-visible' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Notification Toast
───────────────────────────────────────────────── */
function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 5000); return () => clearTimeout(t); }, [onDone]);
  return <div className="notification-toast">🔔 {message}</div>;
}

/* ─────────────────────────────────────────────────
   LoginPage
───────────────────────────────────────────────── */
/* ─────────────────────────────────────────────────
   Portable Share Data Helpers
───────────────────────────────────────────────── */
export function encodePostShareData(post) {
  try {
    if (!post) return '';
    const compact = {
      id: post.id,
      title: post.title || '',
      description: post.description || post.content || '',
      type: post.type || 'project',
      department: post.department || '',
      author: post.author || { name: post.authorId || 'Campus Member', avatar: 'U' },
      authorId: post.authorId || post.author?.name || 'std1',
      tags: post.tags || [],
      image: post.image || null,
      likes: post.likes || 0,
      eventDate: post.eventDate || post.eventDetails?.eventDate || null,
      eventTime: post.eventTime || post.eventDetails?.startTime || null,
      location: post.location || post.eventDetails?.venue || null,
      category: post.category || post.eventDetails?.category || null,
      status: post.status || null,
      priority: post.priority || null,
      date: post.date || 'Recently'
    };
    const json = JSON.stringify(compact);
    const b64 = btoa(encodeURIComponent(json).replace(/%([0-9A-F]{2})/g, (_, p1) => String.fromCharCode('0x' + p1)));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch (_) {
    return '';
  }
}

export function decodePostShareData(encodedStr) {
  try {
    if (!encodedStr) return null;
    let b64 = encodedStr.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = decodeURIComponent(Array.prototype.map.call(atob(b64), (c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch (_) {
    return null;
  }
}

/* ─────────────────────────────────────────────────
   PostCard
───────────────────────────────────────────────── */
function PostCard({
  post, user, onLike, onDelete, onEdit, onToggleComment,
  commentOpen, commentText, onCommentChange, onCommentSubmit,
  onDeleteComment, onShare, onToggleResolve, onClearIssue,
  isAdmin, isAuthenticated, contributionRequests = [],
  workspaces = [], ideas = [], users = {}, onNavigateToWorkspace,
  onJoinContribution, onManageRequests, onOpenUserProfile
}) {
  const { showConfirm } = usePopup();
  // STRICT: Only the user whose username strictly matches post.authorId is the owner
  const isAuthor = Boolean(user?.username && (post.authorId === user.username || post.author?.name === user.username));
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;

  // Format visibility label
  const visibilityLabels = {
    everyone: null,
    students: 'Students Only',
    faculty: 'Faculty Only',
    department: 'My Department',
    club: 'Club / Community',
  };

  // Resolve author profile from users map or post
  const authorProfile = users?.[post.authorId] || (post.authorId === 'admin' ? users?.admin : (post.authorId === 'student1' || post.authorId === 'std1') ? (users?.student1 || users?.std1) : null);
  const authorName = authorProfile?.name || post.author?.name || post.authorId || 'Campus Member';
  const authorAvatar = authorProfile?.avatar || post.author?.avatar;

  // Find linked workspace if post is an idea, project or has matching title/id
  const linkedWorkspace = (workspaces || []).find(w =>
    w.status !== 'CLOSED' && (
      w.ideaId === post.id ||
      String(w.ideaId) === String(post.id) ||
      w.id === post.workspaceId ||
      (post.workspaceId && w.id === post.workspaceId) ||
      (post.title && w.name && w.name.trim().toLowerCase() === post.title.trim().toLowerCase())
    )
  );

  // Contribution requests for idea posts
  const postRequests = (contributionRequests || []).filter(
    r => r.ideaId === post.id || String(r.ideaId) === String(post.id)
  );
  const acceptedContributors = postRequests.filter(r => r.status === 'ACCEPTED');
  const myReq = postRequests.find(r => r.applicantId === user?.username);
  const pendingReqsCount = postRequests.filter(r => r.status === 'PENDING').length;

  return (
    <div className="post-card glass-panel" id={`post-${post.id}`}>
      {/* Header */}
      <div className="post-header">
        <div 
          className="post-author-row"
          onClick={() => onOpenUserProfile && onOpenUserProfile(post.authorId || authorName || 'std1', { name: authorName, avatar: authorAvatar })}
          title={`View ${authorName}'s Profile & Contributions`}
        >
          <div className="post-avatar">
            {renderAvatarContent(authorAvatar, authorName, post.authorId, 'U')}
          </div>
          <div className="post-meta">
            <h3>{authorName}</h3>
            <div className="post-meta-sub">
              <span>{post.date || 'Recently'}</span>
              {post.department && (
                <>
                  <span className="post-meta-dot">•</span>
                  <span className="post-meta-dept">{post.department}</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="post-badges-wrap">
          {post.recommendationReason && (
            <span className="post-recommendation-pill" title="Recommendation explanation">
              <Sparkles size={11} /> {post.recommendationReason}
            </span>
          )}
          {post.visibility && post.visibility !== 'everyone' && (
            <span className="post-visibility-pill">
              <Lock size={12} /> {visibilityLabels[post.visibility] || post.visibility}
            </span>
          )}
          <div className="post-type-badge-box" style={{ color:getTypeColor(post.type) }}>
            {getTypeIcon(post.type)} <span>{post.type?.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="post-content">
        <h2>{post.title}</h2>
        {post.tags && (
          <div className="post-tags">
            {(Array.isArray(post.tags) ? post.tags : [post.tags]).filter(Boolean).map((t, i) => (
              <span key={i} className="tag">#{t}</span>
            ))}
          </div>
        )}
        
        <div className="post-description">
          <FormattedText text={post.description || post.content} />
        </div>

        {/* Media Attachments */}
        {post.media && Array.isArray(post.media) && post.media.length > 0 ? (
          <div className="post-media-grid">
            {post.media.map((item, idx) => (
              item.type?.startsWith('image/') || item.url?.startsWith('data:image') || item.url?.match(/\.(jpg|jpeg|png|webp|gif)/i) ? (
                <img key={idx} src={item.url} alt={item.name || `Attachment ${idx+1}`} className="post-image" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <div key={idx} className="post-media-doc">
                  <FileText size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                  <div className="post-media-doc-name">{item.name || 'Attached document'}</div>
                </div>
              )
            ))}
          </div>
        ) : post.image ? (
          <img src={post.image} alt={post.title} className="post-image" loading="lazy" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
        ) : null}

        {/* Event Details Card */}
        {post.type === 'event' && (post.eventDetails || post.eventDate) && (
          <div className="post-event-card">
            <div className="post-event-grid">
              <div className="post-event-item">
                <strong className="post-event-label">Date &amp; Time</strong>
                <span>📅 {post.eventDetails?.eventDate || post.eventDate || 'TBA'}</span>
                {(post.eventDetails?.startTime || post.eventTime) && (
                  <span style={{ marginLeft:'0.4rem' }}>⏰ {post.eventDetails?.startTime || post.eventTime}</span>
                )}
              </div>
              {(post.eventDetails?.venue || post.location) && (
                <div className="post-event-item">
                  <strong className="post-event-label">Venue</strong>
                  <span>📍 {post.eventDetails?.venue || post.location}</span>
                </div>
              )}
              {post.eventDetails?.category && (
                <div className="post-event-item">
                  <strong className="post-event-label">Category</strong>
                  <span>🏷️ {post.eventDetails.category}</span>
                </div>
              )}
              {post.eventDetails?.registrationUrl && (
                <div className="post-event-register">
                  <a href={post.eventDetails.registrationUrl.startsWith('http') ? post.eventDetails.registrationUrl : `https://${post.eventDetails.registrationUrl}`}
                    target="_blank" rel="noreferrer" className="primary-btn" style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', padding:'0.45rem 1.2rem', fontSize:'0.85rem', background:'var(--success)' }}>
                    <ExternalLink size={15} /> Register for Event
                  </a>
                </div>
              )}
            </div>
          </div>
        )}

        {post.type === 'project' && post.department && (
          <p className="post-detail-dept"><strong>Department:</strong> {post.department}</p>
        )}
        {post.type === 'issue' && post.priority && (
          <div className="post-detail-issue">
            <p style={{ color:'var(--danger)', fontWeight:'bold', margin:0 }}>Priority: {post.priority}</p>
            {post.resolved && (
              <span className="post-resolved-badge">
                ✅ Resolved
              </span>
            )}
          </div>
        )}
        {post.type === 'idea' && post.status && (
          <p className="post-detail-status">Status: {post.status}</p>
        )}
      </div>

      {/* Actions */}
      <div className="post-actions">
        <div className="post-social-actions">
          <button className={`action-btn${post.likedBy?.includes(user?.username) ? ' liked' : ''}`} onClick={() => onLike(post.id)}>
            <Heart size={18} fill={post.likedBy?.includes(user?.username) ? 'currentColor' : 'none'} />
            <span>{post.likes || 0} Likes</span>
          </button>

          {isAuthenticated && (
            <button className="action-btn" onClick={() => onToggleComment(post.id)}>
              <MessageCircle size={18} />
              <span>{post.comments?.length || 0} Comments</span>
            </button>
          )}

          <button className="action-btn" onClick={() => onShare(post)}>
            <Share2 size={18} />
            <span>Share</span>
          </button>
        </div>

        {/* Action Controls (Manage / Join / Edit / Delete / Resolve) */}
        <div className="post-context-actions">
          {/* Join / Manage Contribution Buttons for Idea Posts */}
          {post.type === 'idea' && isAuthenticated && (
            !isAuthor ? (
              myReq?.status === 'ACCEPTED' ? (
                <span className="post-accepted-pill">
                  <CheckCircle size={15} /> Contribution Accepted
                </span>
              ) : myReq?.status === 'PENDING' ? (
                <span className="post-pending-pill">
                  ⏳ Application Pending
                </span>
              ) : (
                <button
                  className="primary-btn pulse-hover"
                  style={{ padding: '0.45rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
                  onClick={() => onJoinContribution && onJoinContribution(post)}
                >
                  <UserPlus size={15} /> Join Contribution
                </button>
              )
            ) : (
              <button
                className="secondary-btn"
                style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', borderRadius: '8px' }}
                onClick={() => onManageRequests && onManageRequests(post)}
              >
                <UserCheck size={15} /> Manage Requests {pendingReqsCount > 0 && <span style={{ background: 'var(--accent-primary)', color: '#fff', padding: '1px 6px', borderRadius: '100px', fontSize: '0.72rem', marginLeft: '0.3rem', fontWeight: 700 }}>{pendingReqsCount}</span>}
              </button>
            )
          )}

          {/* Open Linked Workspace Button */}
          {linkedWorkspace && onNavigateToWorkspace && (
            <button
              className="primary-btn pulse-hover"
              style={{
                padding: '0.45rem 0.9rem',
                fontSize: '0.85rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, var(--accent-primary), #6366f1)',
                color: '#ffffff',
                boxShadow: '0 2px 10px rgba(99, 102, 241, 0.25)'
              }}
              onClick={() => onNavigateToWorkspace(linkedWorkspace.id)}
              title={`Open ${linkedWorkspace.name} Workspace`}
            >
              <FolderKanban size={15} /> Open Workspace
            </button>
          )}

          {/* Edit Button ONLY for Author / Owner */}
          {canEdit && onEdit && (
            <button className="secondary-btn" style={{ padding:'0.45rem 0.9rem', fontSize:'0.85rem', display:'inline-flex', alignItems:'center', gap:'0.4rem', borderRadius:'8px' }}
              onClick={() => onEdit(post)} title="Edit your post">
              <Edit3 size={15} /> Edit
            </button>
          )}

          {/* Delete Button for Author or Admin */}
          {canDelete && (
            <button
              className="post-delete-btn"
              onClick={async () => {
                const confirmed = await showConfirm(`Are you sure you want to delete "${post.title}"?`, 'Delete Post', {
                  isDanger: true,
                  confirmText: 'Yes, Delete'
                });
                if (confirmed) onDelete(post.id);
              }}
              title="Delete post"
            >
              <Trash2 size={15} /> Delete
            </button>
          )}

          {/* Issue Resolution & Clear: STRICTLY accessible ONLY to the Issue Posted User or Admin */}
          {post.type === 'issue' && (isAuthor || isAdmin) && (
            <div style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                className="primary-btn"
                style={{
                  background: post.resolved ? 'rgba(100,116,139,0.3)' : 'var(--success)',
                  boxShadow: post.resolved ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  color: post.resolved ? 'var(--text-secondary)' : '#fff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px'
                }}
                onClick={() => onToggleResolve(post.id)}
                title={post.resolved ? 'Reopen this issue' : 'Mark issue as resolved'}
              >
                {post.resolved ? '↩ Reopen' : '✔ Mark as Done'}
              </button>

              <button
                className="primary-btn pulse-hover"
                style={{
                  background: 'var(--danger)',
                  boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  borderRadius: '8px'
                }}
                onClick={() => onClearIssue(post.id)}
                title="Permanently remove and clear this issue"
              >
                <Trash2 size={15} /> Clear Issue
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      {commentOpen && (
        <div className="comments-section">
          <div className="comment-input-wrapper">
            <div className="post-avatar" style={{ width:'32px', height:'32px', fontSize:'0.8rem' }}>
              {user?.username?.slice(0,1).toUpperCase()}
            </div>
            <form onSubmit={e => onCommentSubmit(e, post.id)} className="comment-form">
              <input type="text" className="comment-input" placeholder="Write a comment..." value={commentText}
                onChange={e => onCommentChange(e.target.value)} />
              <button type="submit" className="primary-btn comment-submit-btn">Post</button>
            </form>
          </div>
          <div className="comment-list">
            {post.comments.map(c => (
              <div key={c.id} className="comment">
                <div 
                  className="post-avatar" 
                  style={{ width:'30px', height:'30px', fontSize:'0.75rem', cursor: 'pointer' }}
                  onClick={() => onOpenUserProfile && onOpenUserProfile(c.author)}
                  title={`View ${c.author}'s Profile`}
                >
                  {c.author.slice(0,1).toUpperCase()}
                </div>
                <div className="comment-content">
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div 
                      className="comment-author" 
                      style={{ cursor: 'pointer' }}
                      onClick={() => onOpenUserProfile && onOpenUserProfile(c.author)}
                      title={`View ${c.author}'s Profile`}
                    >
                      {c.author}
                    </div>
                    {(isAdmin || user?.username === c.author) && (
                      <button className="icon-btn" style={{ padding:'2px', color:'var(--danger)', opacity:0.6 }}
                        onClick={() => onDeleteComment(post.id, c.id)} title="Delete comment">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <div className="comment-text">{c.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────
   Main App
───────────────────────────────────────────────── */
export default function App() {
  const { showAlert, showConfirm, showPrompt } = usePopup();
  const [users, setUsers]           = useState(null);
  const [session, setSession]       = useState(null);
  const [posts, setPosts]           = useState(null);
  const [registrations, setRegs]   = useState(null);

  // Ideas & Workspaces Ecosystem State
  const [ideas, setIdeas]           = useState(null);
  const [workspaces, setWorkspaces] = useState(null);
  const [tasks, setTasks]           = useState(null);
  const [milestones, setMilestones] = useState(null);
  const [discussions, setDiscussions] = useState(null);
  const [files, setFiles]           = useState(null);
  const [activities, setActivities] = useState(null);
  const [contributionRequests, setContributionRequests] = useState(null);
  const [chatMessages, setChatMessages] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(null);
  const [notificationFilter, setNotificationFilter] = useState('all');

  const [loading, setLoading]       = useState(true);
  const [theme, setTheme]           = useState(() => localStorage.getItem('campushub_theme') || 'dark');

  // UI state
  const [showIntro, setShowIntro] = useState(() => {
    const pathname = window.location.pathname || '';
    const search = window.location.search || '';
    if (pathname.startsWith('/post/') || pathname.startsWith('/search') || search.includes('post=')) {
      sessionStorage.setItem('campushub_intro_played', 'true');
      return false;
    }
    return sessionStorage.getItem('campushub_intro_played') !== 'true';
  });
  const [activeTab, setActiveTab]   = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [postType, setPostType]     = useState('project');
  const [publishing, setPublishing] = useState(false);
  const [openComment, setOpenComment] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [showPwMap, setShowPwMap]   = useState({});
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editEvent, setEditEvent]   = useState(false);
  const [showReg, setShowReg]       = useState(false);
  const [teamSize, setTeamSize]     = useState(2);
  const [partType, setPartType]     = useState('single');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toast, setToast]           = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');
  const [editUser, setEditUser]     = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [eventOptions, setEventOptions] = useState(false);
  
  // Header Search & Notifications
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Feed Idea Contribution Modals State
  const [joinModalPost, setJoinModalPost] = useState(null);
  const [manageRequestsPost, setManageRequestsPost] = useState(null);
  const [viewingUserProfile, setViewingUserProfile] = useState(null);
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [viewingSharedPost, setViewingSharedPost] = useState(null);
  const [sharingPost, setSharingPost] = useState(null);

  const handleOpenUserProfile = useCallback((userKey, authorFallback = null) => {
    setSelectedProfileUser({ userKey, authorFallback });
    setActiveTab('profile');
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const url = `/profile/${encodeURIComponent(userKey)}`;
    if (window.location.pathname + window.location.search !== url) {
      try { window.history.pushState({ tab: 'profile', userKey }, '', url); } catch (_) {}
    }
  }, []);

  const handleOpenMyProfile = useCallback(() => {
    setSelectedProfileUser({ userKey: session?.username, authorFallback: { name: session?.name || session?.username, avatar: session?.avatar } });
    setActiveTab('profile');
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (window.location.pathname + window.location.search !== '/profile') {
      try { window.history.pushState({ tab: 'profile' }, '', '/profile'); } catch (_) {}
    }
  }, [session]);

  // Deep-linking URL routing & browser back/forward navigation
  const [highlightPostId, setHighlightPostId] = useState(() => {
    const rawPathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const lowerPath = rawPathname.toLowerCase();
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    if (lowerPath.startsWith('/post/')) {
      const parts = rawPathname.split('/').filter(Boolean);
      return parts[1] || null;
    }
    return params.get('post') || null;
  });

  useEffect(() => {
    const parseUrlRoute = () => {
      const rawPathname = window.location.pathname || '';
      const lowerPath = rawPathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const qParam = params.get('q') || '';
      const postParam = params.get('post') || '';

      if (lowerPath === '/search' || lowerPath.startsWith('/search')) {
        setActiveTab('search');
        if (qParam) setSearchQuery(qParam);
      } else if (lowerPath.startsWith('/post/')) {
        const parts = rawPathname.split('/').filter(Boolean);
        if (parts[1]) {
          setHighlightPostId(parts[1]);
        }
        setActiveTab('all');
      } else if (postParam) {
        setHighlightPostId(postParam);
        setActiveTab('all');
      } else if (lowerPath === '/projects') {
        setActiveTab('projects');
      } else if (lowerPath === '/events') {
        setActiveTab('events');
      } else if (lowerPath === '/ideas') {
        setActiveTab('ideas');
      } else if (lowerPath === '/workspaces') {
        setActiveTab('workspaces');
      } else if (lowerPath === '/issues') {
        setActiveTab('issues');
      } else if (lowerPath === '/admin') {
        setActiveTab('admin');
      } else if (lowerPath.startsWith('/profile')) {
        const parts = rawPathname.split('/').filter(Boolean);
        if (parts[1]) {
          setSelectedProfileUser({ userKey: parts[1] });
        }
        setActiveTab('profile');
      } else if (lowerPath === '/' || lowerPath === '') {
        setActiveTab('all');
      }
    };

    parseUrlRoute();

    const handlePopState = () => {
      parseUrlRoute();
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Smooth scroll, fetch & open shared post modal when targeted in URL
  useEffect(() => {
    const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const pdata = searchParams.get('pdata');
    if (!highlightPostId && !pdata) return;

    let isMounted = true;
    const targetIdStr = highlightPostId ? String(highlightPostId) : '';

    const showPost = (p) => {
      if (!p || !isMounted) return;
      setViewingSharedPost(p);
      setTimeout(() => {
        const el = document.getElementById(`post-${p.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('post-highlight-pulse');
          setTimeout(() => el.classList.remove('post-highlight-pulse'), 4000);
        }
      }, 300);
    };

    // 1. First priority: Check portable URL payload (?pdata=...)
    if (pdata) {
      const decoded = decodePostShareData(pdata);
      if (decoded) {
        setPosts(prev => [decoded, ...(prev || []).filter(p => String(p.id) !== String(decoded.id))]);
        showPost(decoded);
        return;
      }
    }

    if (!targetIdStr) return;

    // 2. Check local posts state and SEED_POSTS
    const localMatch = (posts || SEED_POSTS || []).find(p => String(p.id) === targetIdStr);
    if (localMatch) {
      showPost(localMatch);
      return;
    }

    // 3. Check directly in storageManager cache
    storageManager.getItem('campushub_posts').then(cached => {
      if (!isMounted) return;
      if (Array.isArray(cached)) {
        const cachedMatch = cached.find(p => String(p.id) === targetIdStr);
        if (cachedMatch) {
          setPosts(prev => [cachedMatch, ...(prev || []).filter(p => String(p.id) !== String(cachedMatch.id))]);
          showPost(cachedMatch);
          return;
        }
      }

      // 4. Check ideas state and SEED_IDEAS
      const ideaMatch = (ideas || SEED_IDEAS || []).find(i => String(i.id) === targetIdStr);
      if (ideaMatch) {
        const asPost = {
          id: ideaMatch.id,
          title: ideaMatch.title,
          description: ideaMatch.description,
          type: 'idea',
          department: ideaMatch.department,
          author: { name: ideaMatch.creatorName || 'Student', avatar: ideaMatch.creatorAvatar || 'S1' },
          authorId: ideaMatch.creatorId,
          tags: ideaMatch.tags || [],
          likes: (ideaMatch.supportedBy || []).length || 0,
          status: ideaMatch.status || 'Proposed'
        };
        showPost(asPost);
        return;
      }

      // 5. Fetch from backend API
      api.getPost(targetIdStr).then(res => {
        if (isMounted && res && res.success && res.post) {
          setPosts(prev => [res.post, ...(prev || []).filter(p => String(p.id) !== String(res.post.id))]);
          showPost(res.post);
        }
      }).catch(() => {
        const fallback = (SEED_POSTS || []).find(p => String(p.id) === targetIdStr);
        if (fallback) showPost(fallback);
      });
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [highlightPostId, posts, ideas]);

  const handleIntroComplete = useCallback(() => {
    sessionStorage.setItem('campushub_intro_played', 'true');
    setShowIntro(false);
  }, []);

  const handleReplayIntro = useCallback(() => {
    setShowIntro(true);
  }, []);

  /* Theme */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('campushub_theme', theme);
  }, [theme]);

  /* Load from storageManager */
  useEffect(() => {
    (async () => {
      try {
        await storageManager.init();
        const adminHash    = await hashPassword('Admin@2025!');
        const studentHash  = await hashPassword('Student@2025!');
        let storedUsers = await storageManager.getItem('campushub_users');

        const isV5 = (await storageManager.getItem('campushub_sec_version')) === 'v5';

        if (storedUsers) {
          // Migrate plain passwords → hashed
          let dirty = false;
          for (const [k, v] of Object.entries(storedUsers)) {
            if (v.password && !/^[a-f0-9]{64}$/.test(v.password)) {
              storedUsers[k] = { ...v, password: await hashPassword(v.password) };
              dirty = true;
            }
          }
          if (!isV5) {
            storedUsers.admin = { ...(storedUsers.admin || {}), password: adminHash, role: 'admin', name: 'Campus Admin', avatar: 'AD' };
            storedUsers.student1 = { ...(storedUsers.student1 || {}), password: studentHash, role: 'student', name: 'Student One', avatar: 'S1' };
            storedUsers.std1 = { ...(storedUsers.std1 || {}), password: studentHash, role: 'student', name: 'Student One', avatar: 'S1' };
            // Purge all legacy sample demo users
            delete storedUsers.sarah_jenkins;
            delete storedUsers.tech_club;
            delete storedUsers.david_chen;
            delete storedUsers.anjali_sharma;
            dirty = true;
          }
          if (dirty) storageManager.setItem('campushub_users', storedUsers);
          setUsers(storedUsers);
        } else {
          const defaultUsers = {
            admin: { password: adminHash, role: 'admin', name: 'Campus Admin', avatar: 'AD' },
            student1: { password: studentHash, role: 'student', name: 'Student One', avatar: 'S1' },
            std1: { password: studentHash, role: 'student', name: 'Student One', avatar: 'S1' }
          };
          setUsers(defaultUsers);
          storageManager.setItem('campushub_users', defaultUsers);
        }

        const savedSession = await storageManager.getItem('campushub_session');
        if (savedSession) {
          setSession(savedSession);
        } else {
          const pathname = window.location.pathname || '';
          const search = window.location.search || '';
          if (pathname.startsWith('/post/') || pathname.startsWith('/search') || search.includes('post=')) {
            const guestSession = { username: 'guest', role: 'guest', name: 'Campus Guest', avatar: 'GU' };
            setSession(guestSession);
          }
        }

        // Load and sanitize Posts
        const savedPosts = isV5 ? await storageManager.getItem('campushub_posts') : null;
        let activePosts = SEED_POSTS;
        if (savedPosts && Array.isArray(savedPosts)) {
          activePosts = savedPosts.map(p => {
            if (p.authorId === 'student1' || p.authorId === 'std1' || p.id === 1 || p.id === 3) {
              return { ...p, authorId: 'student1', author: { name: 'Student One', avatar: 'S1' } };
            }
            if (p.authorId === 'admin' || p.id === 2 || p.id === 4) {
              return { ...p, authorId: 'admin', author: { name: 'Campus Admin', avatar: 'AD' } };
            }
            return p;
          }).filter(p => p.authorId !== 'sarah_jenkins' && p.authorId !== 'david_chen' && p.authorId !== 'anjali_sharma' && p.authorId !== 'tech_club');
        }
        setPosts(activePosts);
        storageManager.setItem('campushub_posts', activePosts);

        const savedRegs = await storageManager.getItem('campushub_registrations');
        setRegs(savedRegs || {});

        // Load and sanitize Ideas
        const rawIdeas = isV5 ? await storageManager.getItem('campushub_ideas') : null;
        let activeIdeas = SEED_IDEAS;
        if (rawIdeas && Array.isArray(rawIdeas) && rawIdeas.length > 0) {
          activeIdeas = rawIdeas.filter(i => 
            i.creatorId === 'student1' || i.creatorId === 'std1' || i.creatorId === 'admin' || (storedUsers && storedUsers[i.creatorId])
          ).map(i => {
            if (i.creatorId === 'student1' || i.creatorId === 'std1') {
              return { ...i, creatorId: 'student1', creatorName: 'Student One', creatorAvatar: 'S1' };
            }
            if (i.creatorId === 'admin') {
              return { ...i, creatorId: 'admin', creatorName: 'Campus Admin', creatorAvatar: 'AD' };
            }
            return i;
          });
          if (activeIdeas.length === 0) activeIdeas = SEED_IDEAS;
        }
        setIdeas(activeIdeas);
        storageManager.setItem('campushub_ideas', activeIdeas);

        const activeIdeaIds = new Set(activeIdeas.map(i => i.id));

        // Load and sanitize Workspaces
        const rawWorkspaces = isV5 ? await storageManager.getItem('campushub_workspaces') : null;
        let cleanWorkspaces = SEED_WORKSPACES;
        if (rawWorkspaces && Array.isArray(rawWorkspaces) && rawWorkspaces.length > 0) {
          cleanWorkspaces = rawWorkspaces.filter(ws => ws.status !== 'CLOSED' && ws.ideaId && activeIdeaIds.has(ws.ideaId));
          if (cleanWorkspaces.length === 0) cleanWorkspaces = SEED_WORKSPACES;
        }
        setWorkspaces(cleanWorkspaces);
        storageManager.setItem('campushub_workspaces', cleanWorkspaces);

        const validWsIds = new Set(cleanWorkspaces.map(w => w.id));

        // Tasks
        const rawTasks = isV5 ? await storageManager.getItem('campushub_tasks') : null;
        const cleanTasks = ((rawTasks && Array.isArray(rawTasks)) ? rawTasks : SEED_TASKS).filter(t => validWsIds.has(t.workspaceId));
        setTasks(cleanTasks);
        storageManager.setItem('campushub_tasks', cleanTasks);

        // Milestones
        const rawMilestones = isV5 ? await storageManager.getItem('campushub_milestones') : null;
        const cleanMilestones = ((rawMilestones && Array.isArray(rawMilestones)) ? rawMilestones : SEED_MILESTONES).filter(m => validWsIds.has(m.workspaceId));
        setMilestones(cleanMilestones);
        storageManager.setItem('campushub_milestones', cleanMilestones);

        // Discussions
        const rawDiscussions = isV5 ? await storageManager.getItem('campushub_discussions') : null;
        const cleanDiscussions = ((rawDiscussions && Array.isArray(rawDiscussions)) ? rawDiscussions : SEED_DISCUSSIONS).filter(d => validWsIds.has(d.workspaceId));
        setDiscussions(cleanDiscussions);
        storageManager.setItem('campushub_discussions', cleanDiscussions);

        // Files
        const rawFiles = isV5 ? await storageManager.getItem('campushub_files') : null;
        const cleanFiles = ((rawFiles && Array.isArray(rawFiles)) ? rawFiles : SEED_FILES).filter(f => validWsIds.has(f.workspaceId));
        setFiles(cleanFiles);
        storageManager.setItem('campushub_files', cleanFiles);

        // Activities
        const rawActivities = isV5 ? await storageManager.getItem('campushub_activities') : null;
        const cleanActivities = ((rawActivities && Array.isArray(rawActivities)) ? rawActivities : SEED_ACTIVITIES).filter(a => validWsIds.has(a.workspaceId));
        setActivities(cleanActivities);
        storageManager.setItem('campushub_activities', cleanActivities);

        // Contribution Requests
        const rawReqs = isV5 ? await storageManager.getItem('campushub_contribution_requests') : null;
        const activePostIds = new Set(activePosts.map(p => p.id));
        const cleanReqs = ((rawReqs && Array.isArray(rawReqs)) ? rawReqs : SEED_CONTRIBUTION_REQUESTS).filter(r => {
          if (r.ideaId && !activeIdeaIds.has(r.ideaId)) return false;
          if (r.postId && !activePostIds.has(r.postId)) return false;
          return true;
        });
        setContributionRequests(cleanReqs);
        storageManager.setItem('campushub_contribution_requests', cleanReqs);

        // Chat
        const rawChat = isV5 ? await storageManager.getItem('campushub_chat_messages') : null;
        const cleanChat = ((rawChat && Array.isArray(rawChat)) ? rawChat : SEED_CHAT_MESSAGES).filter(c => validWsIds.has(c.workspaceId));
        setChatMessages(cleanChat);
        storageManager.setItem('campushub_chat_messages', cleanChat);

        // Set version marker v5
        await storageManager.setItem('campushub_sec_version', 'v5');

        const savedNotifs = await storageManager.getItem('campushub_notifications');
        setNotifications(savedNotifs && Array.isArray(savedNotifs) ? savedNotifs : SEED_NOTIFICATIONS);

      } catch (err) {
        console.error('StorageManager error:', err);
        setUsers({ admin:{ password:'', role:'admin' }, std1:{ password:'', role:'student' } });
        setPosts(SEED_POSTS);
        setRegs({});
        setIdeas(SEED_IDEAS);
        setWorkspaces(SEED_WORKSPACES);
        setTasks(SEED_TASKS);
        setMilestones(SEED_MILESTONES);
        setDiscussions(SEED_DISCUSSIONS);
        setFiles(SEED_FILES);
        setActivities(SEED_ACTIVITIES);
        setContributionRequests(SEED_CONTRIBUTION_REQUESTS);
        setChatMessages(SEED_CHAT_MESSAGES);
        setNotifications(SEED_NOTIFICATIONS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* BroadcastChannel sync */
  useEffect(() => {
    const ch = new BroadcastChannel('campushub_sync');
    ch.onmessage = ({ data: { type, data, notify, author } }) => {
      if (type === 'SYNC_POSTS')         setPosts(data);
      if (type === 'SYNC_USERS')         setUsers(data);
      if (type === 'SYNC_REGS')          setRegs(data);
      if (type === 'SYNC_IDEAS')         setIdeas(data);
      if (type === 'SYNC_WORKSPACES')    setWorkspaces(data);
      if (type === 'SYNC_TASKS')         setTasks(data);
      if (type === 'SYNC_MILESTONES')    setMilestones(data);
      if (type === 'SYNC_DISCUSSIONS')   setDiscussions(data);
      if (type === 'SYNC_FILES')         setFiles(data);
      if (type === 'SYNC_ACTIVITIES')    setActivities(data);
      if (type === 'SYNC_CONTRIBUTIONS') setContributionRequests(data);
      if (type === 'SYNC_CHAT_MESSAGES') setChatMessages(data);
      if (type === 'SYNC_NOTIFICATIONS') setNotifications(data);

      if (notify && author !== session?.username) setToast(notify);
    };
    return () => ch.close();
  }, [session]);

  const broadcast = useCallback((type, data, notify = null) => {
    const ch = new BroadcastChannel('campushub_sync');
    ch.postMessage({ type, data, notify, author: session?.username });
    ch.close();
  }, [session]);

  /* High-Performance Debounced Persistence */
  useEffect(() => { if (users) storageManager.setItem('campushub_users', users); }, [users]);
  useEffect(() => { if (posts) storageManager.setItem('campushub_posts', posts); }, [posts]);
  useEffect(() => { if (registrations) storageManager.setItem('campushub_registrations', registrations); }, [registrations]);
  useEffect(() => { if (ideas) storageManager.setItem('campushub_ideas', ideas); }, [ideas]);
  useEffect(() => { if (workspaces) storageManager.setItem('campushub_workspaces', workspaces); }, [workspaces]);
  useEffect(() => { if (tasks) storageManager.setItem('campushub_tasks', tasks); }, [tasks]);
  useEffect(() => { if (milestones) storageManager.setItem('campushub_milestones', milestones); }, [milestones]);
  useEffect(() => { if (discussions) storageManager.setItem('campushub_discussions', discussions); }, [discussions]);
  useEffect(() => { if (files) storageManager.setItem('campushub_files', files); }, [files]);
  useEffect(() => { if (activities) storageManager.setItem('campushub_activities', activities); }, [activities]);
  useEffect(() => { if (contributionRequests) storageManager.setItem('campushub_contribution_requests', contributionRequests); }, [contributionRequests]);
  useEffect(() => { if (chatMessages) storageManager.setItem('campushub_chat_messages', chatMessages); }, [chatMessages]);
  useEffect(() => { if (notifications) storageManager.setItem('campushub_notifications', notifications); }, [notifications]);

  useEffect(() => {
    if (!loading) session ? storageManager.setItem('campushub_session', session) : storageManager.removeItem('campushub_session');
  }, [session, loading]);


  /* Sync partType when event selected */
  useEffect(() => {
    if (selectedEvent) {
      setPartType(selectedEvent.participantType || 'single');
      setTeamSize(selectedEvent.minTeamSize || 2);
    }
  }, [selectedEvent]);

  /* Roles */
  const isAdmin   = session?.role === 'admin';
  const isStudent = session?.role === 'student';
  const isNew     = session?.role === 'new_user';
  const isGuest   = session?.role === 'guest';
  const isAuth    = isAdmin || isStudent || isNew;

  /* Restricted tabs */
  const isRestricted = isGuest
    ? (activeTab !== 'all' && activeTab !== 'projects' && activeTab !== 'events' && activeTab !== 'search')
    : isNew
      ? (activeTab !== 'all' && activeTab !== 'projects' && activeTab !== 'events' && activeTab !== 'profile' && activeTab !== 'search')
      : false;

  // Load Personalized Recommendations for authenticated home feed
  const fetchPersonalizedFeed = useCallback(async () => {
    if (!session || !session.username || session.role === 'guest') return;
    try {
      const res = await api.getRecommendedPosts(40);
      if (res && res.success && Array.isArray(res.posts) && res.posts.length > 0) {
        setPosts(prev => {
          const recIds = new Set(res.posts.map(p => p.id));
          const localOnly = (prev || []).filter(p => !recIds.has(p.id) && (p.id > 1000000000000 || p.authorId === session.username));
          return [...localOnly, ...res.posts];
        });
      }
    } catch (err) {
      console.warn('Personalized recommendations fetch error, using cached feed:', err);
    }
  }, [session]);

  useEffect(() => {
    if (session && !loading) {
      fetchPersonalizedFeed();
    }
  }, [session, loading, fetchPersonalizedFeed]);

  function timeAgo(dateString) {
    if (!dateString) return 'Just now';
    const past = new Date(dateString);
    const now = new Date();
    const diffSec = Math.floor((now - past) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    return `${diffDays}d ago`;
  }

  /* User Notifications */
  const userNotifications = (notifications || []).filter(n =>
    !session || n.recipientId === session.username || n.recipientId === 'all' || !n.recipientId
  );
  const unreadNotificationsCount = userNotifications.filter(n => !n.isRead).length;

  /* Filtered posts */
  const filteredPosts = (posts || []).filter(p => {
    if (activeTab === 'all') return true;
    if (activeTab === 'projects') return p.type === 'project';
    if (activeTab === 'events') return p.type === 'event';
    if (activeTab === 'issues') return p.type === 'issue';
    if (activeTab === 'ideas') return p.type === 'idea';
    return p.type === activeTab.slice(0, -1) || p.type === activeTab;
  });

  const trending   = (posts||[]).filter(p=>p.type==='project').sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,3);
  const latestEvts = (posts||[]).filter(p=>p.type==='event').slice(0,3);
  const topIdeas   = (posts||[]).filter(p=>p.type==='idea').sort((a,b)=>(b.likes||0)-(a.likes||0)).slice(0,3);

  /* ── Handlers ── */
  const navTo = useCallback((tab, query = null) => {
    setActiveTab(tab);
    setMobileOpen(false);

    let url = tab === 'all' ? '/' : `/${tab}`;
    if (tab === 'search') {
      const activeQ = query !== null ? query : searchQuery;
      if (query !== null) setSearchQuery(query);
      url = activeQ ? `/search?q=${encodeURIComponent(activeQ)}` : '/search';
    } else if (tab === 'profile' && selectedProfileUser?.userKey) {
      url = `/profile/${encodeURIComponent(selectedProfileUser.userKey)}`;
    }

    if (window.location.pathname + window.location.search !== url) {
      try { window.history.pushState({ tab, query }, '', url); } catch (_) {}
    }
  }, [searchQuery, selectedProfileUser]);

  /* ── Dynamic Notifications System ── */
  const addNotification = useCallback((notifData) => {
    const newNotif = {
      id: notifData.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipientId: notifData.recipientId || 'all',
      senderId: notifData.senderId || session?.username || 'system',
      senderName: notifData.senderName || session?.name || session?.username || 'System',
      senderAvatar: notifData.senderAvatar || (session?.name || session?.username || 'SY').substring(0, 2).toUpperCase(),
      type: notifData.type || 'system',
      title: notifData.title || 'Notification',
      message: notifData.message || '',
      targetTab: notifData.targetTab || null,
      targetId: notifData.targetId || null,
      targetChannel: notifData.targetChannel || null,
      isRead: false,
      createdAt: notifData.createdAt || new Date().toISOString()
    };

    setNotifications(prev => {
      const next = [newNotif, ...(prev || [])];
      broadcast('SYNC_NOTIFICATIONS', next);
      return next;
    });

    if (session && (newNotif.recipientId === session.username || newNotif.recipientId === 'all') && newNotif.senderId !== session.username) {
      setToast(`🔔 ${newNotif.title}: ${newNotif.message.substring(0, 60)}`);
    }

    try {
      api.createNotification(newNotif).catch(() => {});
    } catch (e) {}
  }, [session, broadcast]);

  const handleMarkNotificationRead = useCallback((notifId) => {
    setNotifications(prev => {
      const next = (prev || []).map(n => n.id === notifId ? { ...n, isRead: true } : n);
      broadcast('SYNC_NOTIFICATIONS', next);
      return next;
    });
    try { api.markNotificationRead(notifId).catch(() => {}); } catch(e) {}
  }, [broadcast]);

  const handleMarkAllNotificationsRead = useCallback(() => {
    setNotifications(prev => {
      const next = (prev || []).map(n => 
        (!session || n.recipientId === session.username || n.recipientId === 'all') ? { ...n, isRead: true } : n
      );
      broadcast('SYNC_NOTIFICATIONS', next);
      return next;
    });
    setToast('✓ All notifications marked as read.');
    try { api.markAllNotificationsRead().catch(() => {}); } catch(e) {}
  }, [session, broadcast]);

  const handleDeleteNotification = useCallback((notifId) => {
    setNotifications(prev => {
      const next = (prev || []).filter(n => n.id !== notifId);
      broadcast('SYNC_NOTIFICATIONS', next);
      return next;
    });
    try { api.deleteNotification(notifId).catch(() => {}); } catch(e) {}
  }, [broadcast]);

  const handleClearAllNotifications = useCallback(() => {
    setNotifications(prev => {
      const next = (prev || []).filter(n => 
        session && n.recipientId !== session.username && n.recipientId !== 'all'
      );
      broadcast('SYNC_NOTIFICATIONS', next);
      return next;
    });
    setToast('✓ All notifications cleared.');
    try { api.clearNotifications().catch(() => {}); } catch(e) {}
  }, [session, broadcast]);

  const handleNotificationClick = useCallback((notif) => {
    handleMarkNotificationRead(notif.id);
    setShowNotifications(false);
    
    if (notif.targetTab === 'workspaces' && notif.targetId) {
      setActiveWorkspaceId(notif.targetId);
      navTo('workspaces');
    } else if (notif.targetTab === 'ideas') {
      navTo('ideas');
    } else if (notif.targetTab === 'profile') {
      handleOpenUserProfile(notif.senderId);
    } else if (notif.targetTab === 'explore' || notif.targetTab === 'posts') {
      navTo('all');
    } else if (notif.targetTab) {
      navTo(notif.targetTab);
    }
  }, [handleMarkNotificationRead, handleOpenUserProfile]);

  function handleLike(id) {
    if (!session) return;
    const u = session.username;
    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const lb = p.likedBy || [];
        const liked = lb.includes(u);
        if (!liked) {
          broadcast('SYNC_POSTS', null, `${u} liked your post: ${p.title}`);
          const authorId = p.authorId || p.author;
          if (authorId && authorId !== u) {
            addNotification({
              recipientId: authorId,
              senderId: u,
              senderName: session.name || u,
              senderAvatar: session.avatar || u.slice(0, 2).toUpperCase(),
              type: 'post_like',
              title: 'Liked your post',
              message: `${session.name || u} liked your post "${p.title}"`,
              targetTab: 'all',
              targetId: String(p.id)
            });
          }
        }
        const newLb = liked ? lb.filter(x=>x!==u) : [...lb, u];
        return { ...p, likedBy: newLb, likes: newLb.length };
      });
      broadcast('SYNC_POSTS', next);
      return next;
    });
    try { 
      api.toggleLike(id).then(() => {
        fetchPersonalizedFeed();
      }).catch(() => {}); 
    } catch(e) {}
  }

  function handleCommentSubmit(e, postId) {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;

    const targetPost = (posts || []).find(p => p.id === postId);
    const authorId = targetPost?.authorId || targetPost?.author;

    setPosts(prev => prev.map(p =>
      p.id === postId ? { ...p, comments:[...p.comments,{ id:Date.now(), author:session.username, text }] } : p
    ));

    if (authorId && authorId !== session.username && targetPost) {
      addNotification({
        recipientId: authorId,
        senderId: session.username,
        senderName: session.name || session.username,
        senderAvatar: session.avatar || session.username.slice(0, 2).toUpperCase(),
        type: 'post_comment',
        title: 'New comment on your post',
        message: `${session.name || session.username} commented: "${text.substring(0, 60)}"`,
        targetTab: 'all',
        targetId: String(postId)
      });
    }

    try { api.addComment(postId, text).catch(() => {}); } catch(e) {}
    setCommentText('');
  }

  async function handleDeleteComment(postId, commentId) {
    const confirmed = await showConfirm('Are you sure you want to delete this comment?', 'Delete Comment', {
      isDanger: true,
      confirmText: 'Yes, Delete'
    });
    if (!confirmed) return;
    setPosts(prev => {
      const next = prev.map(p => p.id===postId ? { ...p, comments:p.comments.filter(c=>c.id!==commentId) } : p);
      broadcast('SYNC_POSTS', next);
      return next;
    });
    try { api.deleteComment(postId, commentId).catch(() => {}); } catch(e) {}
  }

  function handleDeletePost(id) {
    setPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      broadcast('SYNC_POSTS', next);
      storageManager.setItem('campushub_posts', next);
      return next;
    });

    // Cascade delete any linked workspace or requests
    const targetWs = (workspaces || []).find(w => w.ideaId === id || String(w.ideaId) === String(id) || w.id === `ws-${id}`);
    if (targetWs) {
      const wsId = targetWs.id;
      setWorkspaces(prev => {
        const next = (prev || []).filter(w => w.id !== wsId);
        broadcast('SYNC_WORKSPACES', next);
        storageManager.setItem('campushub_workspaces', next);
        return next;
      });
      setTasks(prev => {
        const next = (prev || []).filter(t => t.workspaceId !== wsId);
        broadcast('SYNC_TASKS', next);
        storageManager.setItem('campushub_tasks', next);
        return next;
      });
      setMilestones(prev => {
        const next = (prev || []).filter(m => m.workspaceId !== wsId);
        broadcast('SYNC_MILESTONES', next);
        storageManager.setItem('campushub_milestones', next);
        return next;
      });
      setDiscussions(prev => {
        const next = (prev || []).filter(d => d.workspaceId !== wsId);
        broadcast('SYNC_DISCUSSIONS', next);
        storageManager.setItem('campushub_discussions', next);
        return next;
      });
      setFiles(prev => {
        const next = (prev || []).filter(f => f.workspaceId !== wsId);
        broadcast('SYNC_FILES', next);
        storageManager.setItem('campushub_files', next);
        return next;
      });
      setChatMessages(prev => {
        const next = (prev || []).filter(c => c.workspaceId !== wsId);
        broadcast('SYNC_CHAT', next);
        storageManager.setItem('campushub_chat_messages', next);
        return next;
      });
      setActivities(prev => {
        const next = (prev || []).filter(a => a.workspaceId !== wsId);
        broadcast('SYNC_ACTIVITIES', next);
        storageManager.setItem('campushub_activities', next);
        return next;
      });
      if (activeWorkspaceId === wsId) {
        setActiveWorkspaceId(null);
      }
    }

    setContributionRequests(prev => {
      const next = (prev || []).filter(r => r.postId !== id && r.ideaId !== id && String(r.ideaId) !== String(id));
      broadcast('SYNC_REQUESTS', next);
      storageManager.setItem('campushub_contribution_requests', next);
      return next;
    });

    try { api.deletePost(id).catch(() => {}); } catch(e) {}
  }

  function handleToggleResolve(id) {
    const target = (posts || []).find(p => p.id === id);
    if (!target) return;
    const isAuthor = Boolean(session?.username && (target.authorId === session.username || target.author?.name === session.username));
    const isAdmin = session?.role === 'admin';
    if (!isAuthor && !isAdmin) {
      showToast('Only the author who posted this issue or an admin can resolve it.');
      return;
    }

    setPosts(prev => {
      const next = prev.map(p => {
        if (p.id !== id) return p;
        const res = !p.resolved;
        try { api.updatePost(id, { resolved: res, priority: res ? 'Resolved' : 'Medium' }).catch(() => {}); } catch(e) {}
        return { ...p, resolved: res };
      });
      broadcast('SYNC_POSTS', next);
      storageManager.setItem('campushub_posts', next);
      return next;
    });
  }

  async function handleClearIssue(id) {
    const target = (posts || []).find(p => p.id === id);
    if (!target) return;
    const isAuthor = Boolean(session?.username && (target.authorId === session.username || target.author?.name === session.username));
    const isAdmin = session?.role === 'admin';
    if (!isAuthor && !isAdmin) {
      showToast('Only the author who posted this issue or an admin can clear it.');
      return;
    }

    const confirmed = await showConfirm('Are you sure you want to permanently clear and remove this reported issue?', 'Clear Issue', {
      isDanger: true,
      confirmText: 'Yes, Clear'
    });
    if (!confirmed) return;

    setPosts(prev => {
      const next = prev.filter(p => p.id !== id);
      broadcast('SYNC_POSTS', next);
      storageManager.setItem('campushub_posts', next);
      return next;
    });

    try { api.deletePost(id).catch(() => {}); } catch(e) {}
  }

  async function handleShare(post) {
    if (!post) return;
    setSharingPost(post);
    const payload = encodePostShareData(post);
    const postUrl = `${window.location.origin}/post/${post.id}${payload ? `?pdata=${payload}` : ''}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(postUrl);
        setToast('✓ Post link copied to clipboard!');
      }
    } catch (_) {}
  }

  /* ─────────────────────────────────────────────────
     Ideas & Workspace Handlers
  ───────────────────────────────────────────────── */
  const handleAddIdea = (newIdea, newWorkspace) => {
    setIdeas(prev => {
      const next = [newIdea, ...(prev || [])];
      broadcast('SYNC_IDEAS', next, `💡 New Idea submitted: ${newIdea.title}`);
      return next;
    });

    if (newWorkspace) {
      setWorkspaces(prev => {
        const next = [newWorkspace, ...(prev || [])];
        broadcast('SYNC_WORKSPACES', next);
        return next;
      });

      const initAct = {
        id: `act-${Date.now()}`,
        workspaceId: newWorkspace.id,
        actorId: session.username,
        actorName: session.username,
        actorAvatar: session.username.slice(0, 2).toUpperCase(),
        action: 'created the workspace and launched the project',
        timestamp: new Date().toISOString(),
        type: 'workspace'
      };

      setActivities(prev => {
        const next = [initAct, ...(prev || [])];
        broadcast('SYNC_ACTIVITIES', next);
        return next;
      });
    }

    setToast(`💡 Idea "${newIdea.title}" submitted successfully!`);
  };

  const handleUpdateIdea = (ideaId, newStatus) => {
    setIdeas(prev => {
      const next = (prev || []).map(i => i.id === ideaId ? { ...i, status: newStatus, updatedAt: new Date().toISOString() } : i);
      broadcast('SYNC_IDEAS', next, `Idea status updated to ${newStatus}`);
      return next;
    });
    setToast(`✓ Status updated to ${newStatus}`);
  };

  const handleDeleteIdea = (ideaId) => {
    // 1. Remove Idea
    setIdeas(prev => {
      const next = (prev || []).filter(i => i.id !== ideaId);
      broadcast('SYNC_IDEAS', next);
      storageManager.setItem('campushub_ideas', next);
      return next;
    });

    // 2. Strict Rule: Close & Delete associated Workspace
    setWorkspaces(prev => {
      const targetWsIds = new Set(
        (prev || []).filter(ws => ws.ideaId === ideaId || ws.id === `ws-${ideaId}`).map(ws => ws.id)
      );
      const next = (prev || []).filter(ws => !targetWsIds.has(ws.id));
      storageManager.setItem('campushub_workspaces', next);

      // Cascade remove sub-entities
      setTasks(pTasks => {
        const nTasks = (pTasks || []).filter(t => !targetWsIds.has(t.workspaceId));
        storageManager.setItem('campushub_tasks', nTasks);
        return nTasks;
      });
      setMilestones(pM => {
        const nM = (pM || []).filter(m => !targetWsIds.has(m.workspaceId));
        storageManager.setItem('campushub_milestones', nM);
        return nM;
      });
      setDiscussions(pD => {
        const nD = (pD || []).filter(d => !targetWsIds.has(d.workspaceId));
        storageManager.setItem('campushub_discussions', nD);
        return nD;
      });
      setFiles(pF => {
        const nF = (pF || []).filter(f => !targetWsIds.has(f.workspaceId));
        storageManager.setItem('campushub_files', nF);
        return nF;
      });
      setActivities(pA => {
        const nA = (pA || []).filter(a => !targetWsIds.has(a.workspaceId));
        storageManager.setItem('campushub_activities', nA);
        return nA;
      });
      setChatMessages(pC => {
        const nC = (pC || []).filter(c => !targetWsIds.has(c.workspaceId));
        storageManager.setItem('campushub_chat_messages', nC);
        return nC;
      });

      return next;
    });

    // 3. Remove Contribution Requests
    setContributionRequests(prev => {
      const next = (prev || []).filter(r => r.ideaId !== ideaId);
      storageManager.setItem('campushub_contribution_requests', next);
      return next;
    });

    // 4. If current active workspace is deleted, reset activeWorkspaceId
    setActiveWorkspaceId(prev => {
      if (prev && (prev === `ws-${ideaId}` || prev.includes(ideaId))) return null;
      return prev;
    });

    // 5. Backend Sync
    try {
      api.deleteIdea(ideaId);
    } catch (e) {
      console.warn('API deleteIdea fallback:', e);
    }

    setToast('✓ Idea and its workspace have been deleted and closed.');
  };

  const handleToggleSupport = (ideaId) => {
    if (!session) return;
    const u = session.username;

    setIdeas(prev => {
      const next = (prev || []).map(idea => {
        if (idea.id !== ideaId) return idea;
        const supported = (idea.supportedBy || []).includes(u);
        const newSupportedBy = supported
          ? (idea.supportedBy || []).filter(x => x !== u)
          : [...(idea.supportedBy || []), u];
        const newCount = (idea.supportCount || idea.supportedBy?.length || 0) + (supported ? -1 : 1);

        if (!supported) {
          broadcast('SYNC_IDEAS', null, `💡 ${u} supported your idea: ${idea.title}`);
        }

        return {
          ...idea,
          supportedBy: newSupportedBy,
          supportCount: Math.max(0, newCount)
        };
      });

      broadcast('SYNC_IDEAS', next);
      return next;
    });
  };

  const handleToggleFollow = (ideaId) => {
    if (!session) return;
    const u = session.username;

    setIdeas(prev => {
      const next = (prev || []).map(idea => {
        if (idea.id !== ideaId) return idea;
        const followed = (idea.followedBy || []).includes(u);
        const newFollowedBy = followed
          ? (idea.followedBy || []).filter(x => x !== u)
          : [...(idea.followedBy || []), u];

        return { ...idea, followedBy: newFollowedBy };
      });

      broadcast('SYNC_IDEAS', next);
      return next;
    });
  };

  const handleLeaveWorkspace = (workspaceId) => {
    if (!session?.username) return;
    const currentUsername = session.username;

    // 1. Locate target workspace
    const targetWs = (workspaces || []).find(w => w.id === workspaceId);
    const wsName = targetWs?.name || 'Workspace';

    // 2. Remove user from workspace members
    setWorkspaces(prev => {
      const next = (prev || []).map(ws => {
        if (ws.id !== workspaceId) return ws;
        const updatedMembers = (ws.members || []).filter(m => m.userId !== currentUsername && m.username !== currentUsername);
        return {
          ...ws,
          members: updatedMembers
        };
      });
      broadcast('SYNC_WORKSPACES', next);
      storageManager.setItem('campushub_workspaces', next);
      return next;
    });

    // 3. Mark contribution requests for this user on this idea as LEFT
    setContributionRequests(prev => {
      const next = (prev || []).map(r => {
        if (r.applicantId === currentUsername && (r.workspaceId === workspaceId || (targetWs?.ideaId && (r.ideaId === targetWs.ideaId || String(r.ideaId) === String(targetWs.ideaId))))) {
          return { ...r, status: 'LEFT' };
        }
        return r;
      });
      broadcast('SYNC_REQUESTS', next);
      storageManager.setItem('campushub_contribution_requests', next);
      return next;
    });

    // 4. Record Activity
    const leaveAct = {
      id: `act-${Date.now()}`,
      workspaceId: workspaceId,
      actorId: currentUsername,
      actorName: session.name || currentUsername,
      actorAvatar: (session.name || currentUsername).substring(0, 2).toUpperCase(),
      action: 'left the workspace',
      timestamp: new Date().toISOString(),
      type: 'member'
    };
    setActivities(prev => {
      const next = [leaveAct, ...(prev || [])];
      broadcast('SYNC_ACTIVITIES', next);
      storageManager.setItem('campushub_activities', next);
      return next;
    });

    // 5. Switch active workspace to another valid one or null
    setActiveWorkspaceId(prev => {
      if (prev === workspaceId) {
        const remainingMyWs = (workspaces || []).filter(w => 
          w.id !== workspaceId && 
          w.status !== 'CLOSED' && 
          ((w.members || []).some(m => m.userId === currentUsername) || w.ownerId === currentUsername)
        );
        return remainingMyWs.length > 0 ? remainingMyWs[0].id : null;
      }
      return prev;
    });

    // 6. Backend API sync
    try {
      api.leaveWorkspace(workspaceId).catch(() => {});
    } catch(e) {}

    setToast(`✓ You have left "${wsName}". To rejoin, submit a new contribution request from the Ideas page.`);
  };

  const handleSubmitContributionRequest = (req) => {
    setContributionRequests(prev => {
      // Replace any existing or previous request from this applicant for this idea
      const filtered = (prev || []).filter(r => !(r.applicantId === req.applicantId && (r.ideaId === req.ideaId || String(r.ideaId) === String(req.ideaId))));
      const next = [req, ...filtered];
      broadcast('SYNC_CONTRIBUTIONS', next, `👥 New contribution request from ${req.applicantName}`);
      storageManager.setItem('campushub_contribution_requests', next);
      return next;
    });

    const targetIdea = (ideas || []).find(i => i.id === req.ideaId || String(i.id) === String(req.ideaId));
    const targetPost = (posts || []).find(p => p.id === req.ideaId || String(p.id) === String(req.ideaId));
    const ownerId = targetIdea?.creatorId || targetPost?.authorId || targetPost?.author?.name || 'admin';
    if (ownerId && ownerId !== req.applicantId) {
      addNotification({
        recipientId: ownerId,
        senderId: req.applicantId,
        senderName: req.applicantName,
        senderAvatar: req.applicantAvatar,
        type: 'contribution_request',
        title: 'New Contribution Request',
        message: `${req.applicantName} applied for "${req.ideaTitle || targetIdea?.title || 'your project'}"`,
        targetTab: 'ideas',
        targetId: req.ideaId
      });
    }

    try {
      api.submitContributionRequest(req.ideaId, req).catch(() => {});
    } catch(e) {}

    setToast('✓ Contribution request sent to project owner!');
  };

  const handleAcceptContributionRequest = (req) => {
    // 1. Locate target Idea or Post
    const targetIdea = (ideas || []).find(i => i.id === req.ideaId || String(i.id) === String(req.ideaId));
    const targetPost = (posts || []).find(p => p.id === req.ideaId || String(p.id) === String(req.ideaId));

    const ideaTitle = targetIdea?.title || targetPost?.title || req.ideaTitle || 'Campus Innovation Project';
    const ideaCategory = targetIdea?.category || targetPost?.tags?.[0] || 'Technology';
    const ownerUsername = targetIdea?.creatorId || targetPost?.authorId || targetPost?.author?.name || session?.username || 'admin';
    const ownerName = targetIdea?.creatorName || targetPost?.author?.name || ownerUsername;

    // 2. Find existing workspace or create a new workspace for this idea
    let targetWsId = req.workspaceId || targetIdea?.workspaceId || targetPost?.workspaceId;
    let targetWs = (workspaces || []).find(w =>
      w.id === targetWsId || w.ideaId === req.ideaId || String(w.ideaId) === String(req.ideaId) || w.name === ideaTitle
    );

    if (!targetWs) {
      // Create new dedicated Workspace for this Idea
      targetWsId = `ws-${Date.now()}`;
      const newWorkspace = {
        id: targetWsId,
        ideaId: req.ideaId,
        name: ideaTitle,
        category: ideaCategory,
        description: targetIdea?.problem || targetIdea?.solution || targetPost?.description || `Collaborative development workspace for ${ideaTitle}.`,
        createdAt: new Date().toISOString(),
        members: [
          {
            userId: ownerUsername,
            name: ownerName,
            avatar: ownerName ? ownerName.substring(0, 2).toUpperCase() : 'OW',
            role: 'Owner',
            joinedAt: new Date().toISOString()
          },
          {
            userId: req.applicantId,
            name: req.applicantName,
            avatar: req.applicantAvatar || (req.applicantName ? req.applicantName.substring(0, 2).toUpperCase() : 'CU'),
            role: 'Contributor',
            contributionRole: (req.roles && req.roles[0]) || 'Contributor',
            department: req.applicantDepartment || 'Student',
            joinedAt: new Date().toISOString(),
            tasksCompleted: 0,
            totalAssigned: 0
          }
        ]
      };

      setWorkspaces(prev => {
        const next = [newWorkspace, ...(prev || [])];
        broadcast('SYNC_WORKSPACES', next);
        return next;
      });

      targetWs = newWorkspace;
    } else {
      // Add accepted member to existing workspace if not present
      targetWsId = targetWs.id;
      setWorkspaces(prev => {
        const next = (prev || []).map(ws => {
          if (ws.id !== targetWs.id) return ws;
          const exists = (ws.members || []).some(m => m.userId === req.applicantId);
          if (exists) return ws;

          const newMember = {
            userId: req.applicantId,
            name: req.applicantName,
            avatar: req.applicantAvatar || (req.applicantName ? req.applicantName.substring(0, 2).toUpperCase() : 'CU'),
            role: 'Contributor',
            contributionRole: (req.roles && req.roles[0]) || 'Contributor',
            department: req.applicantDepartment || 'Student',
            joinedAt: new Date().toISOString(),
            tasksCompleted: 0,
            totalAssigned: 0
          };

          return {
            ...ws,
            members: [...(ws.members || []), newMember]
          };
        });

        broadcast('SYNC_WORKSPACES', next);
        return next;
      });
    }

    // 3. Update Request status to ACCEPTED and link targetWsId
    setContributionRequests(prev => {
      const next = (prev || []).map(r =>
        (r.id === req.id || (r.ideaId === req.ideaId && r.applicantId === req.applicantId))
          ? { ...r, status: 'ACCEPTED', workspaceId: targetWsId }
          : r
      );
      broadcast('SYNC_CONTRIBUTIONS', next, `🎉 ${req.applicantName}'s request was accepted!`);
      return next;
    });

    // 4. Update Idea and Post objects so workspaceId is linked!
    setIdeas(prev => {
      if (!prev) return prev;
      const next = prev.map(i =>
        (i.id === req.ideaId || String(i.id) === String(req.ideaId))
          ? { ...i, workspaceId: targetWsId }
          : i
      );
      broadcast('SYNC_IDEAS', next);
      return next;
    });

    setPosts(prev => {
      if (!prev) return prev;
      const next = prev.map(p =>
        (p.id === req.ideaId || String(p.id) === String(req.ideaId))
          ? { ...p, workspaceId: targetWsId }
          : p
      );
      broadcast('SYNC_POSTS', next);
      return next;
    });

    // 5. Add Activity log
    const joinAct = {
      id: `act-${Date.now()}`,
      workspaceId: targetWsId,
      actorId: req.applicantId,
      actorName: req.applicantName,
      actorAvatar: req.applicantAvatar,
      action: `joined the team as ${(req.roles && req.roles[0]) || 'Contributor'}`,
      timestamp: new Date().toISOString(),
      type: 'member'
    };

    setActivities(prev => {
      const next = [joinAct, ...(prev || [])];
      broadcast('SYNC_ACTIVITIES', next);
      return next;
    });

    // 6. Notify applicant
    addNotification({
      recipientId: req.applicantId,
      senderId: session?.username || ownerUsername,
      senderName: session?.name || session?.username || ownerName,
      senderAvatar: session?.avatar || (ownerName ? ownerName.substring(0, 2).toUpperCase() : 'OW'),
      type: 'contribution_status',
      title: 'Contribution Accepted! 🎉',
      message: `Your request to join "${ideaTitle}" was accepted! Workspace is ready.`,
      targetTab: 'workspaces',
      targetId: targetWsId
    });

    try {
      api.respondContributionRequest(req.id, 'ACCEPT').catch(() => {});
    } catch(e) {}

    setToast(`✓ Accepted ${req.applicantName}! Workspace "${ideaTitle}" is ready.`);
  };

  const handleRejectContributionRequest = (reqId) => {
    const req = (contributionRequests || []).find(r => r.id === reqId);
    setContributionRequests(prev => {
      const next = (prev || []).map(r => r.id === reqId ? { ...r, status: 'REJECTED' } : r);
      broadcast('SYNC_CONTRIBUTIONS', next);
      return next;
    });

    if (req) {
      addNotification({
        recipientId: req.applicantId,
        senderId: session?.username || 'admin',
        senderName: session?.name || session?.username || 'Project Lead',
        senderAvatar: session?.avatar || 'PL',
        type: 'contribution_status',
        title: 'Contribution Request Update',
        message: `Your request to join "${req.ideaTitle || 'the project'}" was not accepted.`,
        targetTab: 'ideas',
        targetId: req.ideaId
      });
    }

    try {
      api.respondContributionRequest(reqId, 'REJECT').catch(() => {});
    } catch(e) {}

    setToast('Application declined.');
  };

  /* Workspace Task Actions */
  const handleAddTask = (task) => {
    setTasks(prev => {
      const next = [task, ...(prev || [])];
      broadcast('SYNC_TASKS', next, `📋 New Task added: ${task.title}`);
      return next;
    });

    const act = {
      id: `act-${Date.now()}`,
      workspaceId: task.workspaceId,
      actorId: session.username,
      actorName: session.username,
      actorAvatar: session.username.slice(0, 2).toUpperCase(),
      action: `created task: ${task.title}`,
      timestamp: new Date().toISOString(),
      type: 'task'
    };

    setActivities(prev => {
      const next = [act, ...(prev || [])];
      broadcast('SYNC_ACTIVITIES', next);
      return next;
    });

    if (task.assigneeId && task.assigneeId !== session?.username) {
      addNotification({
        recipientId: task.assigneeId,
        senderId: session?.username || 'lead',
        senderName: session?.name || session?.username || 'Team Lead',
        senderAvatar: session?.avatar || (session?.username || 'TL').slice(0, 2).toUpperCase(),
        type: 'task_assignment',
        title: 'Task Assigned',
        message: `You were assigned: "${task.title}"`,
        targetTab: 'workspaces',
        targetId: task.workspaceId
      });
    }

    try {
      api.createTask(task.workspaceId, task).catch(() => {});
    } catch(e) {}

    setToast(`✓ Task "${task.title}" created.`);
  };

  const handleUpdateTask = (task) => {
    setTasks(prev => {
      const next = (prev || []).map(t => t.id === task.id ? task : t);
      broadcast('SYNC_TASKS', next);
      return next;
    });

    if (task.status === 'DONE') {
      const act = {
        id: `act-${Date.now()}`,
        workspaceId: task.workspaceId,
        actorId: session.username,
        actorName: session.username,
        actorAvatar: session.username.slice(0, 2).toUpperCase(),
        action: `completed task: ${task.title}`,
        timestamp: new Date().toISOString(),
        type: 'task'
      };

      setActivities(prev => {
        const next = [act, ...(prev || [])];
        broadcast('SYNC_ACTIVITIES', next);
        return next;
      });
    }
  };

  const handleDeleteTask = (taskId) => {
    setTasks(prev => {
      const next = (prev || []).filter(t => t.id !== taskId);
      broadcast('SYNC_TASKS', next);
      return next;
    });
    setToast('✓ Task deleted.');
  };

  /* Workspace Milestone Actions */
  const handleAddMilestone = (ms) => {
    setMilestones(prev => {
      const next = [ms, ...(prev || [])];
      broadcast('SYNC_MILESTONES', next, `🎯 New milestone created: ${ms.title}`);
      return next;
    });

    const act = {
      id: `act-${Date.now()}`,
      workspaceId: ms.workspaceId,
      actorId: session.username,
      actorName: session.username,
      actorAvatar: session.username.slice(0, 2).toUpperCase(),
      action: `added milestone: ${ms.title}`,
      timestamp: new Date().toISOString(),
      type: 'milestone'
    };

    setActivities(prev => {
      const next = [act, ...(prev || [])];
      broadcast('SYNC_ACTIVITIES', next);
      return next;
    });

    setToast(`✓ Milestone "${ms.title}" created.`);
  };

  const handleUpdateMilestone = (ms) => {
    setMilestones(prev => {
      const next = (prev || []).map(m => m.id === ms.id ? ms : m);
      broadcast('SYNC_MILESTONES', next);
      return next;
    });

    if (ms.completed) {
      const act = {
        id: `act-${Date.now()}`,
        workspaceId: ms.workspaceId,
        actorId: session.username,
        actorName: session.username,
        actorAvatar: session.username.slice(0, 2).toUpperCase(),
        action: `achieved milestone: ${ms.title} 🎉`,
        timestamp: new Date().toISOString(),
        type: 'milestone'
      };

      setActivities(prev => {
        const next = [act, ...(prev || [])];
        broadcast('SYNC_ACTIVITIES', next);
        return next;
      });
    }
  };

  const handleDeleteMilestone = (msId) => {
    setMilestones(prev => {
      const next = (prev || []).filter(m => m.id !== msId);
      broadcast('SYNC_MILESTONES', next);
      return next;
    });
    setToast('✓ Milestone deleted.');
  };

  /* Workspace Discussion Actions */
  const handleAddDiscussion = (disc) => {
    setDiscussions(prev => {
      const next = [disc, ...(prev || [])];
      broadcast('SYNC_DISCUSSIONS', next, `💬 New discussion: ${disc.title}`);
      return next;
    });

    const act = {
      id: `act-${Date.now()}`,
      workspaceId: disc.workspaceId,
      actorId: session.username,
      actorName: session.username,
      actorAvatar: session.username.slice(0, 2).toUpperCase(),
      action: `started discussion: ${disc.title}`,
      timestamp: new Date().toISOString(),
      type: 'discussion'
    };

    setActivities(prev => {
      const next = [act, ...(prev || [])];
      broadcast('SYNC_ACTIVITIES', next);
      return next;
    });

    setToast(`✓ Discussion posted.`);
  };

  const handleUpdateDiscussion = (disc) => {
    setDiscussions(prev => {
      const next = (prev || []).map(d => d.id === disc.id ? disc : d);
      broadcast('SYNC_DISCUSSIONS', next);
      return next;
    });
  };

  /* Workspace File Actions */
  const handleAddFile = (file) => {
    setFiles(prev => {
      const next = [file, ...(prev || [])];
      broadcast('SYNC_FILES', next, `📁 File uploaded: ${file.name}`);
      return next;
    });

    const act = {
      id: `act-${Date.now()}`,
      workspaceId: file.workspaceId,
      actorId: session.username,
      actorName: session.username,
      actorAvatar: session.username.slice(0, 2).toUpperCase(),
      action: `uploaded file ${file.name} to ${file.folder}`,
      timestamp: new Date().toISOString(),
      type: 'file'
    };

    setActivities(prev => {
      const next = [act, ...(prev || [])];
      broadcast('SYNC_ACTIVITIES', next);
      return next;
    });

    setToast(`✓ File "${file.name}" uploaded.`);
  };

  const handleDeleteFile = (fileId) => {
    setFiles(prev => {
      const next = (prev || []).filter(f => f.id !== fileId);
      broadcast('SYNC_FILES', next);
      return next;
    });
    setToast('✓ File removed.');
  };

  /* Workspace Member Role Actions */
  const handleUpdateMemberRole = (workspaceId, userId, newRole) => {
    setWorkspaces(prev => {
      const next = (prev || []).map(ws => {
        if (ws.id !== workspaceId) return ws;
        const updatedMembers = (ws.members || []).map(m => m.userId === userId ? { ...m, role: newRole } : m);
        return { ...ws, members: updatedMembers };
      });
      broadcast('SYNC_WORKSPACES', next);
      return next;
    });
    setToast(`✓ Member role updated to ${newRole}`);
  };

  /* Workspace Chat Actions */
  const handleSendChatMessage = (newMsg) => {
    const text = (newMsg.content || newMsg.message || '').trim();
    if (!text && !newMsg.codeSnippet?.code) return;

    if (text.length > 1000) {
      showAlert('Messages cannot exceed 1000 characters. Please shorten your message.', 'Message Too Long', 'warning');
      return;
    }

    setChatMessages(prev => {
      const next = [...(prev || []), newMsg];
      broadcast('SYNC_CHAT_MESSAGES', next);
      return next;
    });

    // Notify workspace members
    const targetWs = (workspaces || []).find(w => w.id === newMsg.workspaceId);
    if (targetWs) {
      const memberIds = new Set((targetWs.members || []).map(m => m.userId || m.username));
      if (targetWs.ownerId) memberIds.add(targetWs.ownerId);
      if (targetWs.leadId) memberIds.add(targetWs.leadId);

      memberIds.forEach(mId => {
        if (mId && mId !== (session?.username || newMsg.senderId)) {
          addNotification({
            recipientId: mId,
            senderId: session?.username || newMsg.senderId,
            senderName: newMsg.senderName,
            senderAvatar: newMsg.senderAvatar,
            type: 'chat',
            title: `New Message in #${newMsg.channel || 'general'}`,
            message: `${newMsg.senderName} (${targetWs.name}): ${text ? text.substring(0, 60) : 'shared a code snippet'}`,
            targetTab: 'workspaces',
            targetId: newMsg.workspaceId,
            targetChannel: newMsg.channel || 'general'
          });
        }
      });
    }

    try {
      api.sendChatMessage(newMsg.workspaceId, newMsg).catch(() => {});
    } catch(e) {}
  };

  const handleDeleteChatMessage = (msgId) => {
    const targetMsg = (chatMessages || []).find(m => m.id === msgId);
    setChatMessages(prev => {
      const next = (prev || []).filter(m => m.id !== msgId);
      broadcast('SYNC_CHAT_MESSAGES', next);
      return next;
    });

    if (targetMsg) {
      try {
        api.deleteChatMessage(targetMsg.workspaceId, msgId).catch(() => {});
      } catch(e) {}
    }

    setToast('✓ Message deleted.');
  };

  const handleClearAllChatMessages = (workspaceId, channel) => {
    setChatMessages(prev => {
      const next = (prev || []).filter(m => {
        if (channel) {
          return !(m.workspaceId === workspaceId && (m.channel === channel || (!m.channel && channel === 'general')));
        }
        return m.workspaceId !== workspaceId;
      });
      broadcast('SYNC_CHAT_MESSAGES', next);
      return next;
    });

    try {
      api.clearAllChatMessages(workspaceId, channel).catch(() => {});
    } catch(e) {}

    setToast('✓ All messages cleared.');
  };

  const handleReactChatMessage = (msgId, emoji) => {
    if (!session) return;
    const u = session.username;
    let targetWsId = null;

    setChatMessages(prev => {
      const next = (prev || []).map(m => {
        if (m.id !== msgId) return m;
        targetWsId = m.workspaceId;
        const existingReactions = { ...(m.reactions || {}) };
        const userList = existingReactions[emoji] || [];
        const hasReacted = userList.includes(u);
        const nextUsers = hasReacted ? userList.filter(x => x !== u) : [...userList, u];
        if (nextUsers.length > 0) {
          existingReactions[emoji] = nextUsers;
        } else {
          delete existingReactions[emoji];
        }
        return { ...m, reactions: existingReactions };
      });
      broadcast('SYNC_CHAT_MESSAGES', next);
      return next;
    });

    if (targetWsId) {
      try {
        api.reactChatMessage(targetWsId, msgId, emoji).catch(() => {});
      } catch(e) {}
    }
  };

  /* New Post submit */
  async function handlePublish(e) {
    e.preventDefault();
    if (isNew && (postType==='event'||postType==='issue')) {
      showAlert("You don't have permission to publish this post type.", "Permission Denied", "warning");
      return;
    }
    const fd = new FormData(e.target);
    if (postType==='event') {
      if (fd.get('eventDate') < today()) {
        showAlert('Event date cannot be in the past.', 'Invalid Date', 'warning');
        return;
      }
      if (!/^\d{10}$/.test(fd.get('contactInfo'))) {
        showAlert('Contact must be a 10-digit number.', 'Invalid Contact', 'warning');
        return;
      }
    }
    setPublishing(true);

    const buildPost = (imageUrl) => {
      const base = {
        id: Date.now(), type: postType,
        title: fd.get('title'),
        description: fd.get('description') || fd.get('explanation'),
        tags: fd.get('tags') ? fd.get('tags').split(',').map(t=>t.trim()).filter(Boolean) : [fd.get('category')],
        image: imageUrl || fd.get('imageLink') || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=800',
        author: { name: session.username, avatar: session.username.slice(0,2).toUpperCase() },
        authorId: session.username,
        date: 'Just now', likes: 0, likedBy: [], comments: [],
      };
      if (postType==='idea') Object.assign(base, { studentName:fd.get('studentName'), rollNumber:fd.get('rollNumber'), department:fd.get('department'), year:fd.get('year'), status:'Proposed' });
      if (postType==='issue') Object.assign(base, { priority:fd.get('priority'), resolved:false });
      if (postType==='event') Object.assign(base, { organization:fd.get('organization'), location:fd.get('venue'), eventDate:fd.get('eventDate'), eventTime:fd.get('eventTime'), duration:fd.get('duration'), category:fd.get('category'), participantType:fd.get('participantType'), minTeamSize:fd.get('minTeamSize'), maxTeamSize:fd.get('maxTeamSize'), contactInfo:fd.get('contactInfo'), organizerName:fd.get('organizerName') });
      setPosts(prev => {
        const next = [base, ...prev];
        broadcast('SYNC_POSTS', next);
        return next;
      });
      try { api.createPost(base).catch(() => {}); } catch(e) {}
      setShowNewPost(false);
      setPublishing(false);
      e.target.reset();
      showAlert(`${postType.charAt(0).toUpperCase()+postType.slice(1)} published successfully!`, 'Published', 'success');
    };

    const imgFile = fd.get('eventImage');
    if (imgFile && imgFile.size > 0) {
      if (imgFile.size > 5*1024*1024) {
        showAlert('Image exceeds 5MB limit.', 'File Too Large', 'warning');
        setPublishing(false);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => buildPost(reader.result);
      reader.readAsDataURL(imgFile);
    } else {
      setTimeout(() => buildPost(null), 600);
    }
  }

  /* Register for event */
  function handleEventRegister(e) {
    e.preventDefault();
    setRegs(prev => ({ ...prev, [selectedEvent.id]: true }));
    showAlert('Successfully registered for the event!', 'Registered', 'success');
    setShowReg(false);
    setSelectedEvent(null);
  }

  /* Update event */
  function handleUpdateEvent(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    if (fd.get('eventDate') < today()) {
      showAlert('Event date cannot be in the past.', 'Invalid Date', 'warning');
      return;
    }
    if (!/^\d{10}$/.test(fd.get('contactInfo'))) {
      showAlert('Contact must be 10 digits.', 'Invalid Contact', 'warning');
      return;
    }
    const updated = { ...selectedEvent, title:fd.get('title'), organization:fd.get('organization'), location:fd.get('venue'), description:fd.get('explanation'), eventDate:fd.get('eventDate'), eventTime:fd.get('eventTime'), duration:fd.get('duration'), category:fd.get('category'), participantType:fd.get('participantType'), minTeamSize:fd.get('minTeamSize'), maxTeamSize:fd.get('maxTeamSize'), contactInfo:fd.get('contactInfo'), organizerName:fd.get('organizerName') };
    setPosts(prev => prev.map(p => p.id===updated.id ? updated : p));
    setSelectedEvent(updated);
    setEditEvent(false);
    showAlert('Event details updated successfully!', 'Event Updated', 'success');
  }

  /* Admin: update profile */
  async function handleAdminProfile(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const oldPw = fd.get('oldPassword');
    const newPw = fd.get('newPassword');
    const newName = fd.get('username')?.trim().toLowerCase() || session.username;

    if (newPw && newPw.trim()) {
      if (newPw.length < 8) {
        showAlert('New password must be at least 8 characters.', 'Weak Password', 'warning');
        return;
      }
      if (oldPw && !await verifyPassword(oldPw, users[session.username].password)) {
        showAlert('Old password is incorrect!', 'Authentication Error', 'error');
        return;
      }
    }
    const next = { ...users };
    const current = next[session.username] || { role: 'admin' };
    delete next[session.username];
    const pw = (newPw && newPw.trim()) ? await hashPassword(newPw) : current.password;
    next[newName] = { ...current, password: pw };
    setUsers(next);
    storageManager.setItem('campushub_users', next);
    const newSession = { ...session, username: newName };
    setSession(newSession);
    storageManager.setItem('campushub_session', newSession);
    showAlert('Admin profile updated successfully!', 'Profile Updated', 'success');

  }

  /* Admin: add admin */
  async function handleAddAdmin(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const u = fd.get('username').trim().toLowerCase();
    if (users[u]) {
      showAlert(`User "${u}" already exists!`, 'User Exists', 'warning');
      return;
    }
    const hashed = await hashPassword(fd.get('password'));
    setUsers(prev => ({ ...prev, [u]:{ password: hashed, role:'admin' } }));
    e.target.reset();
    showAlert(`Admin "${u}" created successfully!`, 'Admin Created', 'success');
  }

  /* Admin: add student */
  async function handleAddStudent(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const u = fd.get('username').trim().toLowerCase();
    if (users[u]) {
      showAlert(`User "${u}" already exists!`, 'User Exists', 'warning');
      return;
    }
    const hashed = await hashPassword(fd.get('password'));
    setUsers(prev => ({ ...prev, [u]:{ password: hashed, role:'student' } }));
    e.target.reset();
    showAlert(`Student "${u}" added successfully!`, 'Student Added', 'success');
  }

  /* Admin: edit user */
  async function handleEditUser(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newU = fd.get('newUsername').trim().toLowerCase();
    const newPw = fd.get('newPassword');
    const newRole = fd.get('role');
    const orig = editUser.originalUsername;
    if (newU !== orig && users[newU]) {
      showAlert(`Username "${newU}" is already taken!`, 'Username Taken', 'warning');
      return;
    }
    const next = { ...users };
    delete next[orig];
    let pw = editUser.password;
    if (newPw && newPw.trim()) {
      if (newPw.length < 8) {
        showAlert('Password must be at least 8 characters.', 'Weak Password', 'warning');
        return;
      }
      pw = await hashPassword(newPw);
    }
    next[newU] = { role: newRole || editUser.role, password: pw, email: editUser.email||'', avatar: editUser.avatar||null };
    setUsers(next);
    broadcast('SYNC_USERS', next);
    if (session.username === orig) setSession(s => ({ ...s, username: newU, role: newRole||editUser.role }));
    setShowEditUser(false); setEditUser(null);
    showAlert('User updated successfully!', 'User Updated', 'success');
  }

  /* Admin: delete user */
  async function handleDeleteUser(u) {
    if (u === session.username) {
      showAlert("You cannot delete your own account!", "Action Not Allowed", "warning");
      return;
    }
    const confirmed = await showConfirm(`Are you sure you want to delete user "${u}"?`, 'Delete User', {
      isDanger: true,
      confirmText: 'Yes, Delete'
    });
    if (!confirmed) return;
    setUsers(prev => { const n = {...prev}; delete n[u]; return n; });
  }

  /* Student: profile update */
  async function handleStudentProfile(e) {
    e.preventDefault();
    const fd = new FormData(e.target);
    const oldPw = fd.get('oldPassword');
    const newPw = fd.get('newPassword');
    const newName = fd.get('username')?.trim().toLowerCase() || session.username;

    // Only verify password if user has entered a new password to change
    if (newPw && newPw.trim()) {
      if (newPw.length < 8) {
        showAlert('New password must be at least 8 characters.', 'Weak Password', 'warning');
        return;
      }
      if (oldPw && !await verifyPassword(oldPw, users[session.username].password)) {
        showAlert('Current password is incorrect!', 'Authentication Error', 'error');
        return;
      }
    }

    if (newName !== session.username && users[newName]) {
      showAlert('Username is already taken!', 'Username Taken', 'warning');
      return;
    }

    const processAvatar = async (avatarData) => {
      const next = { ...users };
      const cur = next[session.username] || { role: 'student' };
      delete next[session.username];
      const pw = (newPw && newPw.trim()) ? await hashPassword(newPw) : cur.password;
      
      const rawSkills = fd.get('skills');
      let skillsArr = [];
      if (rawSkills !== null && rawSkills !== undefined) {
        skillsArr = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
      } else if (Array.isArray(cur.skills)) {
        skillsArr = cur.skills;
      }

      const updated = { 
        ...cur, 
        password: pw, 
        avatar: avatarData || cur.avatar,
        institution: fd.get('institution')?.trim() || '',
        major: fd.get('major')?.trim() || '',
        bio: fd.get('bio')?.trim() || '',
        skills: skillsArr
      };
      next[newName] = updated;
      setUsers(next);
      storageManager.setItem('campushub_users', next);
      const newSession = {
        ...session,
        username: newName,
        avatar: updated.avatar,
        institution: updated.institution,
        major: updated.major,
        bio: updated.bio,
        skills: updated.skills
      };
      setSession(newSession);
      storageManager.setItem('campushub_session', newSession);

      try {
        api.updateProfile({
          username: newName,
          institution: updated.institution,
          major: updated.major,
          bio: updated.bio,
          skills: updated.skills,
          avatar: updated.avatar,
          ...(newPw ? { newPassword: newPw, oldPassword: oldPw } : {})
        }).catch(() => {});
      } catch (_) {}

      setAvatarPreview(null);
      showAlert('Profile details saved successfully!', 'Profile Updated', 'success');
    };


    const avatarFile = fd.get('avatar');
    if (avatarFile && avatarFile.size > 0) {
      const r = new FileReader();
      r.onloadend = () => processAvatar(r.result);
      r.readAsDataURL(avatarFile);
    } else processAvatar(null);
  }

  /* Register new user */
  async function handleRegister(u, pw, em) {
    if (users?.[u]) return { success:false, message:'Username already exists!' };
    try {
      const res = await api.register({ username: u, password: pw, email: em });
      if (res && res.success) {
        const hashed = await hashPassword(pw);
        const registeredUser = {
          password: hashed,
          role: res.user?.role || 'student',
          name: res.user?.name || u,
          email: em || '',
          avatar: res.user?.avatar || getUserInitials(u, u),
          institution: res.user?.institution || '',
          major: res.user?.major || '',
          bio: res.user?.bio || '',
          skills: res.user?.skills || [],
          ...res.user
        };
        setUsers(prev => ({ ...prev, [u]: registeredUser }));

        // Dispatch EmailJS Welcome Email
        sendWelcomeEmail({
          name: registeredUser.name,
          username: u,
          email: em || registeredUser.email
        }).catch(err => console.warn('Welcome email dispatch error:', err));

        return { success: true };
      } else if (res && res.message) {
        return { success: false, message: res.message };
      }
    } catch (e) {
      console.warn('API register fallback to local state:', e);
    }
    const hashed = await hashPassword(pw);
    const localUser = {
      password: hashed,
      role: 'student',
      name: u,
      email: em || '',
      avatar: getUserInitials(u, u),
      institution: '',
      major: '',
      bio: '',
      skills: []
    };
    setUsers(prev => ({ ...prev, [u]: localUser }));

    // Dispatch EmailJS Welcome Email
    sendWelcomeEmail({
      name: u,
      username: u,
      email: em || `${u}@campushub.edu`
    }).catch(err => console.warn('Welcome email dispatch error:', err));

    return { success:true };
  }

  /* Password Reset Handlers */
  async function handleForgotPassword(identifier) {
    const rawId = (identifier || '').trim();
    const id = rawId.toLowerCase();

    // 1. Find local user entry by username, name, or email
    let localKey = null;
    let localUser = null;
    if (users) {
      if (users[rawId]) {
        localKey = rawId;
        localUser = users[rawId];
      } else if (users[id]) {
        localKey = id;
        localUser = users[id];
      } else {
        const found = Object.entries(users).find(([k, v]) => 
          k.toLowerCase() === id || 
          (v.name && v.name.toLowerCase() === id) || 
          (v.email && v.email.toLowerCase() === id) ||
          (v.username && v.username.toLowerCase() === id)
        );
        if (found) {
          localKey = found[0];
          localUser = found[1];
        }
      }
    }

    // 2. Try backend API with raw identifier or matched local username
    try {
      const res = await api.forgotPassword(localKey || rawId);
      if (res && res.success) {
        return { 
          success: true, 
          message: res.message || `Verification code sent to ${res.email || localUser?.email || id}`, 
          username: res.username || localKey || id,
          simulatedCode: res.simulatedCode,
          emailSent: res.emailSent
        };
      }
    } catch (e) {
      console.warn('API forgot-password fallback:', e);
    }

    // 3. If local user exists, auto-sync to backend and send email via Resend
    if (localUser) {
      const userEmail = localUser.email || `${localKey || id}@campushub.edu`;
      try {
        await api.register({
          username: localKey || id,
          password: 'TempPassword123!',
          email: userEmail,
          name: localUser.name || localKey || id
        });
        const retryRes = await api.forgotPassword(localKey || id);
        if (retryRes && retryRes.success) {
          return {
            success: true,
            message: retryRes.message || `Verification code sent to ${userEmail}`,
            username: retryRes.username || localKey || id,
            simulatedCode: retryRes.simulatedCode,
            emailSent: retryRes.emailSent
          };
        }
      } catch (_) {}

      const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
      return { 
        success: true, 
        message: `Verification code sent to ${userEmail}`, 
        username: localKey || id,
        simulatedCode: demoCode 
      };
    }

    return { success: false, message: 'User does not exist. Please check your username or register a new account.' };
  }

  async function handleResetPassword(identifier, newPassword, resetCode) {
    const id = identifier.trim().toLowerCase();
    try {
      const res = await api.resetPassword({ identifier: id, newPassword, resetCode });
      if (res && res.success) {
        const hashed = await hashPassword(newPassword);
        setUsers(prev => ({
          ...prev,
          [id]: { ...(prev[id] || {}), password: hashed }
        }));
        return { success: true, message: res.message || 'Password reset successfully. You can now sign in.' };
      } else if (res && res.message) {
        return { success: false, message: res.message };
      }
    } catch (e) {
      console.warn('API reset-password fallback:', e);
    }
    if (users?.[id]) {
      const hashed = await hashPassword(newPassword);
      setUsers(prev => ({
        ...prev,
        [id]: { ...prev[id], password: hashed }
      }));
      return { success: true, message: 'Password reset successfully. You can now sign in.' };
    }
    return { success: false, message: 'User does not exist.' };
  }

  /* Login & Logout Handlers */
  const handleLogin = useCallback((userSession) => {
    setSession(userSession);
    storageManager.setItem('campushub_session', userSession);
  }, []);

  const handleLogout = useCallback(() => {
    setSession(null);
    storageManager.setItem('campushub_session', null);
    try {
      localStorage.removeItem('campushub_jwt_token');
    } catch (_) {}
    setActiveTab('all');
    setMobileOpen(false);
  }, []);

  /* ── Render Root Experience ── */
  return (
    <>
      <NetworkConnectionLoader />
      <WarpSpeedCanvas isApp={!!session} />
      <VoidBackground isApp={!!session} />

      {/* Share Post Modal Dialog */}
      {sharingPost && (
        <SharePostModal
          post={sharingPost}
          onClose={() => setSharingPost(null)}
          onToast={(msg) => setToast(msg)}
        />
      )}

      {/* Shared Post Direct View Modal - Global overlay */}
      {viewingSharedPost && (
        <ModalPortal>
          <div className="modal-overlay" style={{ zIndex: 99999 }} onClick={() => {
            setViewingSharedPost(null);
            if (window.location.pathname.startsWith('/post/')) {
              try { window.history.pushState({ tab: 'all' }, '', '/'); } catch (_) {}
            }
          }}>
            <div
              className="glass-panel"
              style={{
                maxWidth: '680px',
                width: '95%',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.25rem',
                borderRadius: '16px',
                border: '1px solid var(--border-color)',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.7)',
                animation: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both'
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.2))', color: 'var(--accent-primary)', border: '1px solid rgba(99,102,241,0.35)' }}>
                    ✨ Shared Post
                  </span>
                  {!session && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Viewing on CampusHub
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => {
                    setViewingSharedPost(null);
                    if (window.location.pathname.startsWith('/post/')) {
                      try { window.history.pushState({ tab: 'all' }, '', '/'); } catch (_) {}
                    }
                  }}
                  title="Close"
                  style={{ width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} />
                </button>
              </div>

              <PostCard
                post={viewingSharedPost}
                user={session}
                onLike={handleLike}
                onDelete={(id) => {
                  handleDeletePost(id);
                  setViewingSharedPost(null);
                }}
                onEdit={(p) => {
                  setEditingPost(p);
                  setShowNewPost(true);
                  setViewingSharedPost(null);
                }}
                onToggleComment={id => setOpenComment(p => p===id?null:id)}
                commentOpen={openComment === viewingSharedPost.id}
                commentText={commentText}
                onCommentChange={setCommentText}
                onCommentSubmit={handleCommentSubmit}
                onDeleteComment={handleDeleteComment}
                onShare={handleShare}
                onToggleResolve={handleToggleResolve}
                onClearIssue={(id) => {
                  handleClearIssue(id);
                  setViewingSharedPost(null);
                }}
                isAdmin={isAdmin}
                isAuthenticated={isAuth}
                contributionRequests={contributionRequests || []}
                workspaces={workspaces || []}
                ideas={ideas || []}
                users={users || {}}
                onNavigateToWorkspace={(wsId) => {
                  setViewingSharedPost(null);
                  setActiveWorkspaceId(wsId);
                  navTo('workspaces');
                }}
                onJoinContribution={(p) => {
                  setViewingSharedPost(null);
                  setJoinModalPost(p);
                }}
                onManageRequests={(p) => {
                  setViewingSharedPost(null);
                  setManageRequestsPost(p);
                }}
                onOpenUserProfile={(userKey, author) => {
                  setViewingSharedPost(null);
                  handleOpenUserProfile(userKey, author);
                }}
              />

              {!session && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.2)', textAlign: 'center' }}>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Want to like, comment, or collaborate on this project?
                  </p>
                  <button 
                    className="primary-btn" 
                    style={{ padding: '0.5rem 1.2rem', fontSize: '0.85rem', borderRadius: '8px' }}
                    onClick={() => {
                      setViewingSharedPost(null);
                      if (window.location.pathname.startsWith('/post/')) {
                        try { window.history.pushState({ tab: 'all' }, '', '/'); } catch (_) {}
                      }
                    }}
                  >
                    Log In / Sign Up to CampusHub
                  </button>
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}

      {loading ? (
        <div className="loading-screen">
          <div className="loading-spinner" style={{ zIndex: 10 }} />
          <p style={{ color:'var(--text-secondary)', fontWeight:500, zIndex: 10 }}>Loading CampusHub…</p>
        </div>
      ) : showIntro ? (
        <IntroAnimation onComplete={handleIntroComplete} />
      ) : !session ? (
        <LoginPage
          onLogin={handleLogin}
          onRegister={handleRegister}
          onForgotPassword={handleForgotPassword}
          onResetPassword={handleResetPassword}
          users={users}
          onPlayIntro={handleReplayIntro}
          theme={theme}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
        />
      ) : (
        <div className="app-container">
          {/* Toast */}
          {toast && <Toast message={toast} onDone={() => setToast(null)} />}

        {/* Navbar */}
        <nav className="navbar glass-panel">
          <div className="nav-brand" onClick={() => navTo('all')} style={{ cursor: 'pointer' }}>
            <Code2 size={24} className="brand-icon text-accent" />
            <span className="brand-logo-text">CampusHub</span>
          </div>

          <button className="mobile-menu-btn icon-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>

          <div className={`nav-content${mobileOpen ? ' open' : ''}`}>
            <ul className="nav-links">
              <li><button className={`nav-link${activeTab==='all'?' active':''}`} onClick={() => navTo('all')}>Home</button></li>
              <li><button className={`nav-link${activeTab==='search'?' active':''}`} onClick={() => navTo('search')}>Search</button></li>
              <li><button className={`nav-link${activeTab==='projects'?' active':''}`} onClick={() => navTo('projects')}>Projects</button></li>
              <li><button className={`nav-link${activeTab==='events'?' active':''}`} onClick={() => navTo('events')}>Events</button></li>
              <li><button className={`nav-link${activeTab==='ideas'?' active':''}`} onClick={() => navTo('ideas')}>Ideas &amp; Contributions</button></li>
              <li><button className={`nav-link${activeTab==='workspaces'?' active':''}`} onClick={() => navTo('workspaces')}>Workspace</button></li>
              {(isAdmin||isStudent) && (
                <li><button className={`nav-link${activeTab==='issues'?' active':''}`} onClick={() => navTo('issues')}>Issues</button></li>
              )}
              {isAdmin && <li><button className={`nav-link${activeTab==='admin'?' active':''}`} onClick={() => navTo('admin')}>Admin</button></li>}
              {isAuth && !isAdmin && <li><button className={`nav-link${activeTab==='profile' && (!selectedProfileUser || selectedProfileUser.userKey === session.username)?' active':''}`} onClick={() => handleOpenMyProfile()}>Profile</button></li>}
            </ul>

            <div className="nav-actions">
              {isAuth && (
                <>
                  {/* Global Search Button */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: '0.25rem' }}>
                    <button 
                      className={`icon-btn${activeTab==='search'?' active':''}`} 
                      title="Search Posts & Users (/search)" 
                      onClick={() => navTo('search')} 
                      style={{ 
                        position: 'relative', 
                        background: activeTab === 'search' ? 'rgba(99, 102, 241, 0.2)' : 'transparent', 
                        color: activeTab === 'search' ? 'var(--accent-primary)' : 'var(--text-secondary)', 
                        border: activeTab === 'search' ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent', 
                        transition: 'all 0.2s ease', 
                        width: '38px', 
                        height: '38px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '50%' 
                      }}
                    >
                      <Search size={20}/>
                    </button>
                  </div>
                  
                  {/* Notifications */}
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginRight: '0.5rem' }}>
                    <button 
                      className="icon-btn" 
                      title={`Notifications (${unreadNotificationsCount} unread)`} 
                      onClick={() => setShowNotifications(!showNotifications)} 
                      style={{ 
                        position: 'relative', 
                        background: showNotifications ? 'rgba(99, 102, 241, 0.15)' : 'transparent', 
                        color: showNotifications ? 'var(--accent-primary)' : 'var(--text-secondary)', 
                        border: showNotifications ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent', 
                        transition: 'all 0.2s ease', 
                        width: '38px', 
                        height: '38px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        borderRadius: '50%' 
                      }}
                    >
                      <Bell size={20}/>
                      {unreadNotificationsCount > 0 && (
                        <span style={{ 
                          position: 'absolute', 
                          top: '-2px', 
                          right: '-2px', 
                          background: 'linear-gradient(135deg, #ef4444, #f43f5e)', 
                          color: '#fff',
                          minWidth: '18px', 
                          height: '18px', 
                          padding: '0 4px',
                          borderRadius: '10px', 
                          border: '2px solid var(--bg-glass)',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          lineHeight: 1,
                          boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                        }}>
                          {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                        </span>
                      )}
                    </button>
                  </div>
                </>
              )}
              
              {(isAdmin||isStudent) && (
                <button className="primary-btn pulse-hover" onClick={() => { setShowNewPost(true); setMobileOpen(false); }}>
                  <Plus size={18}/> New Post
                </button>
              )}
              <div className="user-nav-block">
                <div className="post-avatar"
                  style={{ border: isAdmin?'2px solid #a78bfa': isStudent?'2px solid var(--accent-primary)':'2px solid #94a3b8', cursor:'pointer', overflow:'hidden' }}
                  onClick={() => { isAdmin ? navTo('admin') : (isGuest ? null : handleOpenMyProfile()); setMobileOpen(false); }}
                  title={`View ${session.username}'s Profile`}>
                  {renderAvatarContent(session.avatar, session.name, session.username, isAdmin ? 'AD' : isGuest ? 'GU' : 'ST')}
                </div>
                <div 
                  className="user-nav-info" 
                  style={{ cursor: isGuest ? 'default' : 'pointer' }}
                  onClick={() => { if (!isGuest) { isAdmin ? navTo('admin') : handleOpenMyProfile(); setMobileOpen(false); } }}
                  title="View Profile"
                >
                  <span>{session.username}</span>
                  <span className="user-role-badge">{session.role}</span>
                </div>
                <div className="nav-utility-btns">
                  <button className="icon-btn" title="Replay Space Intro" onClick={handleReplayIntro} style={{ color: '#fbbf24' }}>
                    <Sparkles size={18}/>
                  </button>
                  <button className="icon-btn" title="Toggle Theme" onClick={() => setTheme(t => t==='dark'?'light':'dark')}>
                    {theme==='dark' ? <Sun size={18}/> : <Moon size={18}/>}
                  </button>
                  <button className="icon-btn logout-btn" title="Logout" onClick={handleLogout}>
                    <LogOut size={18}/>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </nav>

      {mobileOpen && <div className="mobile-menu-overlay" onClick={() => setMobileOpen(false)} />}

      <main className={`main-content ${['admin', 'profile', 'ideas', 'workspaces', 'search'].includes(activeTab) ? 'full-width' : ''}`}>
        {/* Guest banner */}
        {isGuest && (
          <div className="guest-banner">
            <div>
              <p style={{ fontWeight:700 }}>👋 You are browsing as a Guest</p>
              <p style={{ color:'var(--text-secondary)', fontSize:'0.9rem' }}>Log in to access Projects, Events, Ideas, Issues and more.</p>
            </div>
            <button className="primary-btn" onClick={() => setSession(null)} style={{ whiteSpace:'nowrap' }}>Login / Sign In</button>
          </div>
        )}

        {/* Restricted */}
        {isRestricted ? (
          <section className="feed restricted-view-container">
            <div className="restricted-view">
              <div className="glass-panel" style={{ maxWidth:'480px', background:'var(--bg-secondary)', animation:'scaleIn 0.4s ease both' }}>
                <div style={{ fontSize:'3.5rem', marginBottom:'1rem' }}>🔒</div>
                <h2 style={{ marginBottom:'0.75rem' }}>Login Required</h2>
                <p style={{ color:'var(--text-secondary)', marginBottom:'2rem', lineHeight:1.6 }}>
                  You must be logged in as a <strong>Student</strong> or <strong>Admin</strong> to view this page.
                </p>
                <div style={{ display:'flex', gap:'1rem', justifyContent:'center', flexWrap:'wrap' }}>
                  <button className="primary-btn" onClick={() => setSession(null)}>Login / Sign In</button>
                  <button className="secondary-btn" onClick={() => setActiveTab('all')}>← Back to Home</button>
                </div>
              </div>
            </div>
          </section>

        /* Admin Panel */
        ) : activeTab === 'admin' ? (
          <section className="feed" id="feed">
            {/* Profile & Add admin */}
            <div className="glass-panel admin-settings-panel" style={{ marginBottom:'2rem' }}>
              <h2 style={{ marginBottom:'2rem', display:'flex', alignItems:'center', gap:'0.75rem', borderBottom:'1px solid var(--border-color)', paddingBottom:'1rem' }}>
                <Shield size={28} color="var(--accent-primary)"/> Admin Control Center
              </h2>
              <div className="responsive-grid grid-2">
                <div>
                  <h3 style={{ marginBottom:'1.25rem', fontSize:'1.1rem' }}>Update Your Profile</h3>
                  <form onSubmit={handleAdminProfile}>
                    <div className="form-group"><label className="form-label">Admin Username</label><input type="text" name="username" className="form-control" defaultValue={session.username} required /></div>
                    <div className="form-group"><label className="form-label">Verify Old Password (optional)</label><input type="password" name="oldPassword" className="form-control" placeholder="Only if changing password" /></div>
                    <div className="form-group"><label className="form-label">New Password (optional)</label><input type="password" name="newPassword" className="form-control" placeholder="Leave blank to keep same" minLength={8} /></div>
                    <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
                      <button type="submit" className="primary-btn" style={{ flex:2 }}>Update Profile</button>
                      <button type="button" className="secondary-btn" style={{ flex:1 }} onClick={e=>e.currentTarget.closest('form').reset()}>Clear</button>
                    </div>
                  </form>
                </div>
                <div className="admin-right-panel">
                  <h3 style={{ marginBottom:'1.25rem', fontSize:'1.1rem' }}>Add New Administrator</h3>
                  <form onSubmit={handleAddAdmin} autoComplete="new-password">
                    <div className="form-group"><label className="form-label">Username</label><input type="text" name="username" className="form-control" placeholder="e.g., administrator_2" required autoComplete="off" /></div>
                    <div className="form-group"><label className="form-label">Secure Password</label><input type="password" name="password" className="form-control" placeholder="Complex passphrase" required autoComplete="new-password" minLength={8} /></div>
                    <div style={{ display:'flex', gap:'1rem', marginTop:'1.5rem' }}>
                      <button type="submit" className="primary-btn" style={{ flex:2 }}>Create Admin</button>
                      <button type="button" className="secondary-btn" style={{ flex:1 }} onClick={e=>e.currentTarget.closest('form').reset()}>Clear</button>
                    </div>
                  </form>
                </div>
              </div>
              {/* Add student */}
              <div style={{ borderTop:'1px solid rgba(255,255,255,0.1)', marginTop:'2rem', paddingTop:'2rem' }}>
                <h3 style={{ marginBottom:'1rem', fontSize:'1.1rem' }}>Add New Student Login</h3>
                <form onSubmit={handleAddStudent} autoComplete="off" className="student-add-form">
                  <div className="form-group" style={{ marginBottom:0 }}><input type="text" name="username" className="form-control" placeholder="Student Username" required autoComplete="off" /></div>
                  <div className="form-group" style={{ marginBottom:0 }}><input type="password" name="password" className="form-control" placeholder="Student Password" required autoComplete="new-password" minLength={8} /></div>
                  <button type="submit" className="primary-btn" style={{ background:'var(--success)', boxShadow:'0 4px 14px rgba(16,185,129,0.3)' }}>Add Student</button>
                  <button type="button" className="secondary-btn" onClick={e=>{ const f=e.currentTarget.closest('form'); f.username.value=''; f.password.value=''; }}>Clear</button>
                </form>
              </div>
            </div>

            {/* User management */}
            <div className="glass-panel user-management-card">
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem', flexWrap:'wrap', gap:'1rem' }}>
                <h3 style={{ margin:0, fontSize:'1.25rem', fontWeight:700 }}>Registered Users Management</h3>
                <div className="role-filter-bar">
                  {['all','admin','student','new_user'].map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)}
                      className={`role-filter-btn ${roleFilter === r ? 'active' : ''}`}>
                      {r==='new_user'?'New Users': r+'s'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="admin-users-list" style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                {Object.entries(users||{}).filter(([,v]) => roleFilter==='all'||v.role===roleFilter).map(([u, v]) => (
                  <div key={u} className="admin-user-row">
                    <div className="admin-user-info-group">
                      <div className={`post-avatar admin-user-avatar role-${v.role}`}>
                        {u.slice(0,2).toUpperCase()}
                      </div>
                      <div className="admin-user-text">
                        <span className="admin-username">{u}</span>
                        <div className="admin-user-meta">
                          <span className={`admin-role-badge role-${v.role}`}>{v.role}</span>
                          <span className="meta-dot">•</span>
                          <div className="admin-password-block">
                            <span className="password-masked">
                              {showPwMap[u] ? v.password.slice(0,16)+'...' : '••••••••'}
                            </span>
                            <button className="icon-btn-inline" onClick={() => setShowPwMap(p=>({...p,[u]:!p[u]}))} title={showPwMap[u]?'Hide':'Show'}>
                              {showPwMap[u] ? <EyeOff size={14}/> : <Eye size={14}/>}
                            </button>
                            <span className="hashed-badge">🔒 Hashed</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="admin-user-actions">
                      <button className="secondary-btn admin-edit-btn" onClick={() => { setEditUser({originalUsername:u,...v}); setShowEditUser(true); }}>Edit</button>
                      <button className="icon-btn danger admin-delete-btn" onClick={() => handleDeleteUser(u)} title="Delete User"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

        /* Profile Page */
        ) : activeTab === 'profile' ? (
          (() => {
          const targetUserKey = selectedProfileUser?.userKey || (typeof selectedProfileUser === 'string' ? selectedProfileUser : session.username);
          const targetFallback = selectedProfileUser?.authorFallback || null;
          const isOwnProfile = targetUserKey === session.username;

          const rawUser = users?.[targetUserKey] || (targetFallback?.name && Object.values(users || {}).find(u => u.name === targetFallback.name)) || (session?.username === targetUserKey ? session : null);
          const seedInfo = (targetUserKey === 'admin' || targetUserKey === 'student1' || targetUserKey === 'std1') ? DEFAULT_USER_PROFILES[targetUserKey] : null;

          const profName = isOwnProfile ? (session.name || session.username) : (rawUser?.name || targetFallback?.name || seedInfo?.name || targetUserKey);
          const profUsername = isOwnProfile ? session.username : (rawUser?.username || seedInfo?.username || targetUserKey);
          const profInitials = getUserInitials(profName, profUsername);
          const profAvatar = isOwnProfile ? (avatarPreview || session.avatar || profInitials) : (rawUser?.avatar || targetFallback?.avatar || seedInfo?.avatar || profInitials);
          const profRole = isOwnProfile ? (isAdmin ? 'Administrator' : 'Student Member') : (rawUser?.role === 'admin' ? 'Administrator' : (seedInfo?.role || (rawUser?.role === 'student' ? 'Student Member' : 'Campus Member')));
          
          // Strict rule: if details are not filled, display NA
          const profInstitution = isOwnProfile ? (session.institution && session.institution.trim() !== '' ? session.institution.trim() : 'NA') : (rawUser?.institution && rawUser.institution.trim() !== '' ? rawUser.institution.trim() : (seedInfo?.institution || 'NA'));
          const profMajor = isOwnProfile ? (session.major && session.major.trim() !== '' ? session.major.trim() : 'NA') : (rawUser?.major && rawUser.major.trim() !== '' ? rawUser.major.trim() : (seedInfo?.major || seedInfo?.department || 'NA'));
          const profBio = isOwnProfile ? (session.bio && session.bio.trim() !== '' ? session.bio.trim() : 'NA') : (rawUser?.bio && rawUser.bio.trim() !== '' ? rawUser.bio.trim() : (seedInfo?.bio || 'NA'));
          const profSkills = isOwnProfile ? ((session.skills && Array.isArray(session.skills) && session.skills.length > 0) ? session.skills : []) : ((rawUser?.skills && Array.isArray(rawUser.skills) && rawUser.skills.length > 0) ? rawUser.skills : (seedInfo?.skills || []));

          // Filter posts by target user
          const userPosts = (posts || []).filter(p => {
            if (p.authorId === targetUserKey || p.authorId === profUsername) return true;
            if (p.author?.name && (p.author.name === profName || p.author.name === targetUserKey)) return true;
            if (targetUserKey === 'std1' && (p.authorId === 'std1' || !p.authorId)) return true;
            return false;
          });

          // Filter ideas submitted by target user
          const userIdeas = (ideas || []).filter(i => {
            return i.creatorId === targetUserKey || i.creatorId === profUsername || i.creatorName === profName;
          });

          // Filter workspaces joined
          const userWorkspaces = (workspaces || []).filter(w => {
            return (w.members || []).some(m => m.userId === targetUserKey || m.userId === profUsername || m.name === profName || m.username === targetUserKey);
          });

          // Filter tasks completed
          const userTasksCompleted = (tasks || []).filter(t => {
            return (t.assigneeId === targetUserKey || t.assigneeId === profUsername) && t.status === 'DONE';
          });

          // Filter contributions
          const userContributions = (contributionRequests || []).filter(r => {
            return (r.applicantId === targetUserKey || r.applicantId === profUsername || r.applicantName === profName) && r.status === 'ACCEPTED';
          });

          return (
            <section className="feed" id="feed" style={{ display:'block' }}>
              <div className="glass-panel admin-settings-panel" style={{ maxWidth:'880px', margin:'0 auto', animation:'slideUp 0.4s ease both' }}>
                
                {/* Back to Feed Button if viewing another user's profile */}
                {!isOwnProfile && (
                  <button 
                    type="button" 
                    className="secondary-btn" 
                    style={{ display:'inline-flex', alignItems:'center', gap:'0.4rem', marginBottom:'1.5rem', padding:'0.45rem 1rem' }}
                    onClick={() => navTo('all')}
                  >
                    <ArrowLeft size={16} /> Back to Feed
                  </button>
                )}

                {/* Profile Header Hero Card */}
                <div className="user-profile-banner" style={{ borderRadius: '16px 16px 0 0', height: '130px' }} />
                
                <div className="user-profile-main-header" style={{ padding: '0 1.5rem', marginTop: '-50px' }}>
                  <div className="user-profile-avatar-wrapper">
                    <div className="user-profile-avatar" style={{ width: '100px', height: '100px', fontSize: '2.2rem' }}>
                      {typeof profAvatar === 'string' && (profAvatar.startsWith('http') || profAvatar.startsWith('data:image') || profAvatar.startsWith('blob:')) ? (
                        <img src={profAvatar} alt={profName} className="user-profile-avatar-img" />
                      ) : (
                        <span className="user-profile-avatar-initials">{profInitials}</span>
                      )}
                    </div>
                    <span className="user-profile-status-online" title="Active"></span>
                  </div>

                  <div className="user-profile-identity-info">
                    <div className="user-profile-name-row">
                      <h2 className="user-profile-name" style={{ fontSize: '1.5rem' }}>{profName}</h2>
                      <span className="user-profile-role-pill">
                        {profRole === 'Administrator' && <Shield size={13} style={{ marginRight: '3px' }} />}
                        {profRole}
                      </span>
                      {isOwnProfile && (
                        <span className="user-profile-you-badge">Your Profile</span>
                      )}
                    </div>
                    <div className="user-profile-handle">@{profUsername}</div>
                    
                    <div className="user-profile-meta-chips">
                      <div className="user-profile-meta-chip">
                        <Building size={13} />
                        <span>{profInstitution}</span>
                      </div>
                      <div className="user-profile-meta-chip">
                        <GraduationCap size={13} />
                        <span>{profMajor}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bio Box */}
                <div className="user-profile-bio-box" style={{ padding: '1.25rem 1.5rem 0.75rem 1.5rem' }}>
                  <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>About / Bio</h4>
                  <p className="user-profile-bio-text" style={{ fontSize: '0.98rem' }}>{profBio}</p>
                </div>

                {/* Skills Chips */}
                <div style={{ padding: '0 1.5rem 1.25rem 1.5rem' }}>
                  {profSkills && profSkills.length > 0 ? (
                    <div className="about-skills-chips">
                      {profSkills.map((s, idx) => (
                        <span key={idx} className="skill-pill">
                          <Tag size={12} /> {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      Skills: <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>NA</span>
                    </div>
                  )}
                </div>

                {/* High-Level Metric Stats Grid */}
                <div className="responsive-grid grid-4" style={{ gap:'0.75rem', padding:'0 1.5rem', marginBottom:'1.75rem' }}>
                  <div className="glass-panel" style={{ padding:'1rem', textAlign:'center', background:'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#818cf8' }}>{userPosts.length}</div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:700 }}>Posts Published</span>
                  </div>

                  <div className="glass-panel" style={{ padding:'1rem', textAlign:'center', background:'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#fbbf24' }}>{userIdeas.length}</div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:700 }}>Ideas Submitted</span>
                  </div>

                  <div className="glass-panel" style={{ padding:'1rem', textAlign:'center', background:'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#34d399' }}>{userWorkspaces.length}</div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:700 }}>Workspaces Joined</span>
                  </div>

                  <div className="glass-panel" style={{ padding:'1rem', textAlign:'center', background:'rgba(255,255,255,0.02)' }}>
                    <div style={{ fontSize:'1.6rem', fontWeight:800, color:'#c084fc' }}>{userContributions.length + userTasksCompleted.length}</div>
                    <span style={{ fontSize:'0.75rem', color:'var(--text-secondary)', textTransform:'uppercase', fontWeight:700 }}>Contributions</span>
                  </div>
                </div>

                {/* If own profile: Show Edit Profile Settings Form */}
                {isOwnProfile && (
                  <div style={{ marginTop:'1.5rem', paddingTop:'2rem', borderTop:'1px solid var(--border-color)', padding:'1.5rem' }}>
                    <h3 style={{ marginBottom:'1.5rem', display:'flex', alignItems:'center', gap:'0.6rem' }}>
                      <Edit3 size={20} color="var(--accent-primary)"/> Edit Your Profile Details
                    </h3>
                    <form onSubmit={handleStudentProfile}>
                      <div className="responsive-grid profile-settings-grid">
                        <div className="profile-avatar-container">
                          <div className="post-avatar" style={{ width:'110px', height:'110px', fontSize:'2.2rem', border:'3px solid var(--accent-primary)', marginBottom:'1rem', overflow:'hidden', transition:'transform 0.3s' }}
                            onMouseEnter={e=>e.currentTarget.style.transform='scale(1.05)'}
                            onMouseLeave={e=>e.currentTarget.style.transform=''}>
                            {renderAvatarContent(avatarPreview || session.avatar, session.name, session.username, session.username.slice(0, 2).toUpperCase())}
                          </div>
                          <div className="file-upload-wrapper" style={{ marginTop:'0.75rem' }}>
                            <label className="file-upload-label" style={{ padding:'0.5rem 0.9rem', fontSize:'0.82rem' }}>
                              <Plus size={15}/> Change Photo
                              <input type="file" name="avatar" accept="image/*" className="file-upload-input"
                                onInput={e => { 
                                  if (e.target.files[0]) {
                                    e.target.parentElement.dataset.file = e.target.files[0].name;
                                    setAvatarPreview(URL.createObjectURL(e.target.files[0]));
                                  } 
                                }} />
                            </label>
                          </div>
                        </div>
                        <div>
                          <div className="form-group" style={{ marginBottom:'1.25rem' }}><label className="form-label">Username</label><input type="text" name="username" className="form-control" defaultValue={session.username} required /></div>
                          <div className="form-group" style={{ marginBottom:'1.25rem' }}><label className="form-label">Institution / University</label><input type="text" name="institution" className="form-control" defaultValue={session.institution || ''} placeholder="e.g. Stanford University" /></div>
                          <div className="form-group" style={{ marginBottom:'1.25rem' }}><label className="form-label">Degree / Major</label><input type="text" name="major" className="form-control" defaultValue={session.major || ''} placeholder="e.g. B.S. Computer Science" /></div>
                          <div className="form-group" style={{ marginBottom:'1.25rem' }}><label className="form-label">Bio / About</label><textarea name="bio" className="form-control" defaultValue={session.bio || ''} placeholder="Tell us about yourself..." style={{ minHeight: '80px', resize: 'vertical' }}></textarea></div>
                          <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                            <label className="form-label">Skills &amp; Expertise (comma-separated)</label>
                            <input 
                              type="text" 
                              name="skills" 
                              className="form-control" 
                              defaultValue={Array.isArray(session.skills) ? session.skills.join(', ') : (session.skills || '')} 
                              placeholder="e.g. React, Python, UI/UX Design, Machine Learning" 
                            />
                          </div>
                          <hr style={{ borderColor: 'var(--divider-color)', margin: '1.5rem 0' }} />
                          <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                            <label className="form-label">Current Password (optional - only needed if changing password)</label>
                            <input type="password" name="oldPassword" className="form-control" placeholder="Leave blank to keep current password" />
                          </div>
                          <div className="form-group" style={{ marginBottom:'1.25rem' }}>
                            <label className="form-label">New Password (optional)</label>
                            <input type="password" name="newPassword" className="form-control" placeholder="Leave blank to keep current password" minLength={8} />
                          </div>
                          <div style={{ display:'flex', gap:'1rem', marginTop:'1.75rem' }}>
                            <button type="submit" className="primary-btn pulse-hover" style={{ flex:2 }}>Save Profile Details</button>
                            <button type="button" className="secondary-btn" onClick={() => navTo('all')} style={{ flex:1 }}>Discard</button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Published Posts by This User */}
                <div style={{ marginTop:'2rem', paddingTop:'2rem', borderTop:'1px solid var(--border-color)', padding:'1.5rem' }}>
                  <h3 style={{ marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <FileText size={20} color="var(--accent-primary)"/> {isOwnProfile ? 'Your Posts' : `${profName}'s Posts`} ({userPosts.length})
                  </h3>
                  <div style={{ display:'grid', gap:'1rem' }}>
                    {userPosts.length > 0 ? (
                      userPosts.map(p => (
                        <div key={p.id} className="post-card glass-panel" style={{ padding:'1.25rem', animation:'slideIn 0.3s ease both' }}>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.5rem', flexWrap:'wrap', gap:'0.5rem' }}>
                            <span className="tag" style={{ margin: 0 }}>{p.type}</span>
                            <span style={{ color:'var(--text-secondary)', fontSize:'0.82rem' }}>{p.date}</span>
                          </div>
                          <h4 style={{ margin:'0 0 0.5rem 0', fontSize:'1.05rem', fontWeight:700 }}>{p.title}</h4>
                          <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', lineHeight:1.5, margin:'0 0 0.75rem 0' }}>
                            {p.description ? p.description.slice(0, 180) + (p.description.length > 180 ? '...' : '') : ''}
                          </p>
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem', paddingTop:'0.5rem', borderTop:'1px solid rgba(255,255,255,0.06)' }}>
                            <div style={{ display:'flex', gap:'1rem', fontSize:'0.82rem', color:'var(--text-secondary)' }}>
                              <span>❤️ {p.likes || 0} Likes</span>
                              <span>💬 {(p.comments || []).length} Comments</span>
                            </div>
                            <div style={{ display:'flex', gap:'0.5rem' }}>
                              <button 
                                className="secondary-btn" 
                                style={{ padding:'0.3rem 0.8rem', fontSize:'0.8rem' }}
                                onClick={() => {
                                  setActiveTab('all');
                                  setTimeout(() => {
                                    const el = document.getElementById(`post-${p.id}`);
                                    if (el) el.scrollIntoView({ behavior:'smooth', block:'center' });
                                  }, 100);
                                }}
                              >
                                View in Feed →
                              </button>
                              {(isOwnProfile || isAdmin) && (
                                <button className="icon-btn" style={{ color:'var(--danger)', padding:'0.3rem' }} onClick={() => handleDeletePost(p.id)} title="Delete">
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign:'center', padding:'2rem', background:'rgba(255,255,255,0.02)', borderRadius:'12px', border:'1px dashed var(--border-color)' }}>
                        <p style={{ color:'var(--text-secondary)', margin:0 }}>No posts published yet.</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Contributions & Workspaces Section */}
                <div style={{ marginTop:'2rem', paddingTop:'2rem', borderTop:'1px solid var(--border-color)', padding:'1.5rem' }}>
                  <h3 style={{ marginBottom:'1.25rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
                    <Sparkles size={20} color="var(--accent-primary)"/> Projects &amp; Contributions
                  </h3>

                  {/* Active Project Workspaces Cards */}
                  <h4 style={{ fontSize:'0.9rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em', margin:'0 0 0.75rem 0' }}>
                    Active Project Workspaces ({userWorkspaces.length})
                  </h4>
                  <div style={{ display:'grid', gap:'0.75rem', marginBottom:'1.75rem' }}>
                    {userWorkspaces.length > 0 ? (
                      userWorkspaces.map(ws => (
                        <div key={ws.id} className="glass-panel" style={{ padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.02)', borderRadius:'10px' }}>
                          <div>
                            <h4 style={{ margin:0, fontSize:'0.95rem', fontWeight:600 }}>{ws.name}</h4>
                            <span style={{ fontSize:'0.78rem', color:'var(--text-secondary)' }}>
                              {(ws.members||[]).length} Members • {ws.progress||0}% Complete
                            </span>
                          </div>
                          <button
                            className="secondary-btn"
                            style={{ padding:'0.4rem 1rem', fontSize:'0.82rem' }}
                            onClick={() => { setActiveWorkspaceId(ws.id); navTo('workspaces'); }}
                          >
                            Open Workspace →
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign:'center', padding:'1.5rem', background:'rgba(255,255,255,0.02)', borderRadius:'10px', border:'1px dashed var(--border-color)' }}>
                        <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', margin:0 }}>Not active in any project workspace yet.</p>
                      </div>
                    )}
                  </div>

                  {/* Ideas Created */}
                  <h4 style={{ fontSize:'0.9rem', color:'var(--text-secondary)', textTransform:'uppercase', letterSpacing:'0.04em', margin:'0 0 0.75rem 0' }}>
                    Submitted Ideas ({userIdeas.length})
                  </h4>
                  <div style={{ display:'grid', gap:'0.75rem' }}>
                    {userIdeas.length > 0 ? (
                      userIdeas.map(idea => (
                        <div key={idea.id} className="glass-panel" style={{ padding:'1rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(255,255,255,0.02)', borderRadius:'10px' }}>
                          <div>
                            <span className="status-pill status-open" style={{ marginRight:'0.5rem', fontSize:'0.72rem' }}>{idea.status || 'IDEA'}</span>
                            <span style={{ fontWeight:600, fontSize:'0.95rem' }}>{idea.title}</span>
                          </div>
                          <button
                            className="text-btn"
                            style={{ color:'var(--accent-primary)', fontSize:'0.82rem', fontWeight:600 }}
                            onClick={() => navTo('ideas')}
                          >
                            View in Ideas →
                          </button>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign:'center', padding:'1.5rem', background:'rgba(255,255,255,0.02)', borderRadius:'10px', border:'1px dashed var(--border-color)' }}>
                        <p style={{ color:'var(--text-secondary)', fontSize:'0.88rem', margin:0 }}>No project ideas submitted yet.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </section>
          );
        })()
        /* Ideas & Contributions Page */
        ) : activeTab === 'ideas' ? (
          <section className="feed" id="feed" style={{ display:'block' }}>
            <IdeasPage
              ideas={ideas || []}
              workspaces={workspaces || []}
              contributionRequests={contributionRequests || []}
              currentUser={session}
              onAddIdea={handleAddIdea}
              onUpdateIdea={handleUpdateIdea}
              onDeleteIdea={handleDeleteIdea}
              onToggleSupport={handleToggleSupport}
              onToggleFollow={handleToggleFollow}
              onSubmitContributionRequest={handleSubmitContributionRequest}
              onAcceptContributionRequest={handleAcceptContributionRequest}
              onRejectContributionRequest={handleRejectContributionRequest}
              onNavigateToWorkspace={(wsId) => {
                setActiveWorkspaceId(wsId);
                navTo('workspaces');
              }}
            />
          </section>

        /* Collaboration Workspace Page */
        ) : activeTab === 'workspaces' ? (
          <section className="feed" id="feed" style={{ display:'block' }}>
            <WorkspacesPage
              workspaces={workspaces || []}
              ideas={ideas || []}
              tasks={tasks || []}
              milestones={milestones || []}
              discussions={discussions || []}
              files={files || []}
              activities={activities || []}
              chatMessages={chatMessages || []}
              currentUser={session}
              activeWorkspaceId={activeWorkspaceId}
              onSelectWorkspace={(wsId) => setActiveWorkspaceId(wsId)}
              onNavigateToIdeas={() => navTo('ideas')}
              onLeaveWorkspace={handleLeaveWorkspace}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onAddMilestone={handleAddMilestone}
              onUpdateMilestone={handleUpdateMilestone}
              onDeleteMilestone={handleDeleteMilestone}
              onAddDiscussion={handleAddDiscussion}
              onUpdateDiscussion={handleUpdateDiscussion}
              onAddFile={handleAddFile}
              onDeleteFile={handleDeleteFile}
              onUpdateMemberRole={handleUpdateMemberRole}
              onSendMessage={handleSendChatMessage}
              onDeleteMessage={handleDeleteChatMessage}
              onClearAllMessages={handleClearAllChatMessages}
              onReactMessage={handleReactChatMessage}
            />
          </section>

        /* Search Page (/search) */
        ) : activeTab === 'search' ? (
          <section className="feed" id="feed" style={{ display: 'block' }}>
            <SearchPage
              initialQuery={searchQuery}
              onQueryChange={(q) => {
                setSearchQuery(q);
                const url = q ? `/search?q=${encodeURIComponent(q)}` : '/search';
                if (window.location.pathname + window.location.search !== url) {
                  try { window.history.replaceState({ tab: 'search', query: q }, '', url); } catch (_) {}
                }
              }}
              currentUser={session}
              isAdmin={isAdmin}
              isAuthenticated={isAuth}
              users={users || {}}
              localPosts={posts || []}
              onOpenUserProfile={(userKey, author) => handleOpenUserProfile(userKey, author)}
              renderPostCard={(post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  user={session}
                  onLike={handleLike}
                  onDelete={handleDeletePost}
                  onEdit={(p) => { setEditingPost(p); setShowNewPost(true); }}
                  onToggleComment={id => setOpenComment(p => p===id?null:id)}
                  commentOpen={openComment === post.id}
                  commentText={commentText}
                  onCommentChange={setCommentText}
                  onCommentSubmit={handleCommentSubmit}
                  onDeleteComment={handleDeleteComment}
                  onShare={handleShare}
                  onToggleResolve={handleToggleResolve}
                  onClearIssue={handleClearIssue}
                  isAdmin={isAdmin}
                  isAuthenticated={isAuth}
                  contributionRequests={contributionRequests || []}
                  workspaces={workspaces || []}
                  ideas={ideas || []}
                  users={users || {}}
                  onNavigateToWorkspace={(wsId) => {
                    setActiveWorkspaceId(wsId);
                    navTo('workspaces');
                  }}
                  onJoinContribution={(p) => setJoinModalPost(p)}
                  onManageRequests={(p) => setManageRequestsPost(p)}
                  onOpenUserProfile={(userKey, author) => handleOpenUserProfile(userKey, author)}
                />
              )}
            />
          </section>

        /* Feed */
        ) : (
          <section className={`feed${activeTab !== 'admin' && activeTab !== 'profile' ? ' stagger-in' : ''}`} id="feed">
            {/* Feed Top Prompt Bar */}
            {isAuth && (
              <div className="feed-create-bar glass-panel" onClick={() => { setEditingPost(null); setShowNewPost(true); }}>
                <div className="feed-create-avatar">
                  {renderAvatarContent(session.avatar, session.name, session.username, session.username.slice(0, 2).toUpperCase())}
                </div>
                <div className="feed-create-input-mock">
                  What's on your mind, {session.username}? Share an update, event or idea...
                </div>
                <div className="feed-create-actions">
                  <button type="button" className="feed-create-action-btn" title="Create Project" onClick={(e) => { e.stopPropagation(); setEditingPost(null); setPostType('project'); setShowNewPost(true); }}>
                    <Code2 size={16} /> <span>Project</span>
                  </button>
                  <button type="button" className="feed-create-action-btn" title="Create Event" onClick={(e) => { e.stopPropagation(); setEditingPost(null); setPostType('event'); setShowNewPost(true); }}>
                    <Calendar size={16} /> <span>Event</span>
                  </button>
                  <button type="button" className="feed-create-action-btn" title="Create Idea" onClick={(e) => { e.stopPropagation(); setEditingPost(null); setPostType('idea'); setShowNewPost(true); }}>
                    <Lightbulb size={16} /> <span>Idea</span>
                  </button>
                </div>
              </div>
            )}

            {/* Issue report panel */}
            {activeTab === 'issues' && (
              <div className="glass-panel issue-report-panel">
                <h3><Flag size={20} color="var(--danger)"/> Report a New Issue</h3>
                <form style={{ marginTop:'1.25rem' }} onSubmit={e => {
                  e.preventDefault();
                  const fd = new FormData(e.target);
                  const newIssue = { id:Date.now(), type:'issue', title:fd.get('title'), description:fd.get('description'), priority:fd.get('priority'), tags:fd.get('tags').split(',').map(t=>t.trim()).filter(Boolean), author:{name:session.username, avatar:session.username.slice(0,2).toUpperCase()}, authorId:session.username, date:'Just now', likes:0, likedBy:[], comments:[], resolved:false };
                  setPosts(prev => [newIssue, ...prev]);
                  e.target.reset(); setToast('✓ Issue flagged and submitted successfully!');
                }}>
                  <div className="form-group"><label className="form-label">Issue Title *</label><input type="text" name="title" className="form-control" placeholder="e.g., WiFi down in Library" required /></div>
                  <div className="form-group"><label className="form-label">Description *</label><textarea name="description" className="form-control" placeholder="Describe the issue in detail…" required /></div>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Priority</label>
                      <select name="priority" className="form-control" defaultValue="Medium">
                        {['Low','Medium','High','Critical'].map(p=><option key={p} value={p}>{p} Priority</option>)}
                      </select>
                    </div>
                    <div className="form-group"><label className="form-label">Tags</label><input type="text" name="tags" className="form-control" placeholder="Network, Urgent…" /></div>
                  </div>
                  <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'1rem' }}>
                    <button type="submit" className="primary-btn" style={{ background:'var(--danger)', boxShadow:'0 4px 14px rgba(239,68,68,0.3)' }}>Submit Issue</button>
                  </div>
                </form>
              </div>
            )}

            {/* Events add button */}
            {activeTab === 'events' && (isAdmin||isStudent) && (
              <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'1rem', borderBottom:'1px solid var(--border-color)', paddingBottom:'1rem' }}>
                <button className="primary-btn" onClick={() => { setEditingPost(null); setPostType('event'); setShowNewPost(true); }}>
                  <Plus size={18}/> Add Event
                </button>
              </div>
            )}

            {/* Posts */}
            {filteredPosts.map((post, idx) =>
              activeTab === 'events' && post.type === 'event' ? (
                <Reveal key={post.id} delay={idx*50}>
                  <div className="post-card glass-panel feed-event-card" onClick={() => setSelectedEvent(post)}>
                    <img src={post.image||(post.media && post.media[0]?.url)||'https://via.placeholder.com/150'} alt={post.title} className="feed-event-card-img" loading="lazy" />
                    <div className="feed-event-card-body">
                      <h2>{post.title}</h2>
                      <p>{post.organization||post.author?.name||post.authorId}</p>
                      <span className="feed-event-card-date">📅 {post.eventDetails?.eventDate || post.eventDate || 'Upcoming'}</span>
                    </div>
                  </div>
                </Reveal>
              ) : (
                <Reveal key={post.id} delay={idx*50}>
                  <PostCard
                    post={post} user={session}
                    onLike={handleLike}
                    onDelete={handleDeletePost}
                    onEdit={(p) => { setEditingPost(p); setShowNewPost(true); }}
                    onToggleComment={id => setOpenComment(p => p===id?null:id)}
                    commentOpen={openComment === post.id}
                    commentText={commentText}
                    onCommentChange={setCommentText}
                    onCommentSubmit={handleCommentSubmit}
                    onDeleteComment={handleDeleteComment}
                    onShare={handleShare}
                    onToggleResolve={handleToggleResolve}
                    onClearIssue={handleClearIssue}
                    isAdmin={isAdmin}
                    isAuthenticated={isAuth}
                    contributionRequests={contributionRequests || []}
                    workspaces={workspaces || []}
                    ideas={ideas || []}
                    users={users || {}}
                    onNavigateToWorkspace={(wsId) => {
                      setActiveWorkspaceId(wsId);
                      navTo('workspaces');
                    }}
                    onJoinContribution={(p) => setJoinModalPost(p)}
                    onManageRequests={(p) => setManageRequestsPost(p)}
                    onOpenUserProfile={(userKey, author) => handleOpenUserProfile(userKey, author)}
                  />
                </Reveal>
              )
            )}

            {filteredPosts.length === 0 && (
              <div className="glass-panel" style={{ padding:'3rem', textAlign:'center', opacity:0.7, animation:'scaleIn 0.4s ease both' }}>
                <h2>No posts here yet.</h2>
                <p>Be the first to share something!</p>
              </div>
            )}
          </section>
        )}

        {/* Sidebar only on feed views */}
        {activeTab !== 'admin' && activeTab !== 'profile' && activeTab !== 'ideas' && activeTab !== 'workspaces' && activeTab !== 'search' && (
          <aside className="side-panel">
            <div className="side-widget glass-panel">
              <h3>Trending Projects</h3>
              <div className="trending-list">
                {trending.map(p => (
                  <div key={p.id} className="trending-item">
                    <div className="trend-title">{p.title}</div>
                    <div className="trend-meta">{p.department||'General'} • {p.likes||0} Likes</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="side-widget glass-panel">
              <h3>Latest Events</h3>
              <div className="trending-list">
                {latestEvts.map(p => (
                  <div key={p.id} className="trending-item" onClick={() => { setSelectedEvent(p); setActiveTab('events'); }}>
                    <div className="trend-title">{p.title}</div>
                    <div className="trend-meta">{p.eventDate||p.date}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="side-widget glass-panel">
              <h3>Popular Ideas</h3>
              <div className="trending-list">
                {(ideas || SEED_IDEAS).slice(0, 3).map(p => (
                  <div key={p.id} className="trending-item" onClick={() => navTo('ideas')}>
                    <div className="trend-title">{p.title}</div>
                    <div className="trend-meta">{p.category || 'Technology'} • {p.supportCount || (p.supportedBy||[]).length || 0} Supports</div>
                  </div>
                ))}
              </div>
            </div>

            {isAuth && (
              <div className="glass-panel innovative-idea-cta" style={{ padding:'1.5rem', animation:'scaleIn 0.5s ease both' }}>
                <h3 className="innovative-idea-title">Got an Innovative Idea?</h3>
                <p className="innovative-idea-desc">Turn your idea into a campus project with real team collaboration!</p>
                <button className="primary-btn innovative-idea-btn" onClick={() => navTo('ideas')}>
                  Explore &amp; Submit Idea 💡
                </button>
              </div>
            )}
          </aside>
        )}
    </main>

      {/* Global User Search Modal */}
      {showSearchModal && (
        <ModalPortal>
          <div className="modal-overlay" onClick={() => { setShowSearchModal(false); setSearchQuery(''); }}>
            <div className="modal-content glass-panel" style={{ maxWidth: '520px', width: '92%', padding: '1.25rem', background: 'var(--bg-secondary)', transform: 'translateY(-6vh)', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '0.85rem', gap: '0.5rem' }}>
                <Search size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Search posts, users, topics..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') {
                      setShowSearchModal(false);
                      setSearchQuery('');
                    } else if (e.key === 'Enter') {
                      const q = searchQuery.trim();
                      setShowSearchModal(false);
                      navTo('search', q);
                    }
                  }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', outline: 'none', width: '100%', fontSize: '1rem', fontWeight: 500 }} 
                />
                {searchQuery && (
                  <button type="button" className="icon-btn" onClick={() => setSearchQuery('')} title="Clear search" style={{ padding: '4px', flexShrink: 0 }}>
                    <X size={16} />
                  </button>
                )}
                <button type="button" className="icon-btn" onClick={() => { setShowSearchModal(false); setSearchQuery(''); }} title="Close modal" style={{ padding: '4px', flexShrink: 0 }}>
                  <X size={18} />
                </button>
              </div>
              
              <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '2px' }}>
                {searchQuery.trim() ? (
                  (() => {
                    const q = searchQuery.trim().toLowerCase();
                    const filtered = Object.entries(users)
                      .map(([username, u]) => ({ ...u, username }))
                      .filter(u => 
                        u.username?.toLowerCase().includes(q) || 
                        u.name?.toLowerCase().includes(q) || 
                        u.email?.toLowerCase().includes(q) || 
                        u.major?.toLowerCase().includes(q) ||
                        u.role?.toLowerCase().includes(q) ||
                        (Array.isArray(u.skills) && u.skills.some(s => s.toLowerCase().includes(q)))
                      );

                    if (filtered.length === 0) {
                      return (
                        <div style={{ padding: '2.5rem 1rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                          <Search size={32} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
                          <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>No users found</div>
                          <div style={{ fontSize: '0.82rem', marginTop: '0.25rem' }}>No results matching "{searchQuery}". Try searching by username, name, or major.</div>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem' }}>
                          Matching Users ({filtered.length})
                        </div>
                        {filtered.map(u => (
                          <div 
                            key={u.username} 
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '0.85rem', 
                              padding: '0.65rem 0.85rem', 
                              borderRadius: '10px', 
                              cursor: 'pointer',
                              background: 'rgba(255, 255, 255, 0.03)',
                              border: '1px solid rgba(255, 255, 255, 0.06)',
                              transition: 'all 0.15s ease'
                            }} 
                            className="hover-bg" 
                            onClick={() => { 
                              setShowSearchModal(false); 
                              setSearchQuery(''); 
                              handleOpenUserProfile(u.username, { name: u.name || u.username, avatar: u.avatar });
                            }}
                          >
                            <div className="post-avatar" style={{ width: '38px', height: '38px', fontSize: '0.9rem', flexShrink: 0, border: '1.5px solid var(--accent-primary)' }}>
                              {renderAvatarContent(u.avatar, u.name, u.username, (u.name || u.username).slice(0, 2).toUpperCase())}
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {u.name || u.username}
                                </span>
                                <span style={{ fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                  @{u.username}
                                </span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.15rem', fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                                <span>{u.major || 'Student'}</span>
                                <span>•</span>
                                <span style={{ textTransform: 'capitalize', background: 'rgba(99, 102, 241, 0.15)', color: '#a5b4fc', padding: '1px 6px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 600 }}>
                                  {u.role || 'Member'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.25rem 0' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0.25rem 0.5rem' }}>
                      Suggested Users & Innovators
                    </div>
                    {Object.entries(users).slice(0, 6).map(([username, u]) => (
                      <div 
                        key={username} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          gap: '0.85rem', 
                          padding: '0.55rem 0.85rem', 
                          borderRadius: '10px', 
                          cursor: 'pointer',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid rgba(255, 255, 255, 0.04)',
                          transition: 'all 0.15s ease'
                        }} 
                        className="hover-bg" 
                        onClick={() => { 
                          setShowSearchModal(false); 
                          setSearchQuery(''); 
                          handleOpenUserProfile(username, { name: u.name || username, avatar: u.avatar });
                        }}
                      >
                        <div className="post-avatar" style={{ width: '34px', height: '34px', fontSize: '0.85rem', flexShrink: 0, border: '1.5px solid rgba(99, 102, 241, 0.4)' }}>
                          {renderAvatarContent(u.avatar, u.name, username, (u.name || username).slice(0, 2).toUpperCase())}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {u.name || username}
                            </span>
                            <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                              @{username}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                            {u.major || 'CampusHub Member'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}
      {/* Global Dynamic Notifications Modal */}
      {showNotifications && (
        <ModalPortal>
          <div className="modal-overlay" style={{ background: 'transparent', zIndex: 99999 }} onClick={(e) => { if(e.target === e.currentTarget) setShowNotifications(false); }}>
            <div className="glass-panel" style={{ 
              position: 'absolute', 
              top: '70px', 
              right: 'max(20px, calc(50% - 190px))', 
              width: 'calc(100% - 40px)', 
              maxWidth: '380px', 
              borderRadius: '16px', 
              padding: '1.25rem', 
              boxShadow: '0 20px 60px rgba(0,0,0,0.85)',
              border: '1px solid var(--border-color)',
              animation: 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(20px)'
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Bell size={18} color="var(--accent-primary)" />
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Notifications</h4>
                  {unreadNotificationsCount > 0 && (
                    <span style={{ fontSize: '0.7rem', padding: '0.15rem 0.45rem', borderRadius: '10px', background: 'var(--accent-primary)', color: '#fff', fontWeight: 700 }}>
                      {unreadNotificationsCount} new
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {unreadNotificationsCount > 0 && (
                    <button 
                      type="button"
                      className="icon-btn" 
                      style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', padding: '0.2rem 0.5rem', height: 'auto', width: 'auto', borderRadius: '6px' }} 
                      onClick={handleMarkAllNotificationsRead}
                      title="Mark all as read"
                    >
                      Mark all read
                    </button>
                  )}
                  {userNotifications.length > 0 && (
                    <button 
                      type="button"
                      className="icon-btn" 
                      style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '0.2rem 0.4rem', height: 'auto', width: 'auto', borderRadius: '6px' }} 
                      onClick={handleClearAllNotifications}
                      title="Clear all notifications"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Filter Tabs */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: notificationFilter === 'all' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)',
                    background: notificationFilter === 'all' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                    color: notificationFilter === 'all' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setNotificationFilter('all')}
                >
                  All ({userNotifications.length})
                </button>
                <button
                  type="button"
                  style={{
                    flex: 1,
                    padding: '0.35rem 0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: notificationFilter === 'unread' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.08)',
                    background: notificationFilter === 'unread' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.02)',
                    color: notificationFilter === 'unread' ? 'var(--accent-primary)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => setNotificationFilter('unread')}
                >
                  Unread ({unreadNotificationsCount})
                </button>
              </div>

              {/* Notification Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.2rem' }}>
                {(() => {
                  const items = notificationFilter === 'unread' ? userNotifications.filter(n => !n.isRead) : userNotifications;
                  if (items.length === 0) {
                    return (
                      <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
                        <Bell size={28} color="var(--text-muted)" style={{ margin: '0 auto 0.5rem auto', opacity: 0.6 }} />
                        <div>{notificationFilter === 'unread' ? 'No unread notifications' : 'No notifications yet'}</div>
                        <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>
                          Team updates and messages will appear here.
                        </div>
                      </div>
                    );
                  }

                  return items.map(n => {
                    const isUnread = !n.isRead;
                    return (
                      <div
                        key={n.id}
                        style={{
                          padding: '0.75rem 0.85rem',
                          background: isUnread ? 'rgba(99, 102, 241, 0.14)' : 'rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          border: isUnread ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255,255,255,0.05)',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.65rem',
                          position: 'relative'
                        }}
                        className="hover-bg"
                        onClick={() => handleNotificationClick(n)}
                      >
                        {/* Notification Icon */}
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isUnread ? 'rgba(99, 102, 241, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          marginTop: '0.1rem'
                        }}>
                          {n.type === 'chat' ? <MessageCircle size={16} color="#818cf8" /> :
                           n.type === 'contribution_request' ? <UserPlus size={16} color="#f59e0b" /> :
                           n.type === 'contribution_status' ? <Trophy size={16} color="#10b981" /> :
                           n.type === 'post_like' ? <Heart size={16} color="#f43f5e" /> :
                           n.type === 'post_comment' ? <MessageCircle size={16} color="#06b6d4" /> :
                           n.type === 'task_assignment' ? <CircleCheckBig size={16} color="#3b82f6" /> :
                           n.type === 'workspace' ? <Users size={16} color="#a855f7" /> :
                           <Bell size={16} color="#6366f1" />}
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.4rem', marginBottom: '0.15rem' }}>
                            <strong style={{ 
                              color: isUnread ? 'var(--accent-primary)' : 'var(--text-primary)', 
                              fontSize: '0.85rem',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>
                              {n.title}
                            </strong>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                              {timeAgo(n.createdAt)}
                            </span>
                          </div>

                          <div style={{ 
                            fontSize: '0.8rem', 
                            color: isUnread ? 'var(--text-primary)' : 'var(--text-secondary)',
                            lineHeight: 1.4,
                            wordBreak: 'break-word'
                          }}>
                            {n.message}
                          </div>
                        </div>

                        {/* Right Action: Delete Button & Unread indicator */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                          <button
                            type="button"
                            className="chat-action-text-btn"
                            style={{ padding: '0.2rem', color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer', opacity: 0.7 }}
                            onClick={() => handleDeleteNotification(n.id)}
                            title="Dismiss notification"
                          >
                            <X size={13} />
                          </button>
                          {isUnread && (
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
                          )}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </ModalPortal>
      )}


      {/* User Profile Modal */}
      {viewingUserProfile && (
        <UserProfileModal
          userKey={viewingUserProfile.userKey}
          authorFallback={viewingUserProfile.authorFallback}
          users={users}
          session={session}
          posts={posts}
          ideas={ideas}
          workspaces={workspaces}
          tasks={tasks}
          contributionRequests={contributionRequests}
          discussions={discussions}
          onClose={() => setViewingUserProfile(null)}
          onNavigateToPost={(postId) => {
            setViewingUserProfile(null);
            setActiveTab('all');
            setTimeout(() => {
              const el = document.getElementById(`post-${postId}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
          }}
          onNavigateToWorkspace={(wsId) => {
            setViewingUserProfile(null);
            setActiveWorkspaceId(wsId);
            navTo('workspaces');
          }}
          onOpenMyProfileSettings={() => {
            setViewingUserProfile(null);
            navTo('profile');
          }}
        />
      )}




      {/* Create / Edit Post Modal */}
      {showNewPost && (
        <CreatePost
          user={session}
          initialPost={editingPost || (postType !== 'project' ? { type: postType } : null)}
          onPublish={async (newPost) => {
            if (editingPost) {
              setPosts(prev => {
                const updated = prev.map(p => p.id === newPost.id ? newPost : p);
                broadcast('SYNC_POSTS', updated, `Post updated: ${newPost.title}`);
                storageManager.setItem('campushub_posts', updated);
                return updated;
              });
              try { api.updatePost(newPost.id, newPost).catch(() => {}); } catch(e) {}
              setEditingPost(null);
            } else {
              setPosts(prev => {
                const updated = [newPost, ...prev];
                broadcast('SYNC_POSTS', updated, `${session.username} published: ${newPost.title}`);
                storageManager.setItem('campushub_posts', updated);
                return updated;
              });
              try { api.createPost(newPost).catch(() => {}); } catch(e) {}
            }
            setShowNewPost(false);
            setToast(`✓ Post "${newPost.title}" published successfully!`);
          }}
          onClose={() => {
            setShowNewPost(false);
            setEditingPost(null);
          }}
        />
      )}

      {/* Feed Post Idea Contribution Modals */}
      {joinModalPost && (
        <JoinContributionModal
          idea={joinModalPost}
          user={session}
          onSubmit={(req) => {
            handleSubmitContributionRequest(req);
            setJoinModalPost(null);
          }}
          onClose={() => setJoinModalPost(null)}
        />
      )}

      {manageRequestsPost && (
        <ManageRequestsModal
          idea={manageRequestsPost}
          requests={contributionRequests || []}
          onAccept={(req) => {
            handleAcceptContributionRequest(req);
          }}
          onReject={(req) => {
            handleRejectContributionRequest(req.id);
          }}
          onClose={() => setManageRequestsPost(null)}
        />
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget){ setSelectedEvent(null); setEditEvent(false); setShowReg(false); setEventOptions(false); } }}>
          <div className="modal-content glass-panel" style={{ background:'var(--bg-secondary)', maxWidth:'700px' }}>
            <div className="modal-header">
              <h2>Event Details</h2>
              <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
                {(isAdmin || session?.username===selectedEvent.authorId) && (
                  <div style={{ position:'relative' }}>
                    <button className="icon-btn" onClick={() => setEventOptions(!eventOptions)}><EllipsisVertical size={24}/></button>
                    {eventOptions && (
                      <div className="glass-panel" style={{ position:'absolute', right:0, top:'100%', marginTop:'0.5rem', background:'var(--bg-secondary)', padding:'0.5rem', borderRadius:'8px', zIndex:10, minWidth:'150px' }}>
                        <button className="nav-link" style={{ width:'100%', textAlign:'left', padding:'0.5rem' }} onClick={() => { setEditEvent(true); setEventOptions(false); }}>Edit Event</button>
                        <button className="nav-link" style={{ width:'100%', textAlign:'left', padding:'0.5rem', color:'var(--danger)' }} onClick={async () => {
                          setEventOptions(false);
                          const ok = await showConfirm(
                            `Are you sure you want to delete "${selectedEvent?.title || 'this event'}"? This action cannot be undone.`,
                            'Delete Event?',
                            { confirmText: 'Delete Event', type: 'danger', isDanger: true }
                          );
                          if (ok) {
                            setPosts(prev => prev.filter(p => p.id !== selectedEvent.id));
                            setSelectedEvent(null);
                          }
                        }}>Delete Event</button>
                      </div>
                    )}
                  </div>
                )}
                <button className="icon-btn" onClick={() => { setSelectedEvent(null); setEditEvent(false); setShowReg(false); setEventOptions(false); }}><X size={24}/></button>
              </div>
            </div>

            {editEvent ? (
              <form onSubmit={handleUpdateEvent} style={{ paddingTop:'1rem' }}>
                <h3 style={{ marginBottom:'1.5rem', color:'var(--accent-primary)' }}>Edit Event</h3>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Event Title *</label><input type="text" name="title" className="form-control" defaultValue={selectedEvent.title} required /></div>
                  <div className="form-group"><label className="form-label">Organization *</label><input type="text" name="organization" className="form-control" defaultValue={selectedEvent.organization||selectedEvent.author.name} required /></div>
                </div>
                <div className="form-group"><label className="form-label">Description *</label><textarea name="explanation" className="form-control" rows={3} defaultValue={selectedEvent.description} required /></div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Event Date *</label><input type="date" name="eventDate" className="form-control" defaultValue={selectedEvent.eventDate} required min={today()} /></div>
                  <div className="form-group"><label className="form-label">Event Time</label><input type="time" name="eventTime" className="form-control" defaultValue={selectedEvent.eventTime} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Venue *</label><input type="text" name="venue" className="form-control" defaultValue={selectedEvent.location} required /></div>
                  <div className="form-group"><label className="form-label">Organizer *</label><input type="text" name="organizerName" className="form-control" defaultValue={selectedEvent.organizerName||selectedEvent.author.name} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Contact *</label><input type="tel" name="contactInfo" className="form-control" defaultValue={selectedEvent.contactInfo} pattern="[0-9]{10}" required /></div>
                  <div className="form-group"><label className="form-label">Duration *</label><input type="text" name="duration" className="form-control" defaultValue={selectedEvent.duration} required /></div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select name="category" className="form-control" defaultValue={selectedEvent.category} required>
                      {['College Event','Hackathon','Coding Event','Workshop','Seminar'].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Participant Type *</label>
                    <select name="participantType" className="form-control" defaultValue={selectedEvent.participantType||'single'} onChange={e=>setPartType(e.target.value)} required>
                      <option value="single">Single</option><option value="team">Team</option>
                    </select>
                  </div>
                </div>
                {partType==='team' && (
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Min Team Size *</label><input type="number" name="minTeamSize" className="form-control" min={2} defaultValue={selectedEvent.minTeamSize||2} required /></div>
                    <div className="form-group"><label className="form-label">Max Team Size *</label><input type="number" name="maxTeamSize" className="form-control" min={2} defaultValue={selectedEvent.maxTeamSize||4} required /></div>
                  </div>
                )}
                <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1rem' }}>
                  <button type="button" className="secondary-btn" onClick={() => setEditEvent(false)}>Cancel</button>
                  <button type="submit" className="primary-btn">Save Changes</button>
                </div>
              </form>
            ) : showReg ? (
              <div style={{ paddingTop:'1rem' }}>
                <div className="glass-panel" style={{ padding:'1rem', marginBottom:'1.5rem', background:'rgba(0,0,0,0.1)' }}>
                  <h3 style={{ color:'var(--accent-primary)', marginBottom:'0.5rem' }}>{selectedEvent.title}</h3>
                  <p style={{ fontSize:'0.85rem', color:'var(--text-secondary)' }}>{selectedEvent.eventDate} | {selectedEvent.eventTime} | {selectedEvent.location}</p>
                </div>
                <h3 style={{ marginBottom:'1rem', fontSize:'1.2rem' }}>Registration Form</h3>
                <form onSubmit={handleEventRegister}>
                  {selectedEvent.participantType==='team' ? (
                    <>
                      <div className="form-group"><label className="form-label">Team Name *</label><input type="text" className="form-control" placeholder="The Coders" required /></div>
                      <div className="form-group">
                        <label className="form-label">Team Size * ({selectedEvent.minTeamSize}–{selectedEvent.maxTeamSize} Members)</label>
                        <select className="form-control" value={teamSize} onChange={e=>setTeamSize(parseInt(e.target.value))} required>
                          {Array.from({length: parseInt(selectedEvent.maxTeamSize) - parseInt(selectedEvent.minTeamSize) + 1},(_,i)=>i+parseInt(selectedEvent.minTeamSize)).map(n=>(
                            <option key={n} value={n}>{n} Members</option>
                          ))}
                        </select>
                      </div>
                      {Array.from({length:teamSize},(_,i)=>(
                        <div key={i} className="form-row">
                          <div className="form-group"><label className="form-label">Member {i+1} Name {i===0?'*':''}</label><input type="text" className="form-control" placeholder={`Member ${i+1}`} required={i===0} /></div>
                          <div className="form-group"><label className="form-label">Roll No. {i===0?'*':''}</label><input type="text" className="form-control" placeholder="Roll Number" required={i===0} /></div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <>
                      <div className="form-row">
                        <div className="form-group"><label className="form-label">Full Name *</label><input type="text" className="form-control" defaultValue={session.username} required /></div>
                        <div className="form-group"><label className="form-label">Roll Number *</label><input type="text" className="form-control" placeholder="Your Roll No." required /></div>
                      </div>
                    </>
                  )}
                  <div className="form-group"><label className="form-label">Email *</label><input type="email" className="form-control" placeholder="your@email.com" required /></div>
                  <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1rem' }}>
                    <button type="button" className="secondary-btn" onClick={() => setShowReg(false)}>Back</button>
                    <button type="submit" className="primary-btn">Submit Registration</button>
                  </div>
                </form>
              </div>
            ) : (
              /* Event detail view */
              <div style={{ paddingTop:'0.5rem' }}>
                {selectedEvent.image && <img src={selectedEvent.image} alt={selectedEvent.title} style={{ width:'100%', height:'260px', objectFit:'cover', borderRadius:'12px', marginBottom:'1.5rem' }} loading="lazy" />}
                <h2 style={{ fontSize:'1.8rem', fontWeight:800, marginBottom:'0.5rem' }}>{selectedEvent.title}</h2>
                <p style={{ color:'var(--text-secondary)', marginBottom:'1.5rem' }}>{selectedEvent.description}</p>
                <div className="responsive-grid grid-2" style={{ gap:'1rem', marginBottom:'1.5rem' }}>
                  {[['📅 Date', selectedEvent.eventDate], ['⏰ Time', selectedEvent.eventTime], ['📍 Venue', selectedEvent.location], ['⏱ Duration', selectedEvent.duration], ['🏷 Category', selectedEvent.category], ['👥 Participants', selectedEvent.participantType==='team'?`Teams (${selectedEvent.minTeamSize}–${selectedEvent.maxTeamSize})`:'Individual']].filter(([,v])=>v).map(([k,v])=>(
                    <div key={k} style={{ background:'rgba(255,255,255,0.04)', borderRadius:'10px', padding:'0.75rem 1rem' }}>
                      <p style={{ fontSize:'0.78rem', color:'var(--text-secondary)', marginBottom:'0.25rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>{k}</p>
                      <p style={{ fontWeight:600 }}>{v}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap' }}>
                  {isAuth && !registrations?.[selectedEvent.id] && (
                    <button className="primary-btn pulse-hover" style={{ flex:1 }} onClick={() => setShowReg(true)}>
                      Register Now 🚀
                    </button>
                  )}
                  {registrations?.[selectedEvent.id] && (
                    <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'10px', padding:'0.75rem 1.5rem', color:'var(--success)', fontWeight:700, display:'flex', alignItems:'center', gap:'0.5rem' }}>
                      ✅ You're Registered!
                    </div>
                  )}
                  <button className="secondary-btn" onClick={() => handleShare(selectedEvent)}>
                    <Share2 size={16}/> Share Event
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && editUser && (
        <ModalPortal>
          <div className="modal-overlay" onClick={e => { if(e.target===e.currentTarget){ setShowEditUser(false); setEditUser(null); } }}>
            <div className="modal-content glass-panel" style={{ background:'var(--bg-secondary)', maxWidth:'480px' }}>
              <div className="modal-header">
                <h2>Edit User</h2>
                <button className="icon-btn" onClick={() => { setShowEditUser(false); setEditUser(null); }}><X size={24}/></button>
              </div>
              <form onSubmit={handleEditUser}>
                <div className="form-group"><label className="form-label">Username *</label><input type="text" name="newUsername" className="form-control" defaultValue={editUser.originalUsername} required /></div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select name="role" className="form-control" defaultValue={editUser.role}>
                    <option value="admin">Admin</option><option value="student">Student</option><option value="new_user">New User</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">New Password (leave blank to keep)</label><input type="password" name="newPassword" className="form-control" placeholder="Min 8 characters" minLength={8} autoComplete="new-password" /></div>
                <div style={{ display:'flex', gap:'1rem', justifyContent:'flex-end', marginTop:'1.5rem' }}>
                  <button type="button" className="secondary-btn" onClick={() => { setShowEditUser(false); setEditUser(null); }}>Cancel</button>
                  <button type="submit" className="primary-btn">Save User</button>
                </div>
              </form>
            </div>
          </div>
        </ModalPortal>
      )}
        </div>
      )}
    </>
  );
}
