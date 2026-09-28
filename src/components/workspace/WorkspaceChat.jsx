import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare, Send, Smile, Paperclip, Code2, Copy, Check,
  Reply, Sparkles, Hash, Users, Pin, ShieldCheck, Terminal,
  Flame, Heart, ThumbsUp, Rocket, Lightbulb, Eye, PartyPopper,
  Trash2, RotateCcw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight,
  ChevronsUp, ChevronsDown
} from 'lucide-react';
import { usePopup } from '../common/PopupDialog';

const CHANNELS = [
  { id: 'general', name: 'general', desc: 'All project team discussions' },
  { id: 'dev-engineers', name: 'dev-engineers', desc: 'Code architecture, terminal runs & algorithms' },
  { id: 'design-team', name: 'design-team', desc: 'UI/UX mockups, wireframes & assets' },
  { id: 'announcements', name: 'announcements', desc: 'Milestone deadlines & project alerts' }
];

const EMOJI_OPTIONS = ['👍', '❤️', '🚀', '🔥', '💡', '👀', '🎉'];

export default function WorkspaceChat({
  workspace,
  chatMessages = [],
  currentUser,
  onSendMessage,
  onDeleteMessage,
  onClearAllMessages,
  onReactMessage,
  onOpenInTerminal
}) {
  const { showConfirm, showAlert } = usePopup();
  const [activeChannel, setActiveChannel] = useState('general');
  const [messageText, setMessageText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [codeSnippet, setCodeSnippet] = useState({ title: 'script.js', language: 'javascript', code: '' });
  const [copiedId, setCopiedId] = useState(null);
  const [showEmojiPickerFor, setShowEmojiPickerFor] = useState(null);

  const messagesEndRef = useRef(null);
  const chatInputRef = useRef(null);
  const viewportRef = useRef(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const wsMessages = chatMessages.filter(
    m => m.workspaceId === workspace.id && (m.channel === activeChannel || (!m.channel && activeChannel === 'general'))
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [wsMessages.length, activeChannel]);

  const handleViewportScroll = () => {
    if (!viewportRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
    setShowScrollTop(scrollTop > 150);
    setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 150);
  };

  const scrollToTop = () => {
    viewportRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = (e) => {
    e?.preventDefault();
    const trimmed = messageText.trim();
    if (!trimmed && !codeSnippet.code) return;

    // Chat rule: Message character limit (1000 chars)
    if (trimmed.length > 1000) {
      showAlert(`Messages cannot exceed 1,000 characters (currently ${trimmed.length} characters). Please shorten your message.`, 'Message Too Long', 'warning');
      return;
    }

    const newMsg = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      workspaceId: workspace.id,
      channel: activeChannel,
      senderId: currentUser?.username || 'user',
      senderName: currentUser?.name || currentUser?.username || 'CurrentUser',
      senderAvatar: (currentUser?.name || currentUser?.username || 'CU').substring(0, 2).toUpperCase(),
      senderRole: (workspace.members || []).find(m => m.userId === currentUser?.username)?.role || (workspace.ownerId === currentUser?.username ? 'Lead' : 'Contributor'),
      content: trimmed,
      message: trimmed,
      timestamp: new Date().toISOString(),
      reactions: {},
      ...(replyingTo ? { replyTo: { senderName: replyingTo.senderName, text: (replyingTo.content || replyingTo.message || '').substring(0, 70) } } : {}),
      ...(codeSnippet.code ? { codeSnippet: { ...codeSnippet } } : {})
    };

    onSendMessage(newMsg);
    setMessageText('');
    setReplyingTo(null);
    setCodeSnippet({ title: 'script.js', language: 'javascript', code: '' });
    setShowCodeModal(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleScrollCode = (preId, direction) => {
    const el = document.getElementById(preId);
    if (!el) return;

    if (direction === 'up') {
      el.scrollBy({ top: -220, behavior: 'smooth' });
    } else if (direction === 'down') {
      el.scrollBy({ top: 220, behavior: 'smooth' });
    } else if (direction === 'top') {
      el.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (direction === 'bottom') {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    } else if (direction === 'left') {
      el.scrollBy({ left: -180, behavior: 'smooth' });
    } else if (direction === 'right') {
      el.scrollBy({ left: 180, behavior: 'smooth' });
    }
  };

  return (
    <div className="workspace-chat-container glass-panel">
      {/* Sidebar: Channels & Workspace Members */}
      <div className="workspace-chat-sidebar">
        <div className="chat-sidebar-section">
          <div className="chat-section-title">
            <Hash size={14} /> CHANNELS
          </div>
          <div className="chat-channels-list">
            {CHANNELS.map(ch => (
              <button
                key={ch.id}
                className={`chat-channel-btn ${activeChannel === ch.id ? 'active' : ''}`}
                onClick={() => setActiveChannel(ch.id)}
              >
                <span className="channel-hash">#</span>
                <span className="channel-name">{ch.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="chat-sidebar-section team-section">
          <div className="chat-section-title">
            <Users size={14} /> TEAM ONLINE ({(workspace.members || []).length})
          </div>
          <div className="chat-members-list">
            {(workspace.members || []).map((m, idx) => (
              <div key={idx} className="chat-member-item">
                <div className="chat-member-avatar-wrap">
                  <div className="chat-member-avatar">{m.avatar || m.name?.substring(0, 2)}</div>
                  <span className="online-dot" />
                </div>
                <div className="chat-member-details">
                  <div className="chat-member-name">{m.name}</div>
                  <div className="chat-member-role">{m.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Stream */}
      <div className="workspace-chat-main">
        {/* Chat Header */}
        <div className="chat-header-bar">
          <div className="chat-header-left">
            <div className="chat-channel-badge">
              <Hash size={18} />
              <span>{activeChannel}</span>
            </div>
            <span className="chat-channel-desc">
              {CHANNELS.find(c => c.id === activeChannel)?.desc}
            </span>
          </div>
          <div className="chat-header-right">
            <span className="chat-sync-badge">
              <Sparkles size={13} /> <span className="sync-text">Live Broadcast Synced</span>
            </span>
            {onClearAllMessages && wsMessages.length > 0 && (
              <button
                type="button"
                className="chat-clear-channel-btn"
                title={`Clear all messages in #${activeChannel}`}
                onClick={async () => {
                  const confirmed = await showConfirm(
                    `Are you sure you want to clear all ${wsMessages.length} messages in #${activeChannel}? This action cannot be undone.`,
                    `Clear #${activeChannel} History`,
                    { isDanger: true, confirmText: 'Yes, Clear All' }
                  );
                  if (confirmed) {
                    onClearAllMessages(workspace.id, activeChannel);
                  }
                }}
              >
                <Trash2 size={13} />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Message Timeline */}
        <div ref={viewportRef} onScroll={handleViewportScroll} className="chat-messages-viewport">
          {wsMessages.length === 0 ? (
            <div className="chat-empty-state">
              <MessageSquare size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto' }} />
              <h4>Welcome to #{activeChannel}!</h4>
              <p>This is the start of the #{activeChannel} discussion for {workspace.name}.</p>
            </div>
          ) : (
            wsMessages.map(msg => {
              const isMe = msg.senderId === currentUser?.username;
              const canDelete = isMe || currentUser?.role === 'admin' || workspace?.ownerId === currentUser?.username;
              return (
                <div key={msg.id} className={`chat-message-row ${isMe ? 'mine' : ''}`}>
                  <div className="chat-avatar">{msg.senderAvatar || 'US'}</div>
                  <div className="chat-bubble-wrap">
                    {/* Header: Sender name, role, time */}
                    <div className="chat-bubble-header">
                      <span className="chat-sender-name">{msg.senderName}</span>
                      <span className={`chat-role-pill ${msg.senderRole?.toLowerCase()}`}>
                        {msg.senderRole}
                      </span>
                      <span className="chat-time">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Quoted reply if any */}
                    {msg.replyTo && (
                      <div className="chat-reply-quote">
                        <div className="reply-quote-sender">Replying to {msg.replyTo.senderName}:</div>
                        <div className="reply-quote-text">"{msg.replyTo.text}"</div>
                      </div>
                    )}

                    {/* Message Body */}
                    {(msg.content || msg.message) && (
                      <div className="chat-bubble-content">
                        {msg.content || msg.message}
                      </div>
                    )}

                    {/* Code Snippet Card */}
                    {msg.codeSnippet && (
                      <div className="chat-code-card">
                        <div className="chat-code-header">
                          <div className="chat-code-meta">
                            <Code2 size={15} color="#818cf8" />
                            <span>{msg.codeSnippet.title || 'snippet.js'}</span>
                            <span className="code-lang-tag">{msg.codeSnippet.language || 'javascript'}</span>
                          </div>
                          <div className="chat-code-actions">
                            <button
                              className="chat-code-btn"
                              title="Copy code"
                              onClick={() => copyCode(msg.codeSnippet.code, msg.id)}
                            >
                              {copiedId === msg.id ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                              <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                            </button>
                            {onOpenInTerminal && (
                              <button
                                className="chat-code-btn highlight"
                                title="Run in Workspace Terminal"
                                onClick={() => onOpenInTerminal(msg.codeSnippet)}
                              >
                                <Terminal size={13} />
                                <span>Run in Terminal</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <pre id={`code-pre-${msg.id}`} className="chat-code-pre">
                          <code>{msg.codeSnippet.code}</code>
                        </pre>

                        {/* Scroll Controller for Easy Mobile & Desktop Navigation */}
                        <div className="chat-code-scroll-bar">
                          <span className="code-scroll-label">Scroll:</span>
                          <div className="code-scroll-btns-group">
                            <button
                              type="button"
                              className="code-scroll-btn primary-scroll-btn"
                              onClick={() => handleScrollCode(`code-pre-${msg.id}`, 'up')}
                              title="Scroll Code Up"
                            >
                              <ChevronUp size={15} /> <span>Up</span>
                            </button>
                            <button
                              type="button"
                              className="code-scroll-btn primary-scroll-btn"
                              onClick={() => handleScrollCode(`code-pre-${msg.id}`, 'down')}
                              title="Scroll Code Down"
                            >
                              <ChevronDown size={15} /> <span>Down</span>
                            </button>
                            <button
                              type="button"
                              className="code-scroll-btn"
                              onClick={() => handleScrollCode(`code-pre-${msg.id}`, 'top')}
                              title="Jump to Top"
                            >
                              <ChevronsUp size={14} /> <span>Top</span>
                            </button>
                            <button
                              type="button"
                              className="code-scroll-btn"
                              onClick={() => handleScrollCode(`code-pre-${msg.id}`, 'bottom')}
                              title="Jump to Bottom"
                            >
                              <ChevronsDown size={14} /> <span>Bottom</span>
                            </button>
                            <button
                              type="button"
                              className="code-scroll-btn"
                              onClick={() => handleScrollCode(`code-pre-${msg.id}`, 'left')}
                              title="Scroll Code Left"
                            >
                              <ChevronLeft size={14} /> <span>Left</span>
                            </button>
                            <button
                              type="button"
                              className="code-scroll-btn"
                              onClick={() => handleScrollCode(`code-pre-${msg.id}`, 'right')}
                              title="Scroll Code Right"
                            >
                              <ChevronRight size={14} /> <span>Right</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Message Reactions & Actions */}
                    <div className="chat-message-footer">
                      {/* Reaction Pills */}
                      <div className="chat-reactions-pills">
                        {Object.entries(msg.reactions || {}).map(([emoji, userList]) => {
                          if (!userList || userList.length === 0) return null;
                          const hasReacted = userList.includes(currentUser?.username);
                          return (
                            <button
                              key={emoji}
                              className={`reaction-badge ${hasReacted ? 'active' : ''}`}
                              onClick={() => onReactMessage(msg.id, emoji)}
                              title={userList.join(', ')}
                            >
                              <span>{emoji}</span>
                              <span className="reaction-count">{userList.length}</span>
                            </button>
                          );
                        })}

                        {/* Add reaction trigger */}
                        <div className="add-reaction-trigger-wrap">
                          <button
                            className="add-reaction-btn"
                            onClick={() => setShowEmojiPickerFor(showEmojiPickerFor === msg.id ? null : msg.id)}
                            title="Add reaction"
                          >
                            <Smile size={13} />
                          </button>
                          {showEmojiPickerFor === msg.id && (
                            <div className="mini-emoji-picker">
                              {EMOJI_OPTIONS.map(em => (
                                <button
                                  key={em}
                                  className="mini-emoji-btn"
                                  onClick={() => {
                                    onReactMessage(msg.id, em);
                                    setShowEmojiPickerFor(null);
                                  }}
                                >
                                  {em}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Actions */}
                      <div className="chat-message-actions">
                        {/* Reply button */}
                        <button
                          type="button"
                          className="chat-action-text-btn"
                          onClick={() => {
                            setReplyingTo(msg);
                            chatInputRef.current?.focus();
                          }}
                          title="Reply to message"
                        >
                          <Reply size={12} /> <span>Reply</span>
                        </button>

                        {/* Delete single message */}
                        {canDelete && onDeleteMessage && (
                          <button
                            type="button"
                            className="chat-action-text-btn chat-delete-msg-btn"
                            onClick={async () => {
                              const confirmed = await showConfirm(
                                'Are you sure you want to delete this message?',
                                'Delete Message',
                                { isDanger: true, confirmText: 'Yes, Delete' }
                              );
                              if (confirmed) {
                                onDeleteMessage(msg.id);
                              }
                            }}
                            title="Delete this message"
                          >
                            <Trash2 size={12} /> <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} style={{ height: '24px', flexShrink: 0 }} />
        </div>

        {/* Floating Quick Scroll Navigation for Timeline */}
        {(showScrollTop || showScrollBottom) && (
          <div className="chat-floating-scroll-nav">
            {showScrollTop && (
              <button
                type="button"
                className="chat-floating-btn"
                onClick={scrollToTop}
                title="Scroll to Top of Messages"
              >
                <ChevronsUp size={16} />
              </button>
            )}
            {showScrollBottom && (
              <button
                type="button"
                className="chat-floating-btn"
                onClick={scrollToBottom}
                title="Scroll to Latest Messages"
              >
                <ChevronsDown size={16} />
              </button>
            )}
          </div>
        )}

        {/* Replying banner */}
        {replyingTo && (
          <div className="chat-replying-banner">
            <div className="replying-banner-text">
              <Reply size={14} /> Replying to <strong>{replyingTo.senderName}</strong>: {replyingTo.content?.substring(0, 60)}...
            </div>
            <button className="replying-cancel-btn" onClick={() => setReplyingTo(null)}>✕</button>
          </div>
        )}

        {/* Code Snippet Attachment Preview */}
        {codeSnippet.code && (
          <div className="chat-code-attach-preview">
            <div className="attach-preview-header">
              <span>Code Snippet to attach: <strong>{codeSnippet.title}</strong></span>
              <button onClick={() => setCodeSnippet({ title: 'script.js', language: 'javascript', code: '' })}>✕ Remove</button>
            </div>
            <pre className="attach-preview-code">{codeSnippet.code.substring(0, 120)}...</pre>
          </div>
        )}

        {/* Message Input Box */}
        <form className="chat-composer-form" onSubmit={handleSend}>
          <div className="chat-composer-inner">
            <textarea
              ref={chatInputRef}
              className="chat-textarea"
              placeholder={`Message #${activeChannel}... (Enter to send, Shift+Enter for newline)`}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
            />

            <div className="chat-composer-toolbar">
              <div className="chat-toolbar-left">
                <button
                  type="button"
                  className={`chat-tool-btn ${codeSnippet.code ? 'active' : ''}`}
                  onClick={() => setShowCodeModal(true)}
                  title="Share Code Snippet"
                >
                  <Code2 size={16} /> <span>Code</span>
                </button>
                <button
                  type="button"
                  className="chat-tool-btn"
                  onClick={() => setMessageText(prev => `${prev} @`)}
                  title="Mention someone"
                >
                  <Users size={16} /> <span>@Mention</span>
                </button>
              </div>

              <div className="chat-toolbar-right">
                <button
                  type="submit"
                  className="primary-btn chat-send-btn"
                  disabled={!messageText.trim() && !codeSnippet.code}
                >
                  <Send size={15} /> <span>Send</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Code Snippet Modal */}
      {showCodeModal && (
        <div className="modal-overlay" onClick={() => setShowCodeModal(false)}>
          <div className="modal-content glass-panel" style={{ maxWidth: '640px', width: '94%' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div className="modal-title-wrap" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Code2 size={22} color="var(--accent-primary)" />
                <h3 className="modal-title" style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>
                  Share Code Snippet in #{activeChannel}
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowCodeModal(false)} title="Close">✕</button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Pin size={14} /> Snippet File Name
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. app_logic.js"
                    value={codeSnippet.title}
                    onChange={e => setCodeSnippet({ ...codeSnippet, title: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    <Code2 size={14} /> Language
                  </label>
                  <select
                    className="form-control"
                    value={codeSnippet.language}
                    onChange={e => setCodeSnippet({ ...codeSnippet, language: e.target.value })}
                  >
                    <option value="javascript">JavaScript / Node</option>
                    <option value="python">Python</option>
                    <option value="html">HTML / CSS</option>
                    <option value="sql">SQL</option>
                    <option value="bash">Bash / Shell</option>
                    <option value="java">Java</option>
                    <option value="cpp">C / C++</option>
                    <option value="json">JSON</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <Terminal size={14} /> Source Code
                </label>
                <textarea
                  className="form-control"
                  style={{ 
                    fontFamily: '"Fira Code", "Courier New", monospace', 
                    fontSize: '0.88rem', 
                    height: '200px',
                    minHeight: '160px',
                    maxHeight: '300px',
                    lineHeight: '1.5',
                    resize: 'vertical'
                  }}
                  placeholder="// Paste your source code here..."
                  value={codeSnippet.code}
                  onChange={e => setCodeSnippet({ ...codeSnippet, code: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem', borderTop: '1px solid var(--divider-color)', paddingTop: '1.25rem', marginTop: '1.25rem' }}>
              <button type="button" className="secondary-btn" onClick={() => setShowCodeModal(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="primary-btn"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                disabled={!codeSnippet.code.trim()}
                onClick={() => setShowCodeModal(false)}
              >
                <Sparkles size={16} /> Attach Snippet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
