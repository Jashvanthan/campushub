import React, { useState, useEffect } from 'react';
import {
  Code2, User, Shield, Mail, Eye, EyeOff, Sparkles, Search,
  LogIn, UserPlus, KeyRound, CheckCircle2, AlertCircle, Users
} from 'lucide-react';

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
 * LoginPage - Exact 1:1 recovered high-fidelity cinematic login interface
 * from CampusHub live application (https://campushub-30e98.web.app/)
 */
export default function LoginPage({ onLogin, onRegister, onForgotPassword, onResetPassword, users, onPlayIntro }) {
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
            setSuccessMsg(res.message || `Verification code sent to registered email for ${u}.`);
            setForgotStep(2);
          } else {
            setError(res?.message || 'User does not exist. Please check your username or register a new account.');
          }
        } else {
          if (users?.[u]) {
            setSuccessMsg(`Verification code sent to email associated with ${u}.`);
            setForgotStep(2);
          } else {
            setError('User does not exist. Please check your username or register a new account.');
          }
        }
      } else {
        // Step 2: Validate new password
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
          const res = await onResetPassword(u, newPassword, resetCode);
          if (res && res.success) {
            setSuccessMsg('Password has been reset successfully! You can now sign in.');
            setAuthMode('login');
            setForgotStep(1);
            setPassword('');
            setNewPassword('');
            setConfirmPassword('');
          } else {
            setError(res?.message || 'Password reset failed. Please try again.');
          }
        } else {
          setSuccessMsg('Password has been reset successfully! You can now sign in.');
          setAuthMode('login');
          setForgotStep(1);
        }
      }
    } else {
      // Login
      if (!password) {
        setError('Please enter your password.');
        setLoading(false);
        return;
      }

      await new Promise((r) => setTimeout(r, 450));
      const usr = users?.[u];
      if (!usr) {
        setError('User does not exist. Please check your username or register a new account.');
        setLoading(false);
        return;
      }

      // Check password (plain or SHA-256 hash)
      let ok = false;
      if (/^[a-f0-9]{64}$/.test(usr.password)) {
        const enc = new TextEncoder().encode(password);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        const hash = Array.from(new Uint8Array(buf))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        ok = hash === usr.password;
      } else {
        ok = usr.password === password;
      }

      if (ok) {
        onLogin({
          username: u,
          role: usr.role,
          avatar: usr.avatar,
        });
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
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => onLogin({ username: 'guest', role: 'guest' })}
            style={{
              color: '#fff',
              fontSize: '0.88rem',
              fontWeight: 700,
              opacity: 0.9,
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              background: 'rgba(255,255,255,0.08)',
              padding: '0.55rem 1.2rem',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
            onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
          >
            <Users size={16} /> Guest Access
          </button>
          <div style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.15)' }} className="nav-divider" />
          <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }} className="nav-label">
            Campus Collaboration Platform
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1.2rem', alignItems: 'center', position: 'relative' }}>
          {onPlayIntro && (
            <button
              type="button"
              onClick={onPlayIntro}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'rgba(249, 115, 22, 0.15)',
                border: '1px solid rgba(249, 115, 22, 0.4)',
                borderRadius: '999px',
                padding: '0.45rem 1rem',
                color: '#fbbf24',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = 'rgba(249, 115, 22, 0.25)')}
              onMouseOut={(e) => (e.currentTarget.style.background = 'rgba(249, 115, 22, 0.15)')}
              title="Replay Intro"
            >
              <Sparkles size={14} /> Replay Intro
            </button>
          )}

          {/* Search channel container */}
          <div
            className="search-container"
            style={{ position: 'relative', width: '240px' }}
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
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '0.55rem 1rem 0.55rem 2.4rem',
                color: '#fff',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'rgba(255,255,255,0.4)',
              }}
            />

            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div
                className="glass-panel"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '280px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  padding: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(10, 15, 30, 0.95)',
                  backdropFilter: 'blur(20px)',
                  borderRadius: '14px',
                  zIndex: 100,
                  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                }}
              >
                {sampleChannels.length > 0 ? (
                  sampleChannels.map((ch, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '0.6rem 0.75rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.04)',
                        marginBottom: '0.35rem',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setShowSearchDropdown(false);
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{ch.name}</span>
                        <span style={{ fontSize: '0.65rem', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                          {ch.category}
                        </span>
                      </div>
                      <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.4)' }}>
                        {ch.users} students active
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ textAlign: 'center', padding: '0.75rem', color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
              <div
                style={{
                  background: 'linear-gradient(135deg, #f97316, #ea580c)',
                  borderRadius: '16px',
                  width: '46px',
                  height: '46px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
                }}
              >
                <Code2 size={26} color="#fff" />
              </div>
              <span style={{ color: '#fff', fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                CampusHub
              </span>
            </div>

            {/* Illuminated Header */}
            <h1 className="illuminated-text">
              <span>Welcome</span>
              <br />
              <span className="highlight-span">To CampusHub</span>
            </h1>

            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.05rem', maxWidth: '440px', lineHeight: 1.6, marginBottom: '2rem' }}>
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
                <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
                  {authMode === 'forgot' ? 'Username or Registered Email' : 'Username'}
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '1.2rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
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
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1.2rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255,255,255,0.35)',
                      }}
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
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
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
                    />
                  </div>
                </div>
              </>
            )}

            {/* Password Field (for Login & Register) */}
            {authMode !== 'forgot' && (
              <div className="input-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', fontWeight: 600 }}>
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
                      style={{
                        fontSize: '0.78rem',
                        color: '#f97316',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div style={{ position: 'relative' }}>
                  <Shield
                    size={18}
                    style={{
                      position: 'absolute',
                      left: '1.2rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'rgba(255,255,255,0.35)',
                    }}
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
                    style={{
                      position: 'absolute',
                      right: '1.2rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'rgba(255,255,255,0.4)',
                    }}
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
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
                    Verification Code (OTP)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1.2rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255,255,255,0.35)',
                      }}
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
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
                    New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Shield
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1.2rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255,255,255,0.35)',
                      }}
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
                      style={{
                        position: 'absolute',
                        right: '1.2rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="input-container">
                  <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.82rem', marginBottom: '0.4rem', display: 'block', fontWeight: 600 }}>
                    Confirm New Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Shield
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '1.2rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'rgba(255,255,255,0.35)',
                      }}
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
          <div style={{ textAlign: 'center', fontSize: '0.88rem', color: 'rgba(255,255,255,0.65)' }}>
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
                  style={{
                    color: '#f97316',
                    fontWeight: 700,
                    marginLeft: '0.35rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
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
                  style={{
                    color: '#f97316',
                    fontWeight: 700,
                    marginLeft: '0.35rem',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
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


