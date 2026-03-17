import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: string;
  x: number;
  y: number;
  shape: 'circle' | 'triangle' | 'square' | 'heart';
  angle: number;
  distance: number;
  rotation: number;
  size: number;
}

interface ClickGroup {
  id: number;
  x: number;
  y: number;
  particles: Particle[];
}

const ClickEffect: React.FC = () => {
  const [clickGroups, setClickGroups] = useState<ClickGroup[]>([]);

  const shapes: ('circle' | 'triangle' | 'square' | 'heart')[] = ['circle', 'triangle', 'square', 'heart'];

  const addClick = useCallback((x: number, y: number) => {
    const groupId = Date.now();
    const particleCount = 6 + Math.floor(Math.random() * 4); // 6-10 particles
    const particles: Particle[] = [];

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        id: `${groupId}-${i}`,
        x,
        y,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        angle: Math.random() * Math.PI * 2,
        distance: 70 + Math.random() * 130,
        rotation: Math.random() * 360,
        size: 25 + Math.random() * 25,
      });
    }

    const newGroup: ClickGroup = {
      id: groupId,
      x,
      y,
      particles,
    };

    setClickGroups((prev) => [...prev.slice(-10), newGroup]);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      addClick(e.clientX, e.clientY);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [addClick]);

  const renderShape = (shape: string, size: number) => {
    const color = "#87CEEB"; // Theme color
    const strokeWidth = 2.5;

    switch (shape) {
      case 'circle':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
            <circle cx="12" cy="12" r="10" />
          </svg>
        );
      case 'triangle':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
            <path d="M12 2L2 20H22L12 2Z" />
          </svg>
        );
      case 'square':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
          </svg>
        );
      case 'heart':
        return (
          <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth}>
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l8.78-8.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-[10000] overflow-hidden">
      <AnimatePresence>
        {clickGroups.map((group) => (
          <React.Fragment key={group.id}>
            {group.particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ 
                  opacity: 1, 
                  scale: 0, 
                  x: p.x - p.size / 2, 
                  y: p.y - p.size / 2,
                  rotate: p.rotation
                }}
                animate={{ 
                  opacity: 0,
                  scale: 1,
                  x: p.x - p.size / 2 + Math.cos(p.angle) * p.distance,
                  y: p.y - p.size / 2 + Math.sin(p.angle) * p.distance,
                  rotate: p.rotation + 180
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                onAnimationComplete={() => {
                  setClickGroups((prev) => 
                    prev.map(g => g.id === group.id 
                      ? { ...g, particles: g.particles.filter(part => part.id !== p.id) }
                      : g
                    ).filter(g => g.particles.length > 0)
                  );
                }}
                style={{
                  position: 'absolute',
                  willChange: 'transform, opacity',
                }}
              >
                {renderShape(p.shape, p.size)}
              </motion.div>
            ))}
          </React.Fragment>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ClickEffect;
