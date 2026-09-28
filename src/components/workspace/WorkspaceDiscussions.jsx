import React, { useState } from 'react';
import {
  MessageSquare, Plus, ThumbsUp, Pin, CheckCircle, Send,
  CornerDownRight, Check, X, ShieldAlert, Sparkles, Filter
} from 'lucide-react';
import NewDiscussionModal from './NewDiscussionModal';

const DISC_CATEGORIES = ['All', 'General', 'Development', 'Design', 'Research', 'Announcements'];

export default function WorkspaceDiscussions({
  workspace,
  discussions = [],
  currentUser,
  onAddDiscussion,
  onUpdateDiscussion
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeDiscussion, setActiveDiscussion] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);

  const filteredDiscussions = discussions.filter(d =>
    selectedCategory === 'All' ? true : d.category === selectedCategory
  );

  // Toggle Like on discussion
  const handleLike = (discId) => {
    const disc = discussions.find(d => d.id === discId);
    if (!disc) return;
    const likes = disc.likes || [];
    const isLiked = likes.includes(currentUser?.username);
    const newLikes = isLiked
      ? likes.filter(u => u !== currentUser?.username)
      : [...likes, currentUser?.username];
    onUpdateDiscussion({ ...disc, likes: newLikes });
  };

  // Toggle pin
  const handleTogglePin = (disc) => {
    onUpdateDiscussion({ ...disc, isPinned: !disc.isPinned });
  };

  // Toggle solution
  const handleToggleSolution = (disc) => {
    onUpdateDiscussion({ ...disc, isSolved: !disc.isSolved });
  };

  // Submit reply
  const handleSendReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeDiscussion) return;

    const newReply = {
      id: `rep-${Date.now()}`,
      authorId: currentUser.username,
      authorName: currentUser.name || currentUser.username,
      authorAvatar: currentUser.avatar || currentUser.username.slice(0, 2).toUpperCase(),
      text: replyText.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = {
      ...activeDiscussion,
      replies: [...(activeDiscussion.replies || []), newReply]
    };

    onUpdateDiscussion(updated);
    setActiveDiscussion(updated);
    setReplyText('');
  };

  return (
    <div className="workspace-discussions-tab">
      {/* Header and Category Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {DISC_CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`tag-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <button className="primary-btn pulse-hover" onClick={() => setShowNewModal(true)}>
          <Plus size={16} /> + New Discussion
        </button>
      </div>

      {/* Discussions Grid / List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {filteredDiscussions.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', opacity: 0.8 }}>
            <MessageSquare size={40} color="var(--text-secondary)" style={{ margin: '0 auto 1rem auto' }} />
            <h3>No discussions in this category yet</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Have an architecture question, design dilemma, or announcement? Start a conversation.
            </p>
            <button className="primary-btn" onClick={() => setShowNewModal(true)} style={{ marginTop: '1rem' }}>
              <Plus size={16} /> Start First Discussion
            </button>
          </div>
        ) : (
          filteredDiscussions.map(disc => {
            const isLiked = (disc.likes || []).includes(currentUser?.username);

            return (
              <div
                key={disc.id}
                className="glass-panel discussion-item-card"
                style={{
                  padding: '1.25rem',
                  border: disc.isPinned ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid var(--border-color)',
                  background: disc.isPinned ? 'rgba(245, 158, 11, 0.03)' : 'rgba(255, 255, 255, 0.02)'
                }}
              >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="post-avatar" style={{ width: '36px', height: '36px', fontSize: '0.85rem' }}>
                      {disc.authorAvatar || disc.authorName?.slice(0, 2).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{disc.authorName}</span>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span className="tag" style={{ padding: '1px 6px', fontSize: '0.7rem' }}>{disc.category}</span>
                        <span>•</span>
                        <span>{new Date(disc.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {disc.isPinned && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#fbbf24', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                        <Pin size={12} /> Pinned
                      </span>
                    )}
                    {disc.isSolved && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#34d399', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                        <CheckCircle size={12} /> Solved
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 style={{ fontSize: '1.1rem', margin: '0.4rem 0', fontWeight: 600 }}>{disc.title}</h3>
                <p style={{ color: 'var(--text-primary)', opacity: 0.9, lineHeight: 1.6, fontSize: '0.92rem', margin: '0 0 1rem 0', whiteSpace: 'pre-wrap' }}>
                  {disc.content}
                </p>

                {/* Actions & Reply Count */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                      className={`idea-metric-btn ${isLiked ? 'active-supported' : ''}`}
                      onClick={() => handleLike(disc.id)}
                    >
                      <ThumbsUp size={14} />
                      <span>{(disc.likes || []).length}</span>
                    </button>

                    <button
                      className="idea-metric-btn"
                      onClick={() => setActiveDiscussion(activeDiscussion?.id === disc.id ? null : disc)}
                    >
                      <MessageSquare size={14} />
                      <span>{(disc.replies || []).length} Replies</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      className="icon-btn"
                      onClick={() => handleTogglePin(disc)}
                      title={disc.isPinned ? 'Unpin' : 'Pin to top'}
                      style={{ padding: '4px', color: disc.isPinned ? '#fbbf24' : 'var(--text-secondary)' }}
                    >
                      <Pin size={15} />
                    </button>
                    <button
                      className="icon-btn"
                      onClick={() => handleToggleSolution(disc)}
                      title={disc.isSolved ? 'Mark unsolved' : 'Mark as solved'}
                      style={{ padding: '4px', color: disc.isSolved ? '#34d399' : 'var(--text-secondary)' }}
                    >
                      <CheckCircle size={15} />
                    </button>
                  </div>
                </div>

                {/* Replies Thread Drawer */}
                {activeDiscussion?.id === disc.id && (
                  <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', background: 'rgba(0, 0, 0, 0.15)', padding: '1rem', borderRadius: '10px' }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      Replies ({(disc.replies || []).length})
                    </h4>

                    {/* Reply List */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
                      {(disc.replies || []).length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No replies yet. Be the first to chime in!</p>
                      ) : (
                        disc.replies.map(rep => (
                          <div key={rep.id} style={{ display: 'flex', gap: '0.6rem', background: 'rgba(255, 255, 255, 0.02)', padding: '0.6rem 0.85rem', borderRadius: '8px' }}>
                            <div className="post-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem', flexShrink: 0 }}>
                              {rep.authorAvatar || rep.authorName?.slice(0, 2).toUpperCase() || 'U'}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{rep.authorName}</span>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                  {new Date(rep.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p style={{ fontSize: '0.85rem', margin: '0.2rem 0 0 0', lineHeight: 1.4, color: 'var(--text-primary)', opacity: 0.9 }}>
                                {rep.text}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Reply Form */}
                    <form onSubmit={handleSendReply} style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Write a constructive reply..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        style={{ fontSize: '0.88rem' }}
                      />
                      <button type="submit" className="primary-btn" style={{ padding: '0.4rem 1rem' }}>
                        <Send size={15} />
                      </button>
                    </form>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {showNewModal && (
        <NewDiscussionModal
          workspace={workspace}
          user={currentUser}
          onSubmit={(newDisc) => {
            onAddDiscussion(newDisc);
            setShowNewModal(false);
          }}
          onClose={() => setShowNewModal(false)}
        />
      )}
    </div>
  );
}
