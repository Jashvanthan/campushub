import React, { useState, useEffect } from 'react';
import {
  Code2, User, Shield, Mail, Eye, EyeOff, Sparkles, Search,
  LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle, Users,
  Sun, Moon
} from 'lucide-react';
import { api } from '../services/api';

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
    label: ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'][s],
    color: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'][s],
  };
}

/**
 * LoginPage - Cinematic responsive login portal with full Light & Dark mode support
 */
export default function LoginPage({ onLogin, onRegister, onForgotPassword, onResetPassword, users, onPlayIntro, theme = 'dark', onToggleTheme }) {
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [forgotStep, setForgotStep] = useState(1); // 1 = enter username, 2 = enter code & new pw
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search in login-nav
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // 3D Card Mouse Tilt
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setTilt({
      x: (clientX / innerWidth - 0.5),
      y: (clientY / innerHeight - 0.5),
    });
  };

  const handleResetTilt = () => {
    setTilt({ x: 0, y: 0 });
  };

  const strength = (authMode === 'register' && password) || (authMode === 'forgot' && forgotStep === 2 && newPassword) 
    ? passwordStrength(authMode === 'register' ? password : newPassword) 
    : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    const u = username.trim().toLowerCase();

    if (!u) {
      setError('Please enter your username.');
      setLoading(false);
      return;
    }

    if (authMode === 'register') {
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        setError('Please enter a valid email address.');
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError('Password must be at least 8 characters long.');
        setLoading(false);
        return;
      }
      if (!/[A-Z]/.test(password)) {
        setError('Password must contain at least one uppercase letter (A-Z).');
        setLoading(false);
        return;
      }
      if (!/[0-9]/.test(password)) {
        setError('Password must contain at least one number (0-9).');
        setLoading(false);
        return;
      }

      const res = await onRegister(u, password, email.trim());
      if (res.success) {
        setSuccessMsg(`Account created successfully for ${u}. You can now sign in.`);
        setAuthMode('login');
      } else {
        setError(res.message || 'Registration failed. Please try a different username.');
      }
    } else if (authMode === 'forgot') {
      if (forgotStep === 1) {
        if (onForgotPassword) {
          const res = await onForgotPassword(u);
          if (res && res.success) {
            if (res.simulatedCode) {
              setSuccessMsg(`Verification code sent to ${res.username || u}'s email! (Dev Code: ${res.simulatedCode})`);
              setResetCode(res.simulatedCode);
            } else {
              setSuccessMsg(res.message || `Verification code sent to registered email for ${u}. Please check your inbox.`);
            }
            setForgotStep(2);
          } else {
            setError(res?.message || 'User does not exist. Please check your username or register a new account.');
          }
        } else {
          if (users?.[u]) {
            const demoCode = Math.floor(100000 + Math.random() * 900000).toString();
            setSuccessMsg(`Verification code sent to email associated with ${u}. (Dev Code: ${demoCode})`);
            setResetCode(demoCode);
            setForgotStep(2);
          } else {
            setError('User does not exist. Please check your username or register a new account.');
          }
        }
      } else {
        // Step 2: Validate verification code & new password
        if (!resetCode.trim()) {
          setError('Please enter the 6-digit verification code sent to your email.');
          setLoading(false);
          return;
        }
        if (newPassword.length < 8) {
          setError('New password must be at least 8 characters long.');
          setLoading(false);
          return;
        }
        if (!/[A-Z]/.test(newPassword)) {
          setError('New password must contain at least one uppercase letter (A-Z).');
          setLoading(false);
          return;
        }
        if (!/[0-9]/.test(newPassword)) {
          setError('New password must contain at least one number (0-9).');
          setLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setError('Passwords do not match. Please re-enter.');
          setLoading(false);
          return;
        }

        if (onResetPassword) {
          const res = await onResetPassword(u, newPassword, resetCode.trim());
          if (res && res.success) {
            setSuccessMsg('Password has been reset successfully! You can now sign in with your new password.');
            setAuthMode('login');
            setForgotStep(1);
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setResetCode('');
          } else {
            setError(res?.message || 'Password reset failed. Please verify the code and try again.');
          }
        } else {
          setSuccessMsg('Password has been reset successfully! You can now sign in with your new password.');
          setAuthMode('login');
          setForgotStep(1);
          setPassword('');
          setNewPassword('');
          setConfirmPassword('');
          setResetCode('');
        }
      }
    } else {
      // Login
      if (!password) {
        setError('Please enter your password.');
        setLoading(false);
        return;
      }

      // 1. ALWAYS try backend API first to get a real JWT token
      let backendRes = null;
      try {
        backendRes = await api.login(u, password);
      } catch (_) {}

      if (backendRes && backendRes.success && backendRes.user) {
        // Backend auth successful - save JWT token and login
        if (backendRes.token) {
          localStorage.setItem('campushub_jwt_token', backendRes.token);
        }
        onLogin(backendRes.user);
        setLoading(false);
        return;
      }

      // 2. Backend unavailable or returned wrong credentials - try local auth as fallback
      let matchedKey = u;
      let usr = users?.[u];
      const cleanU = u.replace(/\s+/g, '');
      if (!usr && users) {
        const found = Object.entries(users).find(([k, v]) => 
          k.toLowerCase() === u ||
          k.toLowerCase().replace(/\s+/g, '') === cleanU ||
          k.toLowerCase().startsWith(u) ||
          (v.username && v.username.toLowerCase() === u) ||
          (v.username && v.username.toLowerCase().replace(/\s+/g, '') === cleanU) ||
          (v.username && v.username.toLowerCase().startsWith(u)) ||
          (v.email && v.email.toLowerCase() === u) ||
          (v.name && v.name.toLowerCase() === u) ||
          (v.name && v.name.toLowerCase().replace(/\s+/g, '') === cleanU) ||
          (v.name && v.name.toLowerCase().startsWith(u))
        );
        if (found) {
          matchedKey = found[0];
          usr = found[1];
        }
      }

      const effectiveUsername = (usr?.username || matchedKey || u).toLowerCase();

      let ok = false;
      if (usr) {
        if (typeof usr.password === 'string' && /^[a-f0-9]{64}$/.test(usr.password)) {
          const enc = new TextEncoder().encode(password);
          const buf = await crypto.subtle.digest('SHA-256', enc);
          const hash = Array.from(new Uint8Array(buf))
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('');
          ok = hash === usr.password;
        } else {
          ok = usr.password === password;
        }
      }

      if (ok && usr) {
        // Local auth passed!
        const backendUserNotFound = !backendRes || backendRes._httpStatus === 404 || (backendRes.message || '').toLowerCase().includes('does not exist');
        const backendWrongPassword = backendRes && backendRes._httpStatus === 401 && !backendUserNotFound;
        
        if (backendWrongPassword) {
          // Backend explicitly says wrong password for an existing user - trust it
          setError(backendRes.message || 'Incorrect password. Please verify your credentials and try again.');
          setLoading(false);
          return;
        }

        const localUserSession = {
          ...usr,
          username: effectiveUsername,
          name: usr.name || effectiveUsername,
          role: usr.role || 'student',
          email: usr.email || `${effectiveUsername}@campushub.edu`,
          avatar: usr.avatar,
          institution: usr.institution || '',
          major: usr.major || '',
          bio: usr.bio || '',
          skills: usr.skills || []
        };

        // Ensure user is registered in backend so JWT token is generated for likes/comments
        try {
          if (backendUserNotFound) {
            const regRes = await api.register({
              username: effectiveUsername,
              password: password,
              email: localUserSession.email,
              name: localUserSession.name,
              role: localUserSession.role,
              avatar: localUserSession.avatar,
              institution: localUserSession.institution,
              major: localUserSession.major,
              bio: localUserSession.bio
            });
            if (regRes && regRes.token) {
              localStorage.setItem('campushub_jwt_token', regRes.token);
            }
          }
          // Also try a fresh login if token still not set
          if (!localStorage.getItem('campushub_jwt_token')) {
            const loginRes = await api.login(effectiveUsername, password);
            if (loginRes && loginRes.token) {
              localStorage.setItem('campushub_jwt_token', loginRes.token);
            }
          }
        } catch (_) {}

        onLogin(localUserSession);
        setLoading(false);
        return;
      }

      // 3. Both backend and local auth failed - determine precise error message
      if (backendRes && backendRes._httpStatus === 401) {
        setError(backendRes.message || 'Incorrect password. Please verify your credentials and try again.');
      } else if (usr && !ok) {
        setError('Incorrect password. Please verify your credentials and try again.');
      } else if (backendRes && (backendRes.message || backendRes.error)) {
        setError(backendRes.message || backendRes.error);
      } else if (!usr) {
        setError('User does not exist. Please check your username or register a new account.');
      } else {
        setError('Incorrect password. Please verify your credentials and try again.');
      }
    }
    setLoading(false);
  };

  const sampleChannels = [
    { name: 'AI & Robotics Hub', category: 'Project', users: 142 },
    { name: 'Hackathon 2026', category: 'Event', users: 380 },
    { name: 'Open Source Guild', category: 'Community', users: 210 },
    { name: 'Campus Safety Core', category: 'Issue Tracking', users: 65 },
  ].filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      className="login-page-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleResetTilt}
      onClick={() => setShowSearchDropdown(false)}
    >
      {/* Top Fixed Login Navigation */}
      <nav className="login-nav">
        <div className="login-nav-left">
          <button
            type="button"
            onClick={() => onLogin({ username: 'guest', role: 'guest' })}
            className="login-guest-btn"
          >
            <Users size={16} /> Guest Access
          </button>
          <div className="login-nav-divider" />
          <span className="login-nav-label">
            Campus Collaboration Platform
          </span>
        </div>

        <div className="login-nav-right">
          {/* Mode Changing Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              className="login-theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <>
                  <Sun size={16} className="theme-icon-sun" />
                  <span className="theme-btn-text">Light</span>
                </>
              ) : (
                <>
                  <Moon size={16} className="theme-icon-moon" />
                  <span className="theme-btn-text">Dark</span>
                </>
              )}
            </button>
          )}

          {onPlayIntro && (
            <button
              type="button"
              onClick={onPlayIntro}
              className="login-replay-intro-btn"
              title="Replay Intro"
            >
              <Sparkles size={14} /> Replay Intro
            </button>
          )}

          {/* Search channel container */}
          <div
            className="login-search-wrapper"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onFocus={() => setShowSearchDropdown(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              className="login-search-input"
            />
            <Search
              size={15}
              className="login-search-icon"
            />

            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div
                className="login-search-dropdown"
              >
                {sampleChannels.length > 0 ? (
                  sampleChannels.map((ch, idx) => (
                    <div
                      key={idx}
                      className="login-search-item"
                      onClick={() => {
                        setShowSearchDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="search-item-name">{ch.name}</span>
                        <span className="search-item-badge">
                          {ch.category}
                        </span>
                      </div>
                      <span className="search-item-meta">
                        {ch.users} students active
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="search-empty-state">
                    No channels found.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* 3D Interactive Main Auth Card */}
      <div
        className="main-auth-card"
        style={{
          transform: `rotateX(${tilt.y * 7}deg) rotateY(${-tilt.x * 7}deg)`,
          transition: 'transform 0.12s ease-out',
        }}
      >
        {/* Left Panel: Illuminated Branding */}
        <div className="left-panel">
          <div
            style={{
              position: 'absolute',
              bottom: '-10%',
              left: 0,
              width: '320px',
              height: '400px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
              clipPath: 'path("M20,400 Q100,200 40,0 L20,0 Q80,200 0,400 Z")',
              filter: 'blur(30px)',
              opacity: 0.3,
            }}
          />

          <div style={{ transform: 'translateZ(60px)', width: '100%', position: 'relative', zIndex: 20 }}>
            {/* CampusHub Logo with Radiant Orange Badge */}
            <div className="login-brand-header">
              <div className="login-brand-icon-box">
                <Code2 size={26} color="#fff" />
              </div>
              <span className="login-brand-name">
                CampusHub
              </span>
            </div>

            {/* Illuminated Header */}
            <h1 className="illuminated-text">
              <span>Welcome</span>
              <br />
              <span className="highlight-span">To CampusHub</span>
            </h1>

            <p className="login-hero-desc">
              Connect, collaborate on projects, share campus ideas, and coordinate team workspaces in real time.
            </p>
          </div>
        </div>

        {/* Right Panel: Interactive Authentication Portal */}
        <div className="right-panel">
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 className="form-header-animated">
              {authMode === 'register' ? 'Create an Account' : authMode === 'forgot' ? 'Reset Password' : 'Sign In'}
            </h2>
            <div className="form-header-underline" />
          </div>

          {/* Error Alert */}
          {error && (
            <div
              style={{
                background: 'rgba(239,68,68,0.15)',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMsg && (
            <div
              style={{
                background: 'rgba(16,185,129,0.15)',
                border: '1px solid rgba(16,185,129,0.3)',
                color: '#34d399',
                padding: '0.85rem 1rem',
                borderRadius: '14px',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} autoComplete="off">
            {/* Username / Account Identifier Field */}
            {authMode !== 'forgot' || forgotStep === 1 ? (
              <div className="input-container">
                <label className="login-field-label">
                  {authMode === 'forgot' ? 'Username or Registered Email' : 'Username'}
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    className="login-input-icon"
                  />
                  <input
                    className="input-field"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder={authMode === 'forgot' ? 'Enter username or email' : 'Enter your username'}
                    required
                    autoComplete="username"
                  />
                </div>
              </div>
            ) : null}

            {/* Registration fields: Email & Phone */}
            {authMode === 'register' && (
              <>
                <div className="input-container">
                  <label className="login-field-label">
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      className="login-input-icon"
                    />
                    <input
                      className="input-field"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@campushub.edu"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="input-container">
                  <label className="login-field-label">
                    Phone Number (Optional)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      className="input-field"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      autoComplete="tel"
                      style={{ paddingLeft: '1.4rem' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Field (for Login & Register) */}
            {authMode !== 'forgot' && (
              <div className="input-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="login-field-label" style={{ marginBottom: 0 }}>
                    Password
                  </label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setForgotStep(1);
                        setError('');
                        setSuccessMsg('');
                      }}
                      className="login-forgot-link"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Shield
                    size={18}
                    className="login-input-icon"
                  />
                  <input
                    className="input-field"
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    autoComplete={authMode === 'register' ? 'new-password' : 'current-password'}
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="login-eye-toggle-btn"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            )}

            {/* Forgot Password Step 2 Fields */}
            {authMode === 'forgot' && forgotStep === 2 && (
              <>
                <div className="input-container">
                  <label className="login-field-label">
                    Verification Code (OTP)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={18}
                      className="login-input-icon"
                    />
                    <input
                      className="input-field"
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Enter 6-digit code"
                      autoComplete="one-time-code"
                    />
                  </div>
                </div>

                <div className="input-container">
                  <label className="login-field-label">
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Shield
                      size={18}
                      className="login-input-icon"
                    />
                    <input
                      className="input-field"
                      type={showPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter at least 8 characters"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="login-eye-toggle-btn"
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="input-container">
                  <label className="login-field-label">
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Shield
                      size={18}
                      className="login-input-icon"
                    />
                    <input
                      className="input-field"
                      type={showPw ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      autoComplete="new-password"
                      style={{ paddingRight: '3rem' }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Strength Indicator */}
            {strength && (
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: '4px',
                        borderRadius: '100px',
                        background: i < strength.score ? strength.color : 'rgba(255,255,255,0.1)',
                        transition: 'background 0.3s',
                      }}
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.75rem', color: strength.color, fontWeight: 600 }}>
                  Password Strength: {strength.label}
                </span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="auth-submit-btn"
              disabled={loading}
              style={{ marginTop: '0.5rem', marginBottom: '1.5rem' }}
            >
              {loading ? (
                authMode === 'register' ? 'Creating Account...' : authMode === 'forgot' ? (forgotStep === 1 ? 'Sending Code...' : 'Updating Password...') : 'Signing In...'
              ) : authMode === 'register' ? (
                <>
                  <UserPlus size={18} /> Create Account
                </>
              ) : authMode === 'forgot' ? (
                forgotStep === 1 ? (
                  <>
                    <KeyRound size={18} /> Send Verification Code
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Set New Password & Sign In
                  </>
                )
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </button>
          </form>

          {/* Mode Switchers */}
          <div className="login-switch-footer">
            {authMode === 'login' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="login-switch-btn"
                >
                  Create Account
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setForgotStep(1);
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="login-switch-btn"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


