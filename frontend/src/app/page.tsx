"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreTriggerModal } from "@/components/cre/CreTriggerModal";
import { Search, ArrowRight, Sparkles } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreModalOpen, setIsCreModalOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Background Interactive Constellation Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Particle nodes
    const particleCount = Math.min(65, Math.floor((width * height) / 18000));
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.6 + 0.8,
      color: Math.random() > 0.4 ? "rgba(176, 104, 255, " : "rgba(214, 216, 228, ",
      alpha: Math.random() * 0.45 + 0.2,
    }));

    // Mouse interaction
    let mouse = { x: -1000, y: -1000 };
    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.14;
            ctx.strokeStyle = `rgba(176, 104, 255, ${alpha})`;
            ctx.lineWidth = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce on boundary
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Subtle mouse repulsion
        const mdx = p.x - mouse.x;
        const mdy = p.y - mouse.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 100) {
          p.x += (mdx / mdist) * 0.8;
          p.y += (mdy / mdist) * 0.8;
        }

        ctx.fillStyle = `${p.color}${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = searchQuery.trim().toLowerCase();

    if (q.includes("demo") || q.includes("sandbox")) {
      router.push("/demo");
      return;
    }

    // Default or Aave search triggers CRE consensus verification
    setIsCreModalOpen(true);
  };

  const handleDirectGo = () => {
    router.push("/graph?protocol=aave-v3-mainnet");
  };

  return (
    <div className="relative min-h-screen w-full bg-[#0e0e12] text-[#ececf2] flex flex-col items-center justify-center overflow-hidden select-none font-sans">
      {/* Animated Background Canvas */}
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-0 opacity-80"
      />

      {/* Radial Atmospheric Lighting */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] bg-[radial-gradient(ellipse_at_center,rgba(176,104,255,0.12),rgba(14,14,18,0)_70%)] blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[200px] bg-[radial-gradient(ellipse_at_center,rgba(214,216,228,0.06),transparent_65%)] blur-2xl" />
      </div>

      {/* Center Stage: Title, Description & Big Search Bar Only */}
      <main className="relative z-10 w-full max-w-2xl px-6 flex flex-col items-center text-center">
        {/* Brand Title: macaroom */}
        <h1 className="text-5xl sm:text-7xl font-serif font-bold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-[#ececf2] via-[#d6d8e4] to-[#b068ff] bg-clip-text text-transparent drop-shadow-[0_2px_30px_rgba(176,104,255,0.25)]">
            macaroom
          </span>
        </h1>

        {/* Short 3-4 Word Description */}
        <p className="text-xs sm:text-sm font-mono text-[#aaaab8] tracking-widest uppercase mb-10">
          Decentralized Protocol Lineage
        </p>

        {/* Big Search Input Field */}
        <form onSubmit={handleSearchSubmit} className="w-full relative group">
          <div
            className={`relative rounded-[6px] transition-all duration-300 p-[1px] ${
              isFocused
                ? "bg-gradient-to-r from-[#b068ff] via-[#d6d8e4] to-[#b068ff] shadow-[0_0_35px_rgba(176,104,255,0.35)]"
                : "bg-[#282832] hover:bg-[#7d8495]/50 hover:shadow-[0_0_20px_rgba(176,104,255,0.15)]"
            }`}
          >
            <div className="relative bg-[#17171d]/95 backdrop-blur-xl rounded-[5px] flex items-center px-4 py-3.5 sm:py-4">
              <Search className="w-5 h-5 text-[#b068ff] shrink-0 mr-3 transition-colors" />

              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Search protocol name or contract address..."
                className="w-full bg-transparent border-0 text-sm sm:text-base text-[#ececf2] placeholder-[#7d8495] focus:outline-none font-mono"
                autoFocus
              />

              <button
                type="submit"
                className="ml-2 p-2 rounded-[3px] bg-[#282832] hover:bg-[#b068ff] text-[#d6d8e4] hover:text-black transition-all cursor-pointer shrink-0 shadow-sm"
                title="Search or Audit"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>

        {/* Subtle Quick Target Pill (Zero Clutter) */}
        <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#7d8495]">
          <span>Try:</span>
          <button
            onClick={() => {
              setSearchQuery("Aave V3");
              setIsCreModalOpen(true);
            }}
            className="text-[#aaaab8] hover:text-[#b068ff] transition-colors cursor-pointer underline underline-offset-4"
          >
            Aave V3 (0x87870Bca...)
          </button>
          <span>·</span>
          <button
            onClick={() => router.push("/demo")}
            className="text-[#aaaab8] hover:text-[#b068ff] transition-colors cursor-pointer underline underline-offset-4"
          >
            Chaos Sandbox
          </button>
        </div>
      </main>

      {/* Interactive Chainlink CRE Consensus Trigger Modal */}
      <CreTriggerModal
        isOpen={isCreModalOpen}
        onClose={() => setIsCreModalOpen(false)}
      />
    </div>
  );
}
