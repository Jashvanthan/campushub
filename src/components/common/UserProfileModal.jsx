import React, { useState } from 'react';
import {
  X, User, MapPin, Building, GraduationCap, Briefcase, Calendar,
  Sparkles, MessageSquare, ThumbsUp, Layers, CheckCircle2, ArrowRight,
  Code, Lightbulb, Trophy, ExternalLink, Shield, Tag, FileText
} from 'lucide-react';
import ModalPortal from './ModalPortal';
import FormattedText from './FormattedText';

// Fallback seed metadata for common campus members
export const DEFAULT_USER_PROFILES = {
  sarah_jenkins: {
    name: 'Sarah Jenkins',
    username: 'sarah_jenkins',
    avatar: 'SJ',
    role: 'Student Researcher',
    department: 'Computer Science & Engineering',
    institution: 'Stanford University',
    major: 'M.S. Computer Science (AI/ML)',
    bio: 'Computer Science researcher & passionate full-stack developer. Building intelligent systems and computer vision solutions for smart campus automation.',
    skills: ['Python', 'OpenCV', 'PyTorch', 'React', 'Node.js', 'AI/ML'],
    joined: 'January 2025'
  },
  tech_club: {
    name: 'Tech Club',
    username: 'tech_club',
    avatar: 'TC',
    role: 'Official Campus Organization',
    department: 'Student Activity Council',
    institution: 'CampusHub Institute',
    major: 'Developer Community',
    bio: 'The premier student-led technology club hosting hackathons, coding workshops, developer conferences, and competitive tech events.',
    skills: ['Events', 'Hackathons', 'Community', 'Open Source', 'Networking'],
    joined: 'September 2024'
  },
  david_chen: {
    name: 'David Chen',
    username: 'david_chen',
    avatar: 'DC',
    role: 'Hardware & IoT Specialist',
    department: 'Electrical & Electronics Engineering',
    institution: 'CampusHub Institute',
    major: 'B.S. Electrical & Computer Engineering',
    bio: 'Hardware enthusiast exploring smart campus IoT, RFID sensors, robotics, and embedded systems to streamline everyday campus life.',
    skills: ['IoT', 'C++', 'Arduino', 'Embedded Systems', 'Hardware', 'Python'],
    joined: 'October 2024'
  },
  anjali_sharma: {
    name: 'Anjali Sharma',
    username: 'anjali_sharma',
    avatar: 'AS',
    role: 'Network & Cloud Engineer',
    department: 'Information Technology',
    institution: 'CampusHub Institute',
    major: 'B.Tech Information Technology',
    bio: 'IT undergraduate passionate about cloud infrastructure, computer networks, distributed systems, and collaborative web platforms.',
    skills: ['Networking', 'Linux', 'React', 'Docker', 'JavaScript', 'SQL'],
    joined: 'November 2024'
  },
  std1: {
    name: 'Student Member',
    username: 'std1',
    avatar: 'ST',
    role: 'Student Member',
    department: 'Computer Science',
    institution: 'CampusHub University',
    major: 'B.S. Software Engineering',
    bio: 'Passionate undergraduate student active in campus hackathons, open source workspaces, and collaborative engineering projects.',
    skills: ['React', 'JavaScript', 'Python', 'CSS', 'Git'],
    joined: 'August 2024'
  },
  admin: {
    name: 'Campus Admin',
    username: 'admin',
    avatar: 'AD',
    role: 'Platform Administrator',
    department: 'Campus Operations & IT',
    institution: 'CampusHub University',
    major: 'System Administration',
    bio: 'CampusHub central administrator managing student safety, verified announcements, hackathons, and campus workspace infrastructure.',
    skills: ['Administration', 'Moderation', 'IT Systems', 'Community Management'],
    joined: 'January 2024'
  }
};

