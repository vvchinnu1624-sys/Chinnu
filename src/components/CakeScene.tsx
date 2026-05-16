import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';

interface Props {
  onNext: () => void;
}

export const CakeScene: React.FC<Props> = ({ onNext }) => {
  const [isCut, setIsCut] = useState(false);
  const [candlesLit, setCandlesLit] = useState(true);
  const cakeRef = useRef<HTMLDivElement>(null);

  const handleCut = () => {
    if (isCut) return;
    setIsCut(true);
    setCandlesLit(false);
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#ff69b4', '#ff1493', '#ffc0cb', '#ffffff']
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative main-stage select-none overflow-hidden">
      <div className="status-badge">Birthday Ritual</div>
      
      <AnimatePresence>
        {!isCut && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center mb-12 z-10"
          >
            <h1 className="text-3xl md:text-4xl font-serif italic mb-3 text-pink-deep px-4">
              Chinnu kallu 👀 musko ediya korika koruko❤️
            </h1>
            <p className="font-serif italic text-pink-deep opacity-60">
              Drag the knife 🔪 across the cake to cut!
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative group">
        {/* The Cake Container */}
        <motion.div 
          ref={cakeRef}
          animate={isCut ? { rotateX: 5, scale: 0.98 } : {}}
          className="relative w-72 h-72 md:w-96 md:h-96"
        >
          {/* Half 1 (Left) */}
          <motion.div 
            animate={isCut ? { x: -50, rotate: -8, opacity: 0.95 } : { x: 0, rotate: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="absolute inset-0 bg-white rounded-full shadow-2xl overflow-hidden border-4 border-pink-50"
            style={{ clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)' }}
          >
            <div 
              className="w-full h-full flex items-center justify-center text-center p-8 bg-cover bg-center ring-inset ring-8 ring-white/30"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=500&auto=format&fit=crop)' }}
            >
               <span className="font-serif italic text-xl md:text-3xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight">
                 Happy Birthday<br/>Chinnu Mogudu 🫂
               </span>
            </div>
            {/* Candles on left half */}
            {candlesLit && (
              <div className="absolute top-1/4 left-1/4 flex gap-2">
                <div className="w-2 h-10 md:h-14 bg-gradient-to-t from-pink-400 to-pink-200 rounded-full relative">
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }} 
                    transition={{ repeat: Infinity, duration: 0.6 }} 
                    className="absolute -top-5 md:-top-7 left-1/2 -translate-x-1/2 w-3 h-6 md:w-4 md:h-8 bg-orange-400 rounded-full blur-[2px] shadow-[0_0_15px_#fb923c]" 
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Half 2 (Right) */}
          <motion.div 
            animate={isCut ? { x: 50, rotate: 8, opacity: 0.95 } : { x: 0, rotate: 0 }}
            transition={{ type: 'spring', damping: 12 }}
            className="absolute inset-0 bg-white rounded-full shadow-2xl overflow-hidden border-4 border-pink-50"
            style={{ clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)' }}
          >
            <div 
              className="w-full h-full flex items-center justify-center text-center p-8 bg-cover bg-center ring-inset ring-8 ring-white/30"
              style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?q=80&w=500&auto=format&fit=crop)' }}
            >
               <span className="font-serif italic text-xl md:text-3xl text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] leading-tight">
                 Happy Birthday<br/>Chinnu Mogudu 🫂
               </span>
            </div>
             {/* Candles on right half */}
             {candlesLit && (
              <div className="absolute top-2/3 right-1/4 flex gap-2">
                <div className="w-2 h-10 md:h-14 bg-gradient-to-t from-pink-400 to-pink-200 rounded-full relative">
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.8, 1, 0.8] }} 
                    transition={{ repeat: Infinity, duration: 0.8 }} 
                    className="absolute -top-5 md:-top-7 left-1/2 -translate-x-1/2 w-3 h-6 md:w-4 md:h-8 bg-orange-400 rounded-full blur-[2px] shadow-[0_0_15px_#fb923c]" 
                  />
                </div>
              </div>
            )}
          </motion.div>

          {/* Frosting Details (Dots around edge) */}
          <div className="absolute inset-4 rounded-full border-4 border-dotted border-pink-100 pointer-events-none" />
        </motion.div>

        {/* The Knife 🔪 */}
        {!isCut && (
          <motion.div
            drag
            dragElastic={0.1}
            dragConstraints={{ left: -300, right: 300, top: -300, bottom: 300 }}
            onDragEnd={(e, info) => {
              const rect = cakeRef.current?.getBoundingClientRect();
              if (rect) {
                const centerX = rect.left + rect.width / 2;
                // If dragged across the center line vertically
                if (Math.abs(info.point.x - centerX) < 50) {
                  handleCut();
                }
              }
            }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.95, rotate: -15, cursor: 'grabbing' }}
            initial={{ x: 200, y: -100 }}
            className="absolute cursor-grab z-50 flex flex-col items-center"
          >
            <div className="text-7xl md:text-9xl drop-shadow-2xl select-none filter group-hover:brightness-110">🔪</div>
            <motion.div 
               animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
               transition={{ repeat: Infinity, duration: 1.5 }}
               className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-[10px] font-black uppercase tracking-widest text-pink-deep border border-pink-100 mt-2"
            >
              Cut the cake!
            </motion.div>
          </motion.div>
        )}
      </div>

      {isCut && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center z-10"
        >
          <motion.h2 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-3xl md:text-4xl font-serif italic text-pink-deep mb-8 px-6"
          >
             Yaaay! Happy Birthday to the best husband! ❤️
          </motion.h2>
          <button
            onClick={onNext}
            className="bg-gradient-to-r from-pink-600 to-pink-500 text-white px-12 py-4 rounded-full font-bold text-lg shadow-[0_10px_20px_rgba(157,23,77,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 mx-auto border-b-4 border-pink-700"
          >
            Taste the Magic 🍰
          </button>
        </motion.div>
      )}

      {/* Decorative Floating Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
         {[...Array(12)].map((_, i) => (
           <motion.div
             key={`flower-${i}`}
             initial={{ y: -50, x: `${Math.random() * 100}%`, rotate: 0 }}
             animate={{ y: '120vh', rotate: 360 }}
             transition={{ duration: 15 + Math.random() * 15, repeat: Infinity, delay: Math.random() * 10 }}
             className="text-3xl"
           >
             {['🌸', '✨', '💖', '🎂'][Math.floor(Math.random() * 4)]}
           </motion.div>
         ))}
      </div>
    </div>
  );
};

