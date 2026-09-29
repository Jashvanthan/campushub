import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Loader2, User as UserIcon, FileText, Sparkles, Tag, ChevronRight, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';
import { renderAvatarContent } from '../../App';

export default function SearchPage({
  initialQuery = '',
  onQueryChange,
  currentUser,
  isAdmin,
  isAuthenticated,
  users = {},
  localPosts = [],
  renderPostCard,
  onOpenUserProfile
}) {
  const [query, setQuery] = useState(initialQuery || '');
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'users', 'posts'
  const [postResults, setPostResults] = useState([]);
  const [userResults, setUserResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(Boolean(initialQuery));
  const [error, setError] = useState(null);
  
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  // Sync with prop if initialQuery changes from outside (e.g. browser back/forward or navbar input)
  useEffect(() => {
    if (initialQuery !== query) {
      setQuery(initialQuery || '');
      setDebouncedQuery(initialQuery || '');
      if (initialQuery) {
        setHasSearched(true);
      }
    }
  }, [initialQuery]);

  // Handle Debounced Query update (350ms)
  const handleInputChange = (e) => {
    const val = e.target.value;
    setQuery(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const clean = val.trim();
      setDebouncedQuery(clean);
      if (onQueryChange) {
        onQueryChange(clean);
      }
    }, 350);
  };

  const handleClear = () => {
    setQuery('');
    setDebouncedQuery('');
    setPostResults([]);
    setUserResults([]);
    setHasSearched(false);
    setError(null);
    if (onQueryChange) {
      onQueryChange('');
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Execute Search against backend API with local fallback
  const performSearch = useCallback(async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) {
      setPostResults([]);
      setUserResults([]);
      setLoading(false);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await api.search(searchQuery.trim(), 30);
      if (res && res.success) {
        setPostResults(res.posts || []);
        setUserResults(res.users || []);
      } else {
        throw new Error('API search returned unsuccessful status');
      }
    } catch (err) {
      console.warn('API Search failed or offline, applying client-side fallback:', err);
      // Client-side fallback using available local state
      const qLower = searchQuery.toLowerCase().trim();
      const words = qLower.split(/\s+/).filter(Boolean);

      // Filter local posts
      const matchedPosts = (localPosts || []).filter(p => {
        const title = (p.title || '').toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const tags = Array.isArray(p.tags) ? p.tags.map(t => String(t).toLowerCase()) : [];
        const author = (p.author?.name || p.authorId || '').toLowerCase();

        return words.every(w =>
          title.includes(w) ||
          desc.includes(w) ||
          author.includes(w) ||
          tags.some(t => t.includes(w))
        );
      });

      // Filter local users
      const userList = Object.entries(users || {}).map(([uname, u]) => ({
        ...u,
        username: uname,
        name: u.name || uname,
        major: u.major || '',
        bio: u.bio || '',
        skills: u.skills || []
      }));

      const matchedUsers = userList.filter(u => {
        const uname = (u.username || '').toLowerCase();
        const name = (u.name || '').toLowerCase();
        const major = (u.major || '').toLowerCase();
        const skills = Array.isArray(u.skills) ? u.skills.map(s => String(s).toLowerCase()) : [];

        return words.every(w =>
          uname.includes(w) ||
          name.includes(w) ||
          major.includes(w) ||
          skills.some(s => s.includes(w))
        );
      });

      setPostResults(matchedPosts);
      setUserResults(matchedUsers);
    } finally {
      setLoading(false);
    }
  }, [localPosts, users]);

  // Trigger search when debouncedQuery changes
  useEffect(() => {
    if (debouncedQuery) {
      performSearch(debouncedQuery);
    } else {
      setPostResults([]);
      setUserResults([]);
      setLoading(false);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [debouncedQuery, performSearch]);

  const quickSearchTags = [
    'AI attendance',
    'React',
    'Python',
    'Hackathon',
    'IoT',
    'Machine Learning',
    'Computer Vision',
    'Web Development'
  ];

  const filteredPostsCount = postResults.length;
  const filteredUsersCount = userResults.length;
  const totalCount = filteredPostsCount + filteredUsersCount;

  return (
    <div className="search-page-container" style={{ width: '100%', maxWidth: '940px', margin: '0 auto', paddingBottom: '3rem' }}>
      {/* Search Header Banner */}
      <div className="glass-panel" style={{ padding: '1.75rem 2rem', marginBottom: '1.5rem', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(99, 102, 241, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-primary)' }}>
            <Search size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
              CampusHub Search
            </h1>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Find projects, campus events, ideas, discussions, and student innovators
            </p>
          </div>
        </div>

        {/* Search Bar Input */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          background: 'rgba(255, 255, 255, 0.05)',
          border: '1.5px solid var(--border-color)',
          borderRadius: '12px',
          padding: '0.65rem 1rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          transition: 'border-color 0.2s, box-shadow 0.2s'
        }}>
          <Search size={20} color="var(--accent-primary)" style={{ flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            className="search-main-input"
            value={query}
            onChange={handleInputChange}
            placeholder="Search posts, users..."
            autoFocus
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: 'var(--text-primary)',
              fontSize: '1.05rem',
              fontWeight: 500
            }}
          />

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent-primary)', fontSize: '0.82rem', fontWeight: 600 }}>
              <Loader2 size={18} className="animate-spin" />
              <span>Searching...</span>
            </div>
          )}

          {query && !loading && (
            <button
              type="button"
              className="icon-btn"
              onClick={handleClear}
              title="Clear search"
              style={{ padding: '4px', color: 'var(--text-muted)' }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Popular / Suggested Search Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Popular Topics:
          </span>
          {quickSearchTags.map(tag => {
            const isActive = query.toLowerCase() === tag.toLowerCase();
            return (
              <button
                key={tag}
                type="button"
                className={`search-topic-chip ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setQuery(tag);
                  setDebouncedQuery(tag);
                  if (onQueryChange) onQueryChange(tag);
                }}
              >
                #{tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter Tabs & Results Count */}
      {hasSearched && debouncedQuery && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="button"
              className={`role-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActiveFilter('all')}
            >
              All Results ({totalCount})
            </button>
            <button
              type="button"
              className={`role-filter-btn ${activeFilter === 'users' ? 'active' : ''}`}
              onClick={() => setActiveFilter('users')}
            >
              Users ({filteredUsersCount})
            </button>
            <button
              type="button"
              className={`role-filter-btn ${activeFilter === 'posts' ? 'active' : ''}`}
              onClick={() => setActiveFilter('posts')}
            >
              Posts ({filteredPostsCount})
            </button>
          </div>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Results for <strong style={{ color: 'var(--text-primary)' }}>"{debouncedQuery}"</strong>
          </span>
        </div>
      )}

      {/* Initial Landing State (No query entered) */}
      {!hasSearched && !debouncedQuery && (
        <div className="glass-panel" style={{ padding: '3.5rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
            <Sparkles size={32} />
          </div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Search across the campus community
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.5rem auto' }}>
            Find projects, student profiles, upcoming events, and collaboration opportunities in one unified search.
          </p>
        </div>
      )}

      {/* Zero Total Results */}
      {hasSearched && !loading && debouncedQuery && totalCount === 0 && (
        <div className="glass-panel" style={{ padding: '3rem 2rem', textAlign: 'center', borderRadius: '16px' }}>
          <Search size={40} color="var(--text-muted)" style={{ margin: '0 auto 1rem auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            No results found for "{debouncedQuery}"
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto' }}>
            Try checking for typos, using broader keywords, or searching by author, topic, or department.
          </p>
        </div>
      )}

      {/* Search Results Display */}
      {hasSearched && !loading && totalCount > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          {/* ──────────────── USERS SECTION ──────────────── */}
          {(activeFilter === 'all' || activeFilter === 'users') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  <UserIcon size={20} color="var(--accent-primary)" />
                  <span>Users</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px' }}>
                    {filteredUsersCount}
                  </span>
                </div>
              </div>

              {filteredUsersCount === 0 ? (
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', borderRadius: '12px' }}>
                  No users found
                </div>
              ) : (
                <div className="responsive-grid grid-2" style={{ gap: '1rem' }}>
                  {userResults.map(u => {
                    const avatarContent = renderAvatarContent(
                      u.avatar,
                      u.name,
                      u.username,
                      (u.name || u.username || 'U').slice(0, 2).toUpperCase()
                    );

                    return (
                      <div
                        key={u.username || u.id}
                        className="glass-panel hover-bg"
                        style={{
                          padding: '1.1rem',
                          borderRadius: '12px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '1rem',
                          cursor: 'pointer',
                          transition: 'transform 0.15s ease, border-color 0.15s ease'
                        }}
                        onClick={() => onOpenUserProfile && onOpenUserProfile(u.username, { name: u.name || u.username, avatar: u.avatar })}
                        title={`View ${u.name || u.username}'s profile`}
                      >
                        <div
                          className="post-avatar"
                          style={{
                            width: '46px',
                            height: '46px',
                            fontSize: '1rem',
                            flexShrink: 0,
                            border: u.role === 'admin' ? '2px solid #a78bfa' : '2px solid var(--accent-primary)'
                          }}
                        >
                          {avatarContent}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {u.name || u.username}
                            </h4>
                            <span className={`admin-role-badge role-${u.role || 'student'}`} style={{ fontSize: '0.68rem', padding: '1px 6px', textTransform: 'capitalize' }}>
                              {u.role || 'Student'}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: 600, marginTop: '2px' }}>
                            @{u.username}
                          </div>

                          {u.major && (
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              🎓 {u.major} {u.institution ? `• ${u.institution}` : ''}
                            </div>
                          )}

                          {u.skills && Array.isArray(u.skills) && u.skills.length > 0 && (
                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                              {u.skills.slice(0, 3).map((sk, idx) => (
                                <span
                                  key={idx}
                                  style={{
                                    fontSize: '0.68rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-muted)',
                                    padding: '1px 6px',
                                    borderRadius: '4px',
                                    border: '1px solid rgba(255, 255, 255, 0.08)'
                                  }}
                                >
                                  {sk}
                                </span>
                              ))}
                              {u.skills.length > 3 && (
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  +{u.skills.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <ChevronRight size={18} color="var(--text-muted)" style={{ alignSelf: 'center', opacity: 0.6 }} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ──────────────── POSTS SECTION ──────────────── */}
          {(activeFilter === 'all' || activeFilter === 'posts') && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', paddingBottom: '0.5rem', borderBottom: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
                  <FileText size={20} color="var(--accent-primary)" />
                  <span>Posts &amp; Projects</span>
                  <span style={{ fontSize: '0.8rem', background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)', padding: '2px 8px', borderRadius: '12px' }}>
                    {filteredPostsCount}
                  </span>
                </div>
              </div>

              {filteredPostsCount === 0 ? (
                <div className="glass-panel" style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', borderRadius: '12px' }}>
                  No posts found
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  {postResults.map((post) => (
                    <div key={post.id}>
                      {renderPostCard ? (
                        renderPostCard(post)
                      ) : (
                        <div className="post-card glass-panel">
                          <h3>{post.title}</h3>
                          <p>{post.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
}