export default function UserProfileModal({
  userKey,
  authorFallback = null,
  users = {},
  session = null,
  posts = [],
  ideas = [],
  workspaces = [],
  tasks = [],
  contributionRequests = [],
  discussions = [],
  onClose,
  onNavigateToPost,
  onNavigateToWorkspace,
  onOpenMyProfileSettings
}) {
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'contributions' | 'about'

  // Resolve user profile info from users dict, fallback seed dictionary, or authorFallback
  const rawUser = users?.[userKey] || (authorFallback?.name && Object.values(users || {}).find(u => u.name === authorFallback.name));
  const seedInfo = DEFAULT_USER_PROFILES[userKey] || DEFAULT_USER_PROFILES[rawUser?.username] || {};

  const name = rawUser?.name || authorFallback?.name || seedInfo.name || userKey;
  const username = rawUser?.username || seedInfo.username || userKey;
  const avatar = rawUser?.avatar || authorFallback?.avatar || seedInfo.avatar || (name ? name.slice(0, 2).toUpperCase() : 'U');
  const role = rawUser?.role === 'admin' ? 'Administrator' : (seedInfo.role || (rawUser?.role === 'student' ? 'Student Member' : 'Campus Member'));
  const institution = rawUser?.institution || seedInfo.institution || 'CampusHub University';
  const major = rawUser?.major || seedInfo.major || seedInfo.department || 'Undergraduate';
  const bio = rawUser?.bio || seedInfo.bio || 'Campus community member participating in collaborative projects, events, and campus discussions.';
  const skills = rawUser?.skills || seedInfo.skills || ['Campus Member', 'Collaboration', 'Problem Solving'];
  const joinedDate = seedInfo.joined || 'Active Contributor';

  const isCurrentUser = session?.username === username || session?.username === userKey;

  // Filter posts by this user
  const userPosts = (posts || []).filter(p => {
    if (p.authorId === userKey || p.authorId === username) return true;
    if (p.author?.name && (p.author.name === name || p.author.name === userKey)) return true;
    if (userKey === 'std1' && (p.authorId === 'std1' || !p.authorId)) return true;
    return false;
  });

  // Filter ideas submitted by this user
  const userIdeas = (ideas || []).filter(i => {
    return i.creatorId === userKey || i.creatorId === username || i.creatorName === name;
  });

  // Filter workspaces where the user is a member
  const userWorkspaces = (workspaces || []).filter(w => {
    return (w.members || []).some(m => m.userId === userKey || m.userId === username || m.name === name || m.username === userKey);
  });

  // Filter accepted contributions
  const userContributions = (contributionRequests || []).filter(r => {
    return (r.applicantId === userKey || r.applicantId === username || r.applicantName === name) && r.status === 'ACCEPTED';
  });

  // Filter tasks completed
  const userTasksCompleted = (tasks || []).filter(t => {
    return (t.assigneeId === userKey || t.assigneeId === username) && t.status === 'DONE';
  });

  // Total Likes received on posts
  const totalLikes = userPosts.reduce((acc, p) => acc + (p.likes || 0), 0);

  return (
    <ModalPortal>
      <div className="modal-backdrop user-profile-modal-backdrop" onClick={onClose}>
        <div 
          className="glass-panel user-profile-modal-card" 
          onClick={e => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
        >
          {/* Header Banner */}
          <div className="user-profile-banner">
            <button 
              type="button" 
              className="user-profile-close-btn" 
              onClick={onClose}
              title="Close Profile"
            >
              <X size={18} />
            </button>
          </div>

          {/* Profile Identity Bar */}
          <div className="user-profile-main-header">
            <div className="user-profile-avatar-wrapper">
              <div className="user-profile-avatar">
                {typeof avatar === 'string' && (avatar.startsWith('http') || avatar.startsWith('data:image')) ? (
                  <img src={avatar} alt={name} className="user-profile-avatar-img" />
                ) : (
                  <span className="user-profile-avatar-initials">{typeof avatar === 'string' ? avatar.slice(0, 2).toUpperCase() : 'U'}</span>
                )}
              </div>
              <span className="user-profile-status-online" title="Online &amp; Active"></span>
            </div>

            <div className="user-profile-identity-info">
              <div className="user-profile-name-row">
                <h2 className="user-profile-name">{name}</h2>
                <span className="user-profile-role-pill">
                  {role === 'Administrator' && <Shield size={13} style={{ marginRight: '3px' }} />}
                  {role}
                </span>
                {isCurrentUser && (
                  <span className="user-profile-you-badge">You</span>
                )}
              </div>
              <div className="user-profile-handle">@{username}</div>
              
              <div className="user-profile-meta-chips">
                {institution && (
                  <div className="user-profile-meta-chip">
                    <Building size={13} />
                    <span>{institution}</span>
                  </div>
                )}
                {major && (
                  <div className="user-profile-meta-chip">
                    <GraduationCap size={13} />
                    <span>{major}</span>
                  </div>
                )}
              </div>
            </div>

            {isCurrentUser && onOpenMyProfileSettings && (
              <div className="user-profile-edit-cta">
                <button 
                  type="button" 
                  className="secondary-btn" 
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.82rem' }}
                  onClick={() => {
                    onClose();
                    onOpenMyProfileSettings();
                  }}
                >
                  Edit Profile Settings
                </button>
              </div>
            )}
          </div>

          {/* User Bio Box */}
          <div className="user-profile-bio-box">
            <p className="user-profile-bio-text">{bio}</p>
          </div>

          {/* High-Level Numerical Metric Stats Grid */}
          <div className="user-profile-stats-grid">
            <div className="user-profile-stat-card" onClick={() => setActiveTab('posts')}>
              <div className="stat-num" style={{ color: '#818cf8' }}>{userPosts.length}</div>
              <div className="stat-label">Posts Published</div>
            </div>
            <div className="user-profile-stat-card" onClick={() => setActiveTab('contributions')}>
              <div className="stat-num" style={{ color: '#fbbf24' }}>{userIdeas.length}</div>
              <div className="stat-label">Ideas &amp; Projects</div>
            </div>
            <div className="user-profile-stat-card" onClick={() => setActiveTab('contributions')}>
              <div className="stat-num" style={{ color: '#34d399' }}>{userWorkspaces.length}</div>
              <div className="stat-label">Workspaces Joined</div>
            </div>
            <div className="user-profile-stat-card">
              <div className="stat-num" style={{ color: '#f43f5e' }}>{totalLikes}</div>
              <div className="stat-label">Total Post Likes</div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="user-profile-tabs">
            <button
              type="button"
              className={`user-profile-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveTab('posts')}
            >
              <FileText size={15} />
              <span>Posts ({userPosts.length})</span>
            </button>
            <button
              type="button"
              className={`user-profile-tab-btn ${activeTab === 'contributions' ? 'active' : ''}`}
              onClick={() => setActiveTab('contributions')}
            >
              <Sparkles size={15} />
              <span>Projects &amp; Contributions ({userIdeas.length + userWorkspaces.length + userContributions.length})</span>
            </button>
            <button
              type="button"
              className={`user-profile-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <User size={15} />
              <span>About &amp; Skills</span>
            </button>
          </div>

          {/* Tab Content Body */}
          <div className="user-profile-tab-content">
            {/* 1. POSTS TAB */}
            {activeTab === 'posts' && (
              <div className="user-profile-posts-list">
                {userPosts.length > 0 ? (
                  userPosts.map(post => (
                    <div 
                      key={post.id} 
                      className="user-profile-post-card"
                      onClick={() => {
                        if (onNavigateToPost) {
                          onClose();
                          onNavigateToPost(post.id);
                        }
                      }}
                    >
                      <div className="user-profile-post-header">
                        <div className="user-profile-post-type-tag" data-type={post.type}>
                          {post.type?.replace('_', ' ')}
                        </div>
                        <span className="user-profile-post-date">{post.date || 'Recently'}</span>
                      </div>

                      <h4 className="user-profile-post-title">{post.title}</h4>

                      <div className="user-profile-post-desc">
                        {post.description ? (
                          <FormattedText text={post.description.slice(0, 180) + (post.description.length > 180 ? '...' : '')} />
                        ) : (
                          <span>No description provided</span>
                        )}
                      </div>

                      {post.tags && (
                        <div className="user-profile-post-tags">
                          {(Array.isArray(post.tags) ? post.tags : [post.tags]).filter(Boolean).map((t, idx) => (
                            <span key={idx} className="tag">#{t}</span>
                          ))}
                        </div>
                      )}

                      <div className="user-profile-post-footer">
                        <div className="post-metric">
                          <ThumbsUp size={13} /> <span>{post.likes || 0}</span>
                        </div>
                        <div className="post-metric">
                          <MessageSquare size={13} /> <span>{(post.comments || []).length}</span>
                        </div>
                        {post.department && (
                          <span className="post-dept-pill">{post.department}</span>
                        )}
                        <span className="view-post-link">
                          View Post <ArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="user-profile-empty-state">
                    <FileText size={36} color="var(--text-muted)" />
                    <h4>No Posts Yet</h4>
                    <p>This user hasn't published any posts to the campus feed yet.</p>
                  </div>
                )}
              </div>
            )}

            {/* 2. CONTRIBUTIONS & WORKSPACES TAB */}
            {activeTab === 'contributions' && (
              <div className="user-profile-contributions-section">
                {/* Ideas & Projects Created */}
                <div className="contributions-block">
                  <h4 className="contributions-block-title">
                    <Lightbulb size={16} color="#fbbf24" /> Created Ideas &amp; Projects ({userIdeas.length})
                  </h4>
                  {userIdeas.length > 0 ? (
                    <div className="contributions-grid">
                      {userIdeas.map(idea => (
                        <div key={idea.id} className="contribution-mini-card">
                          <div className="contribution-card-top">
                            <span className="status-pill status-open">{idea.status || 'IDEA'}</span>
                            <span className="category-pill">{idea.category}</span>
                          </div>
                          <h5 className="contribution-card-title">{idea.title}</h5>
                          <p className="contribution-card-desc">{idea.description?.slice(0, 100)}...</p>
                          <div className="contribution-card-stats">
                            <span>❤️ {idea.likes || 0} Upvotes</span>
                            <span>👥 {(idea.contributors || []).length} Contributors</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-inline-text">No project ideas submitted yet.</p>
                  )}
                </div>

                {/* Workspaces Joined */}
                <div className="contributions-block" style={{ marginTop: '1.5rem' }}>
                  <h4 className="contributions-block-title">
                    <Layers size={16} color="#34d399" /> Joined Project Workspaces ({userWorkspaces.length})
                  </h4>
                  {userWorkspaces.length > 0 ? (
                    <div className="contributions-grid">
                      {userWorkspaces.map(ws => (
                        <div key={ws.id} className="contribution-mini-card workspace-mini-card">
                          <div className="contribution-card-top">
                            <span className="ws-active-badge">Active Workspace</span>
                            <span className="ws-progress-text">{ws.progress || 0}% Done</span>
                          </div>
                          <h5 className="contribution-card-title">{ws.name}</h5>
                          <p className="contribution-card-desc">{ws.description?.slice(0, 100)}...</p>
                          <div className="ws-progress-bar-wrap">
                            <div className="ws-progress-bar-fill" style={{ width: `${ws.progress || 10}%` }}></div>
                          </div>
                          <div className="contribution-card-footer">
                            <span>{(ws.members || []).length} Team Members</span>
                            {onNavigateToWorkspace && (
                              <button 
                                type="button" 
                                className="text-btn ws-open-btn"
                                onClick={() => {
                                  onClose();
                                  onNavigateToWorkspace(ws.id);
                                }}
                              >
                                Open Workspace →
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-inline-text">Not a member of any project workspace yet.</p>
                  )}
                </div>

                {/* Accepted Roles / Completed Tasks */}
                <div className="contributions-block" style={{ marginTop: '1.5rem' }}>
                  <h4 className="contributions-block-title">
                    <CheckCircle2 size={16} color="#60a5fa" /> Accepted Roles &amp; Completed Tasks ({userContributions.length + userTasksCompleted.length})
                  </h4>
                  {userContributions.length > 0 || userTasksCompleted.length > 0 ? (
                    <div className="roles-list">
                      {userContributions.map(req => (
                        <div key={req.id} className="role-item-badge">
                          <span className="role-name">🏆 {req.role || 'Contributor'}</span>
                          <span className="role-target">for "{req.ideaTitle || 'Campus Project'}"</span>
                        </div>
                      ))}
                      {userTasksCompleted.map(t => (
                        <div key={t.id} className="role-item-badge task-badge">
                          <span className="role-name">✅ {t.title}</span>
                          <span className="role-target">Completed in Sprint</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-inline-text">No active contribution badges yet.</p>
                  )}
                </div>
              </div>
            )}

            {/* 3. ABOUT & DETAILS TAB */}
            {activeTab === 'about' && (
              <div className="user-profile-about-section">
                <div className="about-grid">
                  <div className="about-item">
                    <span className="about-item-label">Full Name</span>
                    <span className="about-item-value">{name}</span>
                  </div>
                  <div className="about-item">
                    <span className="about-item-label">Username</span>
                    <span className="about-item-value">@{username}</span>
                  </div>
                  <div className="about-item">
                    <span className="about-item-label">Campus Role</span>
                    <span className="about-item-value">{role}</span>
                  </div>
                  <div className="about-item">
                    <span className="about-item-label">University / Institution</span>
                    <span className="about-item-value">{institution}</span>
                  </div>
                  <div className="about-item">
                    <span className="about-item-label">Major / Field of Study</span>
                    <span className="about-item-value">{major}</span>
                  </div>
                  <div className="about-item">
                    <span className="about-item-label">Member Since</span>
                    <span className="about-item-value">{joinedDate}</span>
                  </div>
                </div>

                {/* Skills & Expertise */}
                <div className="about-skills-section">
                  <h4 className="about-sub-title">Skills &amp; Campus Expertise</h4>
                  <div className="about-skills-chips">
                    {skills.map((s, idx) => (
                      <span key={idx} className="skill-pill">
                        <Tag size={12} /> {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
