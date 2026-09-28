import React from 'react';

/**
 * SunBackground - Radiant cosmic sun, solar corona, volumetric rays, and meteor strikes
 * Used across the authentication / login experience
 */
export default function SunBackground() {
  return (
    <div className="sun-container" aria-hidden="true">
      {/* Sun Core & Granulation Noise */}
      <div className="sun-source">
        <div className="sun-granulation" />
      </div>

      {/* Solar Atmospheric Corona */}
      <div className="sun-corona" />

      {/* Volumetric Light Beam & Pulsing Ray Filter */}
      <div className="volumetric-beam">
        <div className="beam-ray" />
      </div>

      {/* Fast Striking Asteroids / Meteors */}
      <div className="asteroid" style={{ animationDelay: '0s' }} />
      <div className="asteroid" style={{ animationDelay: '1.2s', top: '40%', right: '25%' }} />
      <div className="asteroid" style={{ animationDelay: '2.5s', top: '20%', right: '35%' }} />

      {/* Floating Dust Particles */}
      <div className="dust-container">
        {[...Array(12)].map((_, i) => (
          <div
            key={`dust-${i}`}
            className="dust"
            style={{
              top: `${(i * 19 + 7) % 95}%`,
              left: `${(i * 23 + 12) % 90}%`,
              animationDuration: `${12 + (i % 8)}s`,
              animationDelay: `${(i * 0.7).toFixed(1)}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
