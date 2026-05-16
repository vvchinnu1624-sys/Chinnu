import { motion, AnimatePresence } from 'motion/react';
import React, { useState } from 'react';
import { Lock, Heart } from 'lucide-react';
import { GlassCard } from './Shared';

interface Props {
  onUnlock: () => void;
}

export const PasswordScreen: React.FC<Props> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === '1624') {
      setIsUnlocked(true);
      setTimeout(onUnlock, 3500); // Longer transition for cinematic effect
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[500px] h-[500px] bg-pink-600/20 rounded-full blur-[120px]" />
      </div>

      <AnimatePresence>
        {!isUnlocked ? (
          <div className="unlock-screen fixed inset-0 z-[100] flex flex-col items-center justify-center p-4">
            <motion.div
              animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="text-center"
            >
              <div className="heart-lock text-8xl mb-8 filter drop-shadow-[0_0_20px_#9D174D]">
                ❤️
              </div>

              <h1 id="jlwmkw" className="font-serif italic text-white text-3xl mb-12">
                Only you can unlock this heart chinnu ❤️
              </h1>

              <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="pass-input font-mono outline-none"
                  autoFocus
                />
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-pink-400 font-medium"
                  >
                    Incorrect heartbeat password...
                  </motion.p>
                )}

                <button
                  type="submit"
                  className="bg-pink-deep text-white rounded-full px-12 py-3 font-semibold shadow-[0_4px_15px_rgba(157,23,77,0.3)] hover:scale-105 transition-transform"
                >
                  Enter Heart
                </button>
              </form>
            </motion.div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center z-[101] relative"
          >
             <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: [0, 2, 5, 50],
                opacity: [1, 1, 1, 0]
              }}
              transition={{ duration: 2.5, ease: "easeInOut" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            >
              <div className="w-20 h-20 bg-white rounded-full blur-[40px] shadow-[0_0_100px_white]" />
            </motion.div>

            <motion.div
              animate={{ 
                scale: [1, 5, 10],
                opacity: [1, 1, 0],
                rotate: [0, 45, 90]
              }}
              transition={{ duration: 2 }}
              className="text-9xl mb-8 filter drop-shadow-[0_0_30px_#9D174D]"
            >
              ❤️
            </motion.div>
            <h2 id="jlwmj2" className="font-serif italic text-5xl text-white mb-4 drop-shadow-lg">
              Access granted Chinnu mogudu❤️
            </h2>
            <p className="text-white/60 font-serif italic text-xl">Opening your heart's celebration...</p>
            
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               {[...Array(30)].map((_, i) => (
                 <motion.div
                   key={`sparkle-pass-${i}`}
                   initial={{ opacity: 0, y: 0 }}
                   animate={{ 
                     opacity: [0, 1, 0], 
                     y: -500, 
                     x: (Math.random() - 0.5) * 800,
                     scale: [0, 1.5, 0]
                   }}
                   transition={{ duration: 3, delay: i * 0.1 }}
                   className="absolute text-2xl text-yellow-200"
                 >
                   ✨
                 </motion.div>
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
