import React, { useState } from 'react';
import {
  HelpCircle, BookOpen, Lightbulb, Users, FolderKanban, Bell, Search,
  MessageSquare, Shield, Star, ChevronDown, ChevronUp, Send, CheckCircle,
  ArrowLeft, ThumbsUp, AlertCircle, Zap, Globe, Lock, Home, FileText
} from 'lucide-react';

const FAQ_SECTIONS = [
  {
    id: 'getting-started',
    icon: <Home size={20} />,
    title: 'Getting Started',
    color: '#6366f1',
    items: [
      {
        q: 'How do I create an account on CampusHub?',
        a: 'Click "Sign Up" on the login page, fill in your details (name, email, student ID, and password). After registration, you will receive a welcome email. You can then log in and start exploring the platform.'
      },
      {
        q: 'What roles are available on CampusHub?',
        a: 'CampusHub has two main roles: Student (can post, join workspaces, submit ideas, and collaborate on projects) and Admin (can manage users, moderate content, and access the admin panel). Guests can browse public posts without logging in.'
      },
      {
        q: 'How do I update my profile details?',
        a: 'Go to your Profile page via the top navigation bar. Scroll to the "Edit Your Profile Details" section. You can update your name, institution, degree/major, bio, skills, profile photo, and password there.'
      },
      {
        q: 'Can I use CampusHub on my mobile device?',
        a: 'Yes! CampusHub is fully responsive and works on mobile, tablet, and desktop browsers. The navigation adapts to smaller screens with a mobile-friendly menu.'
      }
    ]
  },
  {
    id: 'posts',
    icon: <FileText size={20} />,
    title: 'Posts & Feed',
    color: '#10b981',
    items: [
      {
        q: 'What types of posts can I create?',
        a: 'You can create several types of posts: General (announcements, updates), Project (collaborative projects), Event (campus events with date/time), and Issue (reports of campus problems). Each type has a different form with specific fields.'
      },
      {
        q: 'How do I like or comment on a post?',
        a: 'On the feed, click the ❤️ heart icon below any post to like it. Click the 💬 comment icon to open the comment section and type your response. Your interactions are visible to other users.'
      },
      {
        q: 'How do I share a post?',
        a: 'Click the Share icon (↗) on any post to open the Share modal. You can copy the direct post link to your clipboard or use the native share option on supported mobile devices.'
      },
      {
        q: 'Can I edit or delete my own posts?',
        a: 'Yes! Click the three-dot menu (⋮) on your post to see options for editing or deleting. Admins can also delete any post that violates community guidelines.'
      },
      {
        q: 'How does the feed filter work?',
        a: 'Use the filter tabs at the top of the feed (All, Projects, Events, Ideas, Issues) to show only specific post types. You can also use the Search page to find posts by keyword, author, or tag.'
      }
    ]
  },
  {
    id: 'ideas',
    icon: <Lightbulb size={20} />,
    title: 'Ideas & Contributions',
    color: '#f59e0b',
    items: [
      {
        q: 'How do I submit a new idea?',
        a: 'Navigate to the "Ideas & Contributions" tab. Click the "Submit New Idea" button. Fill in the idea title, problem description, proposed solution, impact, category, required skills, and team size. Submit to share your idea with the campus community.'
      },
      {
        q: 'What is the "Support" feature on ideas?',
        a: 'Clicking "Support" on an idea means you endorse it and want to see it developed. Support counts reflect community interest and are synced with post likes. You can toggle support on/off at any time.'
      },
      {
        q: 'How do I contribute to someone else\'s idea?',
        a: 'Open the idea card and click "Request to Contribute". Fill out the contribution request form with your role and skills. The idea creator will review your application and can accept or reject it from the "Manage Requests" panel.'
      },
      {
        q: 'How do I follow an idea for updates?',
        a: 'Click the 🔔 "Follow Idea" button on any idea card or detail view. You\'ll receive notifications when the idea is updated or when its status changes.'
      },
      {
        q: 'What do the idea status labels mean?',
        a: 'IDEA = newly submitted concept; IN PROGRESS = actively being developed; COMPLETED = successfully delivered; ARCHIVED = no longer active. Admins and idea creators can update the status.'
      }
    ]
  },
  {
    id: 'workspaces',
    icon: <FolderKanban size={20} />,
    title: 'Collaboration Workspaces',
    color: '#8b5cf6',
    items: [
      {
        q: 'What is a Workspace?',
        a: 'A Workspace is a dedicated project room automatically created when an idea is approved or submitted. It contains a Kanban board (tasks), milestones, file storage, team chat, discussions, and an activity log—all in one place.'
      },
      {
        q: 'How do I access a workspace?',
        a: 'Click the "Workspace" tab in the navigation bar to see all available workspaces. You can filter by your workspaces or browse all public ones. Click a workspace card to enter it.'
      },
      {
        q: 'How do I add tasks to a workspace?',
        a: 'Inside the workspace, go to the "Tasks" tab. Click "+ Add Task" to create a new task. Assign it to a team member, set a priority level (Low/Medium/High/Critical), due date, and status (Todo, In Progress, Done).'
      },
      {
        q: 'How does the workspace chat work?',
        a: 'The Team Chat tab inside each workspace provides a real-time chat room for project members. You can send messages, add emoji reactions, and pin important messages. All messages are project-scoped.'
      },
      {
        q: 'How do I leave a workspace?',
        a: 'In the workspace header, click the "Leave" or "Leave Workspace" option. Note: if you are the lead/creator, you may need to transfer leadership before leaving.'
      }
    ]
  },
  {
    id: 'notifications',
    icon: <Bell size={20} />,
    title: 'Notifications & Alerts',
    color: '#ec4899',
    items: [
      {
        q: 'How do I view my notifications?',
        a: 'Click the 🔔 bell icon in the top navigation bar to open the notification panel. Unread notifications are highlighted. Click any notification to navigate to the relevant content.'
      },
      {
        q: 'What triggers a notification?',
        a: 'You receive notifications when: someone likes or comments on your post, someone supports your idea, a contribution request is accepted or rejected, you are mentioned, or workspace activity occurs.'
      },
      {
        q: 'How do I mark notifications as read?',
        a: 'Click on any notification to mark it as read and navigate to the relevant item. Use the "Mark All Read" button in the notification panel to clear all unread badges at once.'
      }
    ]
  },
  {
    id: 'search',
    icon: <Search size={20} />,
    title: 'Search & Discovery',
    color: '#06b6d4',
    items: [
      {
        q: 'How do I search for posts or users?',
        a: 'Click the Search icon (🔍) in the navigation bar or navigate to the Search tab. Type any keyword to search across posts, ideas, users, and workspaces simultaneously.'
      },
      {
        q: 'Can I filter search results?',
        a: 'Yes, the search page allows filtering results by type (posts, users, ideas, workspaces), date range, and relevance. Results update in real time as you type.'
      }
    ]
  },
  {
    id: 'privacy',
    icon: <Shield size={20} />,
    title: 'Privacy & Security',
    color: '#64748b',
    items: [
      {
        q: 'Who can see my posts?',
        a: 'By default, posts are visible to everyone on the platform. When creating a post, you can set visibility to "Everyone" or "Members Only". Guest users can view public posts but cannot interact.'
      },
      {
        q: 'How is my password stored securely?',
        a: 'Passwords are never stored in plain text. CampusHub uses SHA-256 hashing and additional security measures to protect your credentials. We recommend using a strong password with letters, numbers, and symbols.'
      },
      {
        q: 'Can I delete my account?',
        a: 'To delete your account, please contact the platform administrator via the feedback form or email. Account deletion will permanently remove all your posts, ideas, and workspace data.'
      }
    ]
  }
];

