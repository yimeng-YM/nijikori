import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Bubble {
  id: number;
  x: number;
  y: number;
  image: string;
  rotation: number;
  size: number;
}

const MouseTrail: React.FC = () => {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);

  const addBubble = useCallback((x: number, y: number) => {
    const id = Date.now() + Math.random();
    const images = ['/images/mouse_trail_1.png', '/images/mouse_trail_2.png'];
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const randomRotation = Math.random() * 360;
    const randomSize = 20 + Math.random() * 30; // 20px to 50px

    const newBubble: Bubble = {
      id,
      x,
      y,
      image: randomImage,
      rotation: randomRotation,
      size: randomSize,
    };

    setBubbles((prev) => [...prev.slice(-20), newBubble]); // Keep last 20 bubbles
  }, []);

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    const threshold = 40; // Minimum distance to move before creating a new bubble

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const dist = Math.sqrt(Math.pow(clientX - lastX, 2) + Math.pow(clientY - lastY, 2));

      if (dist > threshold) {
        addBubble(clientX, clientY);
        lastX = clientX;
        lastY = clientY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [addBubble]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <AnimatePresence>
        {bubbles.map((bubble) => (
          <motion.img
            key={bubble.id}
            src={bubble.image}
            initial={{ 
              opacity: 0, 
              scale: 0, 
              x: bubble.x - bubble.size / 2, 
              y: bubble.y - bubble.size / 2,
              rotate: bubble.rotation 
            }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1.2, 1, 0.8],
              y: bubble.y - bubble.size / 2 - 100, // Float up 100px
              rotate: bubble.rotation + (Math.random() > 0.5 ? 45 : -45)
            }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 1.5, 
              ease: "easeOut" 
            }}
            onAnimationComplete={() => {
              setBubbles((prev) => prev.filter((b) => b.id !== bubble.id));
            }}
            style={{
              position: 'absolute',
              width: bubble.size,
              height: bubble.size,
              willChange: 'transform, opacity',
            }}
            alt=""
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default MouseTrail;
