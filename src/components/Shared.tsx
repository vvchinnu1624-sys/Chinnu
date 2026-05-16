import { motion, AnimatePresence } from 'motion/react';
import React, { useEffect, useState } from 'react';

export const BackgroundEffects: React.FC = () => {
  const [elements, setElements] = useState<any[]>(() => {
    // Initial constant stars for midnight mode
    return Array.from({ length: 20 }).map((_, i) => ({
      id: `star-init-${i}`,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 2 + Math.random() * 3,
      type: 'star' as const
    }));
  });

  useEffect(() => {
    // Floating hearts and petals
    const interval = setInterval(() => {
      setElements(prev => {
        const newEl = {
          id: `float-${Date.now()}-${Math.random()}`,
          x: Math.random() * 100,
          delay: Math.random() * 5,
          duration: 10 + Math.random() * 20,
          type: Math.random() > 0.7 ? 'heart' : (Math.random() > 0.5 ? 'petal' : 'sparkle')
        };
        // Use a strictly limited pool for floating elements
        const floating = prev.filter(el => typeof el.id === 'string' && el.id.startsWith('float-'));
        const stars = prev.filter(el => typeof el.id === 'string' && el.id.startsWith('star-'));
        return [...stars, ...floating.slice(-25), newEl];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <AnimatePresence>
        {elements.map(el => {
          if (el.type === 'star') {
            return (
              <motion.div
                key={el.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{ duration: el.duration, repeat: Infinity, delay: el.delay }}
                className="absolute w-1 h-1 bg-white rounded-full star"
                style={{ left: `${el.x}%`, top: `${el.y}%` }}
              />
            );
          }
          return (
            <motion.div
              key={el.id}
              initial={{ y: '110%', x: `${el.x}%`, opacity: 0, rotate: 0 }}
              animate={{ y: '-10%', x: `${el.x + (Math.random() * 10 - 5)}%`, opacity: [0, 0.6, 0], rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ duration: el.duration, delay: el.delay, ease: 'linear' }}
              className="absolute text-2xl"
            >
              {el.type === 'heart' ? '❤️' : (el.type === 'petal' ? '🌸' : '✨')}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-white/10 to-purple-50/30 transition-colors duration-1000 midnight-gradient" />
    </div>
  );
};

export const GlassCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`glass-card rounded-[24px] p-8 ${className}`}
  >
    {children}
  </motion.div>
);
