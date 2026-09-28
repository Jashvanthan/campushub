import React, { useEffect, useRef } from 'react';

/**
 * VoidBackground - Deep space 3D parallax cosmos with planets, nebulas, asteroids & stars
 * Features smoothed 60fps parallax physics and refined ambient star layers on application pages.
 */
export default function VoidBackground({ isHidden = false, isApp = false }) {
  const rootRef = useRef(null);

  useEffect(() => {
    let animId;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e) => {
      const { clientX, clientY } = e;
      const { innerWidth, innerHeight } = window;
      targetX = (clientX - innerWidth / 2) / innerWidth;
      targetY = (clientY - innerHeight / 2) / innerHeight;
    };

    const animateParallax = () => {
      // Smooth linear interpolation for buttery smooth parallax
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (rootRef.current) {
        rootRef.current.style.setProperty('--move-x', currentX.toFixed(4));
        rootRef.current.style.setProperty('--move-y', currentY.toFixed(4));
      }

      animId = requestAnimationFrame(animateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    animId = requestAnimationFrame(animateParallax);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Refined star counts on app pages to reduce clutter & elevate readability
  const clusterCount = isApp ? 8 : 60;
  const driftCount = isApp ? 4 : 30;
  const stoneCount = isApp ? 1 : 5;
  const shootingStreakCount = isApp ? 1 : 8;

  return (
    <div
      ref={rootRef}
      className={`void-background-root ${isHidden ? 'is-intro-hidden' : ''} ${isApp ? 'is-app-background' : ''}`}
      aria-hidden="true"
    >
      {/* Deep Space Base Layer (Curated subtle star clusters) */}
      <div className="space-layer deep-space-base">
        <div className="random-star-clusters">
          {[...Array(clusterCount)].map((_, i) => (
            <div key={`cluster-${i}`} className={`star-cluster cluster-${i + 1}`} />
          ))}
        </div>
      </div>

      {/* Drifting Star Layer (Gentle celestial particles) */}
      <div className="space-layer drifting-star-layer">
        {[...Array(driftCount)].map((_, i) => (
          <div key={`drift-${i}`} className={`drifting-star drift-${(i % 12) + 1}`} />
        ))}
      </div>

      {/* Stellar Stones / Asteroids */}
      <div className="space-layer stellar-stones">
        {[...Array(stoneCount)].map((_, i) => (
          <div key={`stone-${i}`} className={`cosmic-stone stone-${i + 1}`}>
            <div className="stone-texture" />
          </div>
        ))}
      </div>

      {/* Nebula Atmosphere */}
      <div className="space-layer nebula-atmospheric">
        <div className="gas-cloud cloud-1" />
        <div className="gas-cloud cloud-2" />
      </div>

      {/* Main World / Exoplanet with 3D glow */}
      <div className="space-layer main-world">
        <div className="planet-body">
          <div className="planet-glow" />
          <div className="planet-surface-detail" />
        </div>
      </div>

      {/* Shooting Star Field */}
      <div className="space-layer shooting-star-field">
        {[...Array(shootingStreakCount)].map((_, i) => (
          <div key={`streak-${i}`} className={`light-streak streak-${i + 1}`} />
        ))}
      </div>

      {/* Cinematic Vignette Grade */}
      <div className="cinematic-grade" />
    </div>
  );
}