export default function HelpCenterPage({ onBack, session }) {
  const [openSections, setOpenSections] = useState({ 'getting-started': true });
  const [openItems, setOpenItems] = useState({});
  const [feedbackForm, setFeedbackForm] = useState({ category: 'general', subject: '', message: '', rating: 0 });
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const timeoutRef = React.useRef(null);
  const toggleSection = (id) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleItem = (key) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!feedbackForm.subject.trim() || !feedbackForm.message.trim()) return;
    setFeedbackLoading(true);
    // Simulate API call
    await new Promise(r => setTimeout(r, 1200));
    setFeedbackLoading(false);
    setFeedbackSent(true);
    // Reset after 4 seconds
    setTimeout(() => {
      setFeedbackSent(false);
      setFeedbackForm({ category: 'general', subject: '', message: '', rating: 0 });
    }, 4000);
  };

  return (
    <section className="feed" id="feed" style={{ display: 'block' }}>
      <div className="help-center-wrapper">

        {/* Header */}
        <div className="help-center-hero glass-panel">
          <button
            type="button"
            className="secondary-btn help-back-btn"
            onClick={onBack}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1.5rem', padding: '0.45rem 1rem' }}
          >
            <ArrowLeft size={16} /> Back to Profile
          </button>

          <div className="help-hero-content">
            <div className="help-hero-icon">
              <HelpCircle size={40} />
            </div>
            <div>
              <h1 className="help-hero-title">Help Center</h1>
              <p className="help-hero-subtitle">
                Everything you need to know about CampusHub — your complete guide to posts, ideas, workspaces, and more.
              </p>
            </div>
          </div>

          {/* Quick Stats Bar */}
          <div className="help-quick-stats">
            <div className="help-stat-item">
              <Zap size={16} />
              <span>7 Feature Areas</span>
            </div>
            <div className="help-stat-item">
              <MessageSquare size={16} />
              <span>30+ FAQ Answers</span>
            </div>
            <div className="help-stat-item">
              <Globe size={16} />
              <span>Full App Coverage</span>
            </div>
            <div className="help-stat-item">
              <Lock size={16} />
              <span>Privacy Included</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="help-center-layout">

          {/* Left: FAQ Accordion */}
          <div className="help-faq-col">
            <div className="help-section-header">
              <BookOpen size={22} />
              <h2>Application Guidelines & FAQ</h2>
            </div>

            {FAQ_SECTIONS.map((section) => (
              <div key={section.id} className="help-faq-section glass-panel">
                {/* Section Header */}
                <button
                  className="help-faq-section-header"
                  aria-expanded={openSections[section.id] ? 'true' : 'false'}
                  aria-controls={`section-${section.id}`}
                  onClick={() => toggleSection(section.id)}
                  style={{ '--section-color': section.color }}
                >
                  <div className="help-faq-section-title">
                    <span className="help-faq-section-icon" style={{ color: section.color }}>
                      {section.icon}
                    </span>
                    <span>{section.title}</span>
                  </div>
                  {openSections[section.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {/* FAQ Items */}
                {openSections[section.id] && (
                  <div className="help-faq-items" id={`section-${section.id}`}>
                    {section.items.map((item, idx) => {
                      const key = `${section.id}-${idx}`;
                      const isOpen = openItems[key];
                      return (
                        <div key={key} className={`help-faq-item ${isOpen ? 'open' : ''}`}>
                          <button
                            className="help-faq-question"
                            onClick={() => toggleItem(key)}
                          >
                            <span>{item.q}</span>
                            {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                          {isOpen && (
                            <div className="help-faq-answer">
                              <AlertCircle size={14} style={{ flexShrink: 0, color: section.color, marginTop: '2px' }} />
                              <p>{item.a}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right: Feedback Form */}
          <div className="help-feedback-col">
            <div className="help-feedback-card glass-panel">
              <div className="help-section-header">
                <MessageSquare size={22} />
                <h2>Send Feedback</h2>
              </div>
              <p className="help-feedback-desc">
                Have a suggestion, found a bug, or want to share your experience? We'd love to hear from you!
              </p>

              {feedbackSent ? (
                <div className="help-feedback-success">
                  <CheckCircle size={40} />
                  <h3>Feedback Sent!</h3>
                  <p>Thank you{session?.name ? `, ${session.name}` : ''}! Your feedback has been submitted and our team will review it shortly.</p>
                </div>
              ) : (
                <form className="help-feedback-form" onSubmit={handleFeedbackSubmit}>
                  {/* Category */}
                  <div className="form-group">
                    <label className="form-label">Feedback Category</label>
                    <select
                      className="form-control help-select"
                      value={feedbackForm.category}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="general">💬 General Feedback</option>
                      <option value="bug">🐛 Bug Report</option>
                      <option value="feature">✨ Feature Request</option>
                      <option value="ui">🎨 UI / Design Suggestion</option>
                      <option value="performance">⚡ Performance Issue</option>
                      <option value="other">📌 Other</option>
                    </select>
                  </div>

                  {/* Subject */}
                  <div className="form-group">
                    <label className="form-label">Subject <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Brief summary of your feedback..."
                      value={feedbackForm.subject}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      maxLength={120}
                    />
                  </div>

                  {/* Message */}
                  <div className="form-group">
                    <label className="form-label">Message <span style={{ color: 'var(--danger)' }}>*</span></label>
                    <textarea
                      className="form-control"
                      placeholder="Describe your feedback in detail. Include steps to reproduce if it's a bug..."
                      value={feedbackForm.message}
                      onChange={e => setFeedbackForm(prev => ({ ...prev, message: e.target.value }))}
                      required
                      minLength={20}
                      rows={5}
                      style={{ resize: 'vertical', minHeight: '120px' }}
                    />
                    <div className="help-char-count">{feedbackForm.message.length} characters</div>
                  </div>

                  {/* Star Rating */}
                  <div className="form-group">
                    <label className="form-label">Rate Your Experience</label>
                    <div className="help-star-rating">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={`help-star-btn ${(hoverRating || feedbackForm.rating) >= star ? 'active' : ''}`}
                          onClick={() => setFeedbackForm(prev => ({ ...prev, rating: star }))}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          title={`${star} star${star > 1 ? 's' : ''}`}
                        >
                          <Star size={24} />
                        </button>
                      ))}
                      {(feedbackForm.rating > 0) && (
                        <span className="help-rating-label">
                          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][feedbackForm.rating]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sender info (auto-filled) */}
                  {session && (
                    <div className="help-sender-info">
                      <Users size={14} />
                      <span>Sending as <strong>{session.name || session.username}</strong> (@{session.username})</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="primary-btn help-submit-btn"
                    disabled={feedbackLoading || !feedbackForm.subject.trim() || !feedbackForm.message.trim()}
                  >
                    {feedbackLoading ? (
                      <>
                        <div className="help-spinner" /> Sending...
                      </>
                    ) : (
                      <>
                        <Send size={16} /> Submit Feedback
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>

            {/* Quick Links Card */}
            <div className="help-quick-links glass-panel">
              <div className="help-section-header" style={{ marginBottom: '1rem' }}>
                <Star size={18} />
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Quick Tips</h3>
              </div>
              <ul className="help-tips-list">
                <li><ThumbsUp size={13} /> Like posts to show support and boost visibility</li>
                <li><Bell size={13} /> Follow ideas to get updates on their progress</li>
                <li><Search size={13} /> Use the Search page to find anything instantly</li>
                <li><FolderKanban size={13} /> Join workspaces to collaborate on real projects</li>
                <li><Shield size={13} /> Keep your password secure and unique</li>
                <li><Lightbulb size={13} /> Submit your own ideas to inspire the campus community</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
