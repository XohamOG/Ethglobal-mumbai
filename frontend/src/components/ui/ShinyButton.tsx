"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface ShinyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "outline";
}

export function ShinyButton({
  children,
  className,
  variant = "primary",
  ...props
}: ShinyButtonProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const variantStyles = {
    primary: "bg-[#161922] text-white border border-[#262c3e] hover:border-[#3b4460]",
    secondary: "bg-[#0f1118] text-[#a0aec0] border border-[#1e2230] hover:text-white hover:border-[#2d3348]",
    outline: "bg-transparent text-white border border-[#262c3e] hover:bg-[#161922]",
  };

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md overflow-hidden cursor-pointer active:scale-[0.98]",
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {/* Subtle cursor-following radial light */}
      {isHovered && (
        <span
          className="pointer-events-none absolute -inset-px opacity-25 transition-opacity duration-300 rounded-md"
          style={{
            background: `radial-gradient(120px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,255,255,0.4), transparent 80%)`,
          }}
        />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
