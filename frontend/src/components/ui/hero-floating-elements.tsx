"use client";

import { useEffect, useState } from "react";
import { Heart, Building2, Bus, Theater, GraduationCap, PartyPopper, Ticket, Calendar, Users, BarChart3 } from "lucide-react";

interface FloatingImage {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  size: number;
  position: { x: number; y: number };
  delay: number;
  speed: number;
}

const floatingImages: FloatingImage[] = [
  { id: "wedding", icon: Heart, size: 60, position: { x: 10, y: 15 }, delay: 0, speed: 0.5 },
  { id: "business", icon: Building2, size: 50, position: { x: 85, y: 20 }, delay: 1, speed: 0.7 },
  { id: "transport", icon: Bus, size: 45, position: { x: 15, y: 70 }, delay: 2, speed: 0.6 },
  { id: "entertainment", icon: Theater, size: 55, position: { x: 80, y: 75 }, delay: 3, speed: 0.8 },
  { id: "education", icon: GraduationCap, size: 40, position: { x: 5, y: 45 }, delay: 4, speed: 0.4 },
  { id: "social", icon: PartyPopper, size: 50, position: { x: 90, y: 50 }, delay: 5, speed: 0.9 },
  { id: "ticket", icon: Ticket, size: 35, position: { x: 25, y: 25 }, delay: 6, speed: 0.3 },
  { id: "calendar", icon: Calendar, size: 40, position: { x: 70, y: 30 }, delay: 7, speed: 0.5 },
  { id: "users", icon: Users, size: 45, position: { x: 30, y: 80 }, delay: 8, speed: 0.6 },
  { id: "chart", icon: BarChart3, size: 35, position: { x: 75, y: 60 }, delay: 9, speed: 0.4 },
];

export function HeroFloatingElements() {
  const [positions, setPositions] = useState<Record<string, { x: number; y: number; rotation: number }>>({});

  useEffect(() => {
    const animate = () => {
      const newPositions: Record<string, { x: number; y: number; rotation: number }> = {};
      
      floatingImages.forEach((image) => {
        const time = Date.now() * 0.001 + image.delay;
        const baseX = image.position.x;
        const baseY = image.position.y;
        
        newPositions[image.id] = {
          x: baseX + Math.sin(time * image.speed) * 15,
          y: baseY + Math.cos(time * image.speed * 0.7) * 10,
          rotation: Math.sin(time * image.speed * 0.5) * 10,
        };
      });
      
      setPositions(newPositions);
      requestAnimationFrame(animate);
    };
    
    animate();
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {floatingImages.map((image) => {
        const pos = positions[image.id];
        if (!pos) return null;
        
        return (
          <div
            key={image.id}
            className="absolute opacity-20 hover:opacity-40 transition-opacity duration-300"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: `translate(-50%, -50%) rotate(${pos.rotation}deg)`,
              fontSize: `${image.size}px`,
              animationDelay: `${image.delay}s`,
            }}
          >
            <div className="relative group">
              <div className="filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">
                <image.icon className="w-16 h-16" />
              </div>
              {/* Glow effect */}
              <div 
                className="absolute inset-0 rounded-full blur-md opacity-30 group-hover:opacity-50 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle, var(--primary) 0%, transparent 70%)`,
                  transform: 'scale(1.5)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
