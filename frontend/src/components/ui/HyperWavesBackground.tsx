"use client";

import React, { useEffect, useRef } from "react";

interface Ripple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  strength: number;
}

export function HyperWavesBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let time = 0;
    const ripples: Ripple[] = [];
    const mouse = { x: -1000, y: -1000, active: false };

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;

      // Add ripple on movement with throttle
      if (Math.random() < 0.25 || ripples.length === 0) {
        ripples.push({
          x: e.clientX,
          y: e.clientY,
          radius: 5,
          maxRadius: 180,
          strength: 0.8,
        });
        if (ripples.length > 8) ripples.shift();
      }
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.x = -1000;
      mouse.y = -1000;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    const render = () => {
      time += 0.012;

      // Update ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i];
        r.radius += 2.2;
        r.strength *= 0.965;
        if (r.strength < 0.02 || r.radius > r.maxRadius) {
          ripples.splice(i, 1);
        }
      }

      ctx.clearRect(0, 0, width, height);

      // Deep Obsidian Canvas Background with soft radial highlight
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        50,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.75
      );
      bgGrad.addColorStop(0, "#131313");
      bgGrad.addColorStop(0.6, "#101010");
      bgGrad.addColorStop(1, "#090909");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle Topographic Contour Lines (blueprint scratched into obsidian)
      ctx.lineWidth = 1;
      const numLines = 6;
      for (let l = 0; l < numLines; l++) {
        const lineOffset = l * 120 + ((time * 15) % 120);
        ctx.beginPath();
        const yBase = height * 0.2 + l * (height * 0.12);

        for (let x = 0; x <= width; x += 16) {
          const wave =
            Math.sin(x * 0.0035 + time + l * 0.8) * 28 +
            Math.cos(x * 0.007 - time * 0.6) * 16;
          const y = yBase + wave;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }

        ctx.strokeStyle = `rgba(45, 45, 45, ${0.12 + (l % 2) * 0.06})`;
        ctx.stroke();
      }

      // Wave Grid of Geometric Glyphs (ShapeWaves style)
      const cellSize = 32;
      const cols = Math.ceil(width / cellSize) + 1;
      const rows = Math.ceil(height / cellSize) + 1;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * cellSize;
          const y = row * cellSize;

          // Wave field equation
          const waveVal =
            Math.sin(x * 0.006 + time * 1.1) * Math.cos(y * 0.006 + time * 0.9) +
            Math.sin((x + y) * 0.004 + time * 0.7);

          // Distance to mouse
          const dxMouse = x - mouse.x;
          const dyMouse = y - mouse.y;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          const mouseInfluence = Math.max(0, 1 - distMouse / 160);

          // Influence from ripples
          let rippleInfluence = 0;
          for (const r of ripples) {
            const dxR = x - r.x;
            const dyR = y - r.y;
            const distR = Math.sqrt(dxR * dxR + dyR * dyR);
            const distFromWavefront = Math.abs(distR - r.radius);
            if (distFromWavefront < 35) {
              rippleInfluence +=
                (1 - distFromWavefront / 35) * r.strength * 1.5;
            }
          }

          // Combined brightness & displacement
          const baseAlpha = 0.14 + (waveVal + 2) * 0.05;
          const totalAlpha = Math.min(
            0.9,
            baseAlpha + mouseInfluence * 0.45 + rippleInfluence * 0.6
          );

          // Subtle offset along wave normal
          const xOffset = Math.sin(waveVal * 2 + time) * 3;
          const yOffset = Math.cos(waveVal * 2 + time) * 3;
          const drawX = x + xOffset;
          const drawY = y + yOffset;

          // Mixed shapes: Cross, Circle, Square, Dot (Hyperstudio / ShapeWaves signature)
          const shapeType = (col + row * 3) % 4;
          const isHighlighted = mouseInfluence > 0.3 || rippleInfluence > 0.3;

          if (isHighlighted) {
            ctx.fillStyle = `rgba(243, 243, 243, ${totalAlpha})`;
            ctx.strokeStyle = `rgba(243, 243, 243, ${totalAlpha})`;
          } else {
            // Compass Gold or Graphite Smoke
            if ((col + row) % 9 === 0) {
              ctx.fillStyle = `rgba(111, 103, 89, ${totalAlpha * 1.2})`;
              ctx.strokeStyle = `rgba(111, 103, 89, ${totalAlpha * 1.2})`;
            } else {
              ctx.fillStyle = `rgba(156, 156, 156, ${totalAlpha})`;
              ctx.strokeStyle = `rgba(156, 156, 156, ${totalAlpha})`;
            }
          }

          const glyphSize = 2 + (waveVal + 2) * 0.8 + mouseInfluence * 2.5;

          if (shapeType === 0) {
            // Circle
            ctx.beginPath();
            ctx.arc(drawX, drawY, Math.max(1, glyphSize), 0, Math.PI * 2);
            ctx.fill();
          } else if (shapeType === 1) {
            // Square (hairline)
            const s = Math.max(2, glyphSize * 1.6);
            ctx.strokeRect(drawX - s / 2, drawY - s / 2, s, s);
          } else if (shapeType === 2) {
            // Cross '+'
            const l = Math.max(2, glyphSize * 1.5);
            ctx.beginPath();
            ctx.moveTo(drawX - l, drawY);
            ctx.lineTo(drawX + l, drawY);
            ctx.moveTo(drawX, drawY - l);
            ctx.lineTo(drawX, drawY + l);
            ctx.stroke();
          } else {
            // Fine dot
            ctx.beginPath();
            ctx.arc(drawX, drawY, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
  );
}
