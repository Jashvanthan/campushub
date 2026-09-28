import React, { useEffect } from 'react';
import {
  Lightbulb,
  Rocket,
  Calendar,
  Zap,
  Database,
  FolderGit2,
  Users,
  Code2,
  Palette,
  Share2,
  Trophy,
  UserCheck,
  Target,
  Compass,
  Bot,
  GraduationCap,
  Globe2,
  Cpu,
  FastForward,
} from 'lucide-react';

const ICON_FEATURES = [
  { icon: <Lightbulb size={20} />, label: 'Ideas' },
  { icon: <Rocket size={20} />, label: 'Launch' },
  { icon: <Calendar size={20} />, label: 'Events' },
  { icon: <Zap size={20} />, label: 'Energy' },
  { icon: <Database size={20} />, label: 'Data' },
  { icon: <FolderGit2 size={20} />, label: 'Projects' },
  { icon: <Users size={20} />, label: 'Connect' },
  { icon: <Code2 size={20} />, label: 'Code' },
  { icon: <Palette size={20} />, label: 'Design' },
  { icon: <Share2 size={20} />, label: 'Network' },
  { icon: <Trophy size={20} />, label: 'Achieve' },
  { icon: <UserCheck size={20} />, label: 'Team' },
  { icon: <Target size={20} />, label: 'Goals' },
  { icon: <Compass size={20} />, label: 'Explore' },
  { icon: <Bot size={20} />, label: 'AI' },
  { icon: <GraduationCap size={20} />, label: 'Learn' },
  { icon: <Globe2 size={20} />, label: 'Global' },
  { icon: <Cpu size={20} />, label: 'Tech' },
];

const BOX_POSITIONS = [
  { left: '5%', top: '15%' },
  { left: '18%', top: '40%' },
  { left: '8%', top: '62%' },
  { left: '22%', top: '78%' },
  { left: '40%', top: '12%' },
  { left: '55%', top: '8%' },
  { left: '75%', top: '18%' },
  { left: '88%', top: '38%' },
  { left: '82%', top: '58%' },
  { left: '70%', top: '75%' },
  { left: '48%', top: '82%' },
  { left: '30%', top: '90%' },
  { left: '12%', top: '88%' },
  { left: '92%', top: '15%' },
  { left: '60%', top: '45%' },
  { left: '25%', top: '25%' },
  { left: '78%', top: '88%' },
  { left: '35%', top: '55%' },
];

/**
 * IntroAnimation - 8.5s cinematic space odyssey introduction sequence
 * from the live CampusHub application
 */
export default function IntroAnimation({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 8800);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === ' ') {
        onComplete?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onComplete]);

  return (
    <div className="intro-container v2-moon" role="dialog" aria-label="CampusHub Intro Animation">
      {/* Skip Intro Button */}
      <button
        onClick={onComplete}
        className="skip-intro-btn"
        title="Skip Intro (Esc)"
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(15, 23, 42, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          color: '#f8fafc',
          padding: '0.6rem 1.2rem',
          borderRadius: '9999px',
          fontSize: '0.85rem',
          fontWeight: 600,
          backdropFilter: 'blur(12px)',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          transition: 'all 0.2s ease',
        }}
      >
        <FastForward size={16} />
        <span>Skip Intro</span>
      </button>

      {/* Aurora Layer */}
      <div className="aurora-layer">
        <div className="aurora-ribbon r-1" />
        <div className="aurora-ribbon r-2" />
        <div className="aurora-ribbon r-3" />
      </div>

      {/* Moon Layer with Craters, Halos, Maria & Light Beams */}
      <div className="moon-layer">
        <div className="moon">
          <div className="moon-maria" />
          <div className="crater crater-1" />
          <div className="crater crater-2" />
          <div className="crater crater-3" />
          <div className="crater crater-4" />
          <div className="crater crater-5" />
          <div className="crater crater-6" />
          <div className="moon-surface-glow" />
          <div className="moon-texture" />
          <div className="moon-sparkle-layer" />
          <div className="moon-shadow" />
        </div>
        <div className="moon-halo halo-1" />
        <div className="moon-halo halo-2" />
        <div className="moon-halo halo-3" />
        <div className="moon-halo halo-4" />
        <div className="moon-torch-flare" />
        <div className="moon-light-beam" />
      </div>

      {/* Cosmic Dust Particles */}
      <div className="cosmic-dust-layer">
        {Array.from({ length: 15 }).map((_, i) => (
          <div
            key={`dust-${i}`}
            className="cosmic-dust"
            style={{
              left: `${(i * 7 + 10) % 95}%`,
              top: `${(i * 13 + 5) % 90}%`,
              width: `${1.5 + (i % 3)}px`,
              height: `${1.5 + (i % 3)}px`,
              animationDuration: `${3.5 + (i % 4)}s`,
              animationDelay: `${(i * 0.4).toFixed(1)}s`,
            }}
          />
        ))}
      </div>

      {/* Ground Mist Layer */}
      <div className="ground-mist-layer">
        <div className="mist m-1" />
        <div className="mist m-2" />
      </div>

      {/* Camera Parallax 3D World */}
      <div className="camera-parallax">
        {/* Environment Futuristic Campus Skyline */}
        <div className="environment-layer">
          <div className="building bld-1">
            <div className="bld-top-shimmer" />
          </div>
          <div className="building bld-2">
            <div className="bld-top-shimmer" />
          </div>
          <div className="building bld-3">
            <div className="bld-top-shimmer" />
          </div>
        </div>

        {/* 18 Interactive Orbiting Icon Boxes */}
        <div className="icon-boxes-layer">
          {ICON_FEATURES.map((item, idx) => (
            <div
              key={`box-${idx}`}
              className={`icon-box box-color-${idx % 4}`}
              style={{
                left: BOX_POSITIONS[idx]?.left || `${(5 + idx * 5) % 90}%`,
                top: BOX_POSITIONS[idx]?.top || `${(10 + idx * 4) % 85}%`,
                animationDelay: `${(idx * 0.15).toFixed(2)}s`,
              }}
            >
              <div className="icon-box-icon">{item.icon}</div>
              <span className="icon-box-label">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Shockwave Radial Energy Pulse */}
        <div className="shockwave-pulse" />

        {/* Cinematic Logo Display */}
        <div className="cinematic-logo-display">
          <div className="svg-logo-wrapper">
            <svg viewBox="0 0 100 100" className="tree-logo-pulse">
              <defs>
                <linearGradient id="tree-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#ff007c' }} />
                  <stop offset="50%" style={{ stopColor: '#ff8a00' }} />
                  <stop offset="100%" style={{ stopColor: '#8a2be2' }} />
                </linearGradient>
              </defs>
              <path
                fill="none"
                stroke="url(#tree-grad)"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M50 85 V60 
                   M50 60 C40 55 35 45 35 35 C35 25 42 18 50 18 C58 18 65 25 65 35 C65 45 60 55 50 60
                   M45 75 C40 70 30 65 25 55 C20 45 22 35 30 30
                   M55 75 C60 70 70 65 75 55 C80 45 78 35 70 30
                   M50 60 Q30 50 20 20
                   M50 60 Q70 50 80 20"
                className="logo-path-animation"
              />
            </svg>
          </div>
          <div className="branding-text">
            <h1 className="logo-text">CAMPUS HUB</h1>
            <p className="logo-slogan">CONNECT • CREATE • COLLABORATE</p>
          </div>
        </div>
      </div>
    </div>
  );
}
