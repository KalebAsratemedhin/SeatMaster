"use client";

import { useEffect, useState, useRef, useCallback } from "react";

interface AnimatedCursorProps {
  children: React.ReactNode;
}

export function AnimatedCursor({ children }: AnimatedCursorProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isClicking, setIsClicking] = useState(false);
  const outerCursorRef = useRef<HTMLDivElement>(null);
  const innerCursorRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);

  const updateCursorPosition = useCallback((x: number, y: number) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (outerCursorRef.current) {
        outerCursorRef.current.style.left = `${x - 8}px`;
        outerCursorRef.current.style.top = `${y - 8}px`;
      }
      if (innerCursorRef.current) {
        innerCursorRef.current.style.left = `${x - 1.5}px`;
        innerCursorRef.current.style.top = `${y - 1.5}px`;
      }
    });
  }, []);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
      updateCursorPosition(e.clientX, e.clientY);
    };

    const handleMouseDown = () => setIsClicking(true);
    const handleMouseUp = () => setIsClicking(false);

    window.addEventListener("mousemove", updateMousePosition, { passive: true });
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateCursorPosition]);

  useEffect(() => {
    // Hide the default cursor globally
    document.body.style.cursor = 'none';
    
    return () => {
      // Restore default cursor when component unmounts
      document.body.style.cursor = 'auto';
    };
  }, []);

  return (
    <>
      <div className="fixed inset-0 pointer-events-none z-[60]">
        {/* Conic cursor with blurry surrounding */}
        <div
          ref={outerCursorRef}
          className={`absolute ${
            isHovering ? "scale-110" : "scale-100"
          } ${isClicking ? "scale-90" : ""}`}
          style={{
            left: 0,
            top: 0,
            width: '16px',
            height: '16px',
            background: `
              conic-gradient(
                from 0deg at 50% 0%,
                var(--primary) 0deg,
                var(--primary) 30deg,
                transparent 30deg,
                transparent 330deg,
                var(--primary) 330deg,
                var(--primary) 360deg
              )
            `,
            borderRadius: '50%',
            filter: 'blur(1px)',
            transformOrigin: 'center',
            boxShadow: `
              0 0 8px var(--primary),
              0 0 16px var(--primary),
              0 0 24px var(--primary)
            `,
            transition: 'transform 0.1s ease-out',
          }}
        />
        
        {/* Inner sharp point */}
        <div
          ref={innerCursorRef}
          className={`absolute ${
            isHovering ? "scale-110" : "scale-100"
          } ${isClicking ? "scale-90" : ""}`}
          style={{
            left: 0,
            top: 0,
            width: '3px',
            height: '3px',
            background: 'var(--primary)',
            borderRadius: '50%',
            transformOrigin: 'center',
            zIndex: 1,
            transition: 'transform 0.1s ease-out',
          }}
        />
      </div>
      
      <div
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {children}
      </div>
    </>
  );
}
