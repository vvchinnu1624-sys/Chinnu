import React, { useState, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import { Plus, Heart } from 'lucide-react';
import { GlassCard } from './Shared';

interface Props {
  onNext: () => void;
}

export const FeedingScene: React.FC<Props> = ({ onNext }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isFed, setIsFed] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);
  const cakeX = useMotionValue(0);
  const cakeY = useMotionValue(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleDragEnd = () => {
    if (!targetRef.current || isFed) return;
    
    const targetRect = targetRef.current.getBoundingClientRect();
    const cakeRect = document.getElementById('cake-piece')!.getBoundingClientRect();

    const distance = Math.sqrt(
      Math.pow((targetRect.left + targetRect.width / 2) - (cakeRect.left + cakeRect.width / 2), 2) +
      Math.pow((targetRect.top + targetRect.height / 2) - (cakeRect.top + cakeRect.height / 2), 2)
    );

    if (distance < 100) {
      setIsFed(true);
      setTimeout(onNext, 3000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="status-badge">Active Scene: Sweet Bite</div>

      <h1 id="jlwme7" className="title-main font-serif italic mb-12">
        Now feed me the first bite 😚❤️
      </h1>

      <div className="flex flex-col md:flex-row items-center gap-20">
        {/* Person Photo (The Target) */}
        <div className="relative">
          <motion.div
            ref={targetRef}
            animate={isFed ? { scale: [1, 1.1, 1] } : {}}
            className={`w-64 h-64 rounded-[40px] border-4 border-white shadow-2xl overflow-hidden bg-pink-100/50 flex items-center justify-center relative transition-colors ${isFed ? 'border-pink-deep' : ''}`}
          >
            {photoUrl ? (
              <img src={photoUrl} alt="Target" className="w-full h-full object-cover" />
            ) : (
              <label className="cursor-pointer flex flex-col items-center p-4 text-center">
                <Plus className="w-10 h-10 text-pink-deep/30 mb-2" />
                <span className="label-tiny">Your Photo here</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}

            {/* Blush Effect */}
            <AnimatePresence>
              {isFed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.6 }}
                  className="absolute inset-0 bg-pink-deep mix-blend-soft-light"
                />
              )}
            </AnimatePresence>
          </motion.div>
          
          {isFed && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap bg-pink-deep text-white px-6 py-2 rounded-full font-bold shadow-lg"
            >
              Yummy! 😚❤️
            </motion.div>
          )}

          {/* Hearts Exploding */}
          {isFed && [...Array(10)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
              animate={{ 
                x: (Math.random() - 0.5) * 400, 
                y: -(Math.random() * 400 + 100),
                opacity: 0,
                scale: 2
              }}
              transition={{ duration: 2 }}
              className="absolute top-1/2 left-1/2 text-2xl"
            >
              ❤️
            </motion.div>
          ))}
        </div>

        {/* Cake Piece (The Draggable) */}
        {!isFed && (
          <div className="relative">
            <motion.div
              id="cake-piece"
              drag
              dragConstraints={{ left: -1000, right: 1000, top: -1000, bottom: 1000 }}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.2, rotate: 10 }}
              className="w-24 h-24 text-6xl cursor-grab active:cursor-grabbing flex items-center justify-center z-50"
            >
              🍰
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-pink-400 font-bold whitespace-nowrap"
            >
              Drag me! 👆
            </motion.div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isFed && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
          >
            <h2 id="jlwm0s" className="text-4xl md:text-6xl font-black text-pink-600 text-center drop-shadow-lg p-8">
              Best husband award unlocked ❤️
            </h2>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
