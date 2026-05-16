import React from 'react';
import { motion } from 'motion/react';
import { GlassCard } from './Shared';
import { TERMS_AND_CONDITIONS } from '../constants';

interface Props {
  onAgree: () => void;
}

export const TermsScreen: React.FC<Props> = ({ onAgree }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-pink-50/30">
      <GlassCard className="w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden relative">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black text-pink-deep mb-2">{TERMS_AND_CONDITIONS.header}</h1>
          <p className="text-sm text-zinc-600 italic px-4">{TERMS_AND_CONDITIONS.intro}</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-4 space-y-8 scroll-smooth custom-scrollbar">
          <div className="space-y-6">
            <h2 className="text-lg font-black text-pink-deep border-b border-pink-100 pb-2 flex items-center gap-2">
              🌸 TERMS & CONDITIONS OF LOVING ME ❤️
            </h2>
            {TERMS_AND_CONDITIONS.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h3 className="font-bold text-zinc-800">{section.title}</h3>
                <p className="text-sm text-zinc-600 leading-relaxed whitespace-pre-wrap">{section.content}</p>
              </div>
            ))}
            
            {/* Added a few more from the prompt not in the shortened sections array */}
            <div className="space-y-2">
              <h3 className="font-bold text-zinc-800">7. Phone Call Agreement 📞</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">You are strictly prohibited from suddenly cutting phone calls whenever you want 😤 Before ending any call: talk with me properly, try to solve the issue calmly, communicate respectfully.</p>
            </div>
            
             <div className="space-y-2">
              <h3 className="font-bold text-zinc-800">10. Fight Resolution Policy 😅</h3>
              <p className="text-sm text-zinc-600 leading-relaxed">In case of arguments: no ego allowed 🚫, no silent treatment 🚫. Instead: communicate, understand each other, hug immediately 🫂❤️</p>
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-pink-100">
            <h2 className="text-lg font-black text-pink-deep">{TERMS_AND_CONDITIONS.privacy.title}</h2>
            <p className="text-sm text-zinc-600 leading-relaxed italic">{TERMS_AND_CONDITIONS.privacy.content}</p>
          </div>

          <div className="bg-pink-100/50 p-6 rounded-2xl text-center space-y-4">
            <h3 className="font-black text-pink-deep uppercase tracking-widest text-sm">Final Declaration</h3>
            <p className="text-xs text-zinc-500">By clicking below, you confirm that you will love me endlessly, stay patient, and never intentionally hurt me ❤️</p>
          </div>
        </div>

        <div className="pt-6 mt-4 border-t border-pink-100 flex justify-center">
          <motion.button
            id="rx4u3u"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAgree}
            className="bg-pink-deep text-white px-12 py-4 rounded-full font-black text-xl shadow-lg shadow-pink-900/20"
          >
            I Agree ❤️
          </motion.button>
        </div>
      </GlassCard>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(157, 23, 77, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(157, 23, 77, 0.2);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
};
