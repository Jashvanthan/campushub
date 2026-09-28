import React, { useEffect, useRef } from 'react';

/**
 * WarpSpeedCanvas - High-performance 3D perspective warp-speed canvas animation
 * Features delta-time smoothing, intelligent star density scaling, and refined ambient physics.
 */
export default function WarpSpeedCanvas({ isApp = false }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animId;
    let width = 0;
    let height = 0;
    let cx = 0;
    let cy = 0;
    let targetCx = 0;
    let targetCy = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      targetCx = width / 2;
      targetCy = height / 2;
      if (cx === 0 && cy === 0) {
        cx = targetCx;
        cy = targetCy;
      }
    };

    const mousePos = { x: 0, y: 0, targetX: 0, targetY: 0 };
    const handleMouseMove = (e) => {
      if (width && height) {
        mousePos.targetX = (e.clientX / width - 0.5) * 0.08;
        mousePos.targetY = (e.clientY / height - 0.5) * 0.08;
      }
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    handleResize();

    // Refined star counts: subtle & elegant on application pages to reduce clutter
    const isMobile = window.innerWidth < 768;
    const starCount = isApp 
      ? (isMobile ? 50 : 140)    // Reduced background stars on application pages
      : (isMobile ? 220 : 480);  // Immersive dynamic cosmos on login/intro

    const baseSpeed = isApp ? 3.0 : 13.0; // Gentle ambient drift on app pages, energetic on login
    const maxZ = 2000;
    const stars = [];
    const colors = isApp 
      ? ['#ffffff', '#e0f2fe', '#bae6fd', '#ddd6fe', '#fed7aa']
      : ['#ffffff', '#ffffff', '#fb923c', '#fde047', '#38bdf8', '#c084fc', '#a855f7'];

    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 2200,
        y: (Math.random() - 0.5) * 2200,
        z: Math.random() * maxZ,
        pz: 0,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 1.2 + 0.6,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.03 + 0.015,
      });
    }

    let lastTime = performance.now();

    const render = (currentTime) => {
      const deltaMs = currentTime - lastTime;
      lastTime = currentTime;
      // Frame rate independent delta ratio (normalized to ~60fps standard: 16.67ms)
      const dt = Math.min(Math.max(deltaMs / 16.67, 0.5), 3.0);

      ctx.clearRect(0, 0, width, height);

      // Smooth mouse lerping with inertia
      mousePos.x += (mousePos.targetX - mousePos.x) * 0.06 * dt;
      mousePos.y += (mousePos.targetY - mousePos.y) * 0.06 * dt;

      targetCx = width / 2 + mousePos.x * width;
      targetCy = height / 2 + mousePos.y * height;
      cx += (targetCx - cx) * 0.08 * dt;
      cy += (targetCy - cy) * 0.08 * dt;

      ctx.lineCap = 'round';

      for (let i = 0; i < starCount; i++) {
        const star = stars[i];
        star.pz = star.z;
        star.z -= baseSpeed * dt;
        star.pulse += star.pulseSpeed * dt;

        if (star.z <= 0) {
          star.z = maxZ;
          star.x = (Math.random() - 0.5) * 2200;
          star.y = (Math.random() - 0.5) * 2200;
          star.pz = star.z;
        }

        const k = 1000;
        const sx = (star.x / star.z) * k + cx;
        const sy = (star.y / star.z) * k + cy;
        const px = (star.x / star.pz) * k + cx;
        const py = (star.y / star.pz) * k + cy;

        if (px > 0 && px < width && py > 0 && py < height) {
          const depthRatio = 1 - star.z / maxZ;
          const subtleMultiplier = isApp ? 0.45 : 1.0;
          const alpha = Math.min(0.85, (depthRatio * 2.2 * (0.8 + 0.2 * Math.sin(star.pulse)))) * subtleMultiplier;
          const lineWidth = Math.max(0.6, (0.5 + depthRatio * 2.2) * (isApp ? 0.8 : 1.0));

          // Soft atmospheric glow trail
          ctx.beginPath();
          ctx.strokeStyle = star.color;
          ctx.globalAlpha = alpha * 0.35;
          ctx.lineWidth = lineWidth * 2.2;
          ctx.moveTo(sx, sy);
          ctx.lineTo(px, py);
          ctx.stroke();

          // Crisp radiant core
          ctx.beginPath();
          ctx.strokeStyle = '#ffffff';
          ctx.globalAlpha = alpha;
          ctx.lineWidth = lineWidth;
          ctx.moveTo(sx, sy);
          ctx.lineTo(px, py);
          ctx.stroke();

          // Delicate star particle dot when near
          if (depthRatio > 0.6) {
            ctx.beginPath();
            ctx.fillStyle = star.color;
            ctx.globalAlpha = alpha * 0.6;
            ctx.arc(sx, sy, Math.min(star.size * depthRatio * 1.5, 2.5), 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      ctx.globalAlpha = 1;
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isApp]);

  return (
    <canvas
      ref={canvasRef}
      className={`warp-speed-canvas ${isApp ? 'is-app-canvas' : ''}`}
      aria-hidden="true"
    />
  );
}
