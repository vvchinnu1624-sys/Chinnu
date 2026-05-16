import React, { useState, useEffect } from 'react';
import { Scene } from './types';
import { PasswordScreen } from './components/PasswordScreen';
import { TermsScreen } from './components/TermsScreen';
import { VideoScene } from './components/VideoScene';
import { CakeScene } from './components/CakeScene';
import { FeedingScene } from './components/FeedingScene';
import { EndingScene } from './components/EndingScene';
import { BackgroundEffects } from './components/Shared';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [currentScene, setCurrentScene] = useState<Scene>(Scene.PASSWORD);
  const [isMidnightMode, setIsMidnightMode] = useState(false);

  useEffect(() => {
    const checkMidnight = () => {
      const now = new Date();
      const hours = now.getHours();
      // Enable midnight mode from 12 AM to 4 AM
      setIsMidnightMode(hours >= 0 && hours < 4);
    };

    checkMidnight();
    const interval = setInterval(checkMidnight, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const renderScene = () => {
    switch (currentScene) {
      case Scene.PASSWORD:
        return <PasswordScreen onUnlock={() => setCurrentScene(Scene.TERMS)} />;
      case Scene.TERMS:
        return <TermsScreen onAgree={() => setCurrentScene(Scene.VIDEO)} />;
      case Scene.VIDEO:
        return <VideoScene onNext={() => setCurrentScene(Scene.CAKE_INTERACTIVE)} />;
      case Scene.CAKE_INTERACTIVE:
        return <CakeScene onNext={() => setCurrentScene(Scene.FEEDING)} />;
      case Scene.FEEDING:
        return <FeedingScene onNext={() => setCurrentScene(Scene.ENDING)} />;
      case Scene.ENDING:
        return <EndingScene />;
      default:
        return <PasswordScreen onUnlock={() => setCurrentScene(Scene.TERMS)} />;
    }
  };

  return (
    <div className={`min-h-screen relative font-sans main-stage ${isMidnightMode ? 'midnight-mode' : ''}`}>
      <BackgroundEffects />
      
      {isMidnightMode && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none w-full px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              boxShadow: ["0 0 10px #D97706", "0 0 30px #D97706", "0 0 10px #D97706"]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-black/80 backdrop-blur-md px-8 py-3 rounded-full border border-gold/50 text-gold text-lg md:text-xl font-serif italic inline-flex items-center gap-3"
          >
            <span className="animate-pulse">✨</span>
            Even at midnight, my heart still chooses you ❤️
            <span className="animate-pulse">✨</span>
          </motion.div>
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={currentScene}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10"
        >
          {renderScene()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
