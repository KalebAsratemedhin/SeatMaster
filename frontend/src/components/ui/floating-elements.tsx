"use client";

import { useEffect, useState } from "react";

interface FloatingElementProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  amplitude?: number;
}

export function FloatingElement({ 
  children, 
  className = "", 
  speed = 1,
  amplitude = 10
}: FloatingElementProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const animate = () => {
      setOffset(Math.sin(Date.now() * speed * 0.001) * amplitude);
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [speed, amplitude]);

  return (
    <div
      className={`transition-transform duration-100 ease-linear ${className}`}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {children}
    </div>
  );
}

export function FloatingIcon({ 
  icon, 
  className = "", 
  delay = 0 
}: { 
  icon: string; 
  className?: string; 
  delay?: number;
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const animate = () => {
      const time = Date.now() * 0.001 + delay;
      setPosition({
        x: Math.sin(time) * 20,
        y: Math.cos(time * 0.7) * 15,
      });
      requestAnimationFrame(animate);
    };
    
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [delay]);

  return (
    <div
      className={`absolute opacity-20 text-6xl ${className}`}
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    >
      {icon}
    </div>
  );
}
