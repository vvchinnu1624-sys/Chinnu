import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Video, Plus, Check } from 'lucide-react';
import { GlassCard } from './Shared';

interface Props {
  onNext: () => void;
}

export const VideoScene: React.FC<Props> = ({ onNext }) => {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="status-badge">Active Scene: Memory Reel</div>
      
      <motion.h1 
        id="Na Chinnu mogudu ki❤️"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl md:text-5xl font-serif italic text-pink-deep mb-8 text-center"
      >
        Na Chinnu mogudu ki❤️
      </motion.h1>

      <GlassCard className="w-full max-w-2xl overflow-hidden aspect-video relative flex flex-col items-center justify-center">
        {videoUrl ? (
          <video 
            src={videoUrl} 
            controls 
            autoPlay 
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          <iframe
            className="w-full h-full rounded-2xl"
            src="https://www.youtube.com/embed/W6Zmvb9-SfE"
            title="Birthday Video"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        )}
      </GlassCard>

      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <label className="cursor-pointer bg-white border border-pink-200 text-pink-600 px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-pink-50 transition-all">
          <Plus className="w-5 h-5" /> Change Video
          <input 
            type="file" 
            accept="video/*" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </label>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={onNext}
          className="flex items-center gap-2 bg-pink-deep text-white px-8 py-4 rounded-full font-bold shadow-lg shadow-pink-900/20 hover:scale-105 transition-transform"
        >
          Finished Watching <Check className="w-5 h-5" />
        </motion.button>
      </div>

      <button 
        onClick={onNext}
        className="mt-4 text-pink-400 hover:text-pink-600 transition-colors underline underline-offset-4"
      >
        Skip to Cake Cutting
      </button>
    </div>
  );
};
