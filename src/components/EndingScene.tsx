import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Plus, Image as ImageIcon, Sparkles, Mail, MessageCircle, X, Music, Edit2, Check, Video as VideoIcon, Trash2, Maximize2, Mic, Square, Reply, Send } from 'lucide-react';
import { GlassCard } from './Shared';
import { OPEN_WHEN_TICKETS, LOVE_LETTER, INITIAL_STORIES } from '../constants';
import confetti from 'canvas-confetti';
import { Mistake, QuizQuestion } from '../types';
import { db, auth, ensureAuth, loginWithGoogle } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc, collection, onSnapshot, deleteDoc, query, where, addDoc, serverTimestamp, getDocs, orderBy, limit } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

// Constant ID for the shared surprise
const SURPRISE_ID = 'main_birthday_surprise';

export const EndingScene: React.FC = () => {
  const [photos, setPhotos] = useState<{id: string, url: string}[]>([]);
  const [videos, setVideos] = useState<{id: string, url: string}[]>([]);
  const [voices, setVoices] = useState<{id: string, url: string}[]>([]);
  const [stories, setStories] = useState(INITIAL_STORIES);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [quiz, setQuiz] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activeVoiceIndex, setActiveVoiceIndex] = useState<number | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<typeof OPEN_WHEN_TICKETS[0] | null>(null);
  const [showSecret, setShowSecret] = useState(false);
  const [isCinematic, setIsCinematic] = useState(false);
  const [editingStoryId, setEditingStoryId] = useState<string | null>(null);
  const [zoomPhoto, setZoomPhoto] = useState<string | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);

  // Mistake form state
  const [mistakeName, setMistakeName] = useState('');
  const [mistakeText, setMistakeText] = useState('');

  // Quiz form state
  const [quizQuestion, setQuizQuestion] = useState('');
  const [quizAnswer, setQuizAnswer] = useState('');

  // Sync with Firebase
  useEffect(() => {
    let unsubscribeDoc: () => void;
    let unsubscribeMemories: () => void;
    let unsubscribeMistakes: () => void;
    let unsubscribeQuiz: () => void;
    
    const initSync = async () => {
      try {
        const currentUser = await ensureAuth();
        setUser(currentUser);

        // Track auth changes
        const authUnsub = onAuthStateChanged(auth, (u) => {
          setUser(u);
        });

        // Listen to global surprise document for stories and metadata
        const docRef = doc(db, 'surprises', SURPRISE_ID);
        unsubscribeDoc = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (data.stories) setStories(data.stories);
          } else if (currentUser) {
            // Only initialize if we have a user (though SURPRISE_ID is global here)
            setDoc(docRef, { stories: INITIAL_STORIES, createdAt: serverTimestamp() });
          }
        });

        // Listen to memories collection
        const memoriesRef = collection(db, 'surprises', SURPRISE_ID, 'memories');
        unsubscribeMemories = onSnapshot(memoriesRef, (snapshot) => {
          const allMemories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as any)).sort((a, b) => {
            const timeA = a.createdAt?.toMillis?.() || Date.now();
            const timeB = b.createdAt?.toMillis?.() || Date.now();
            return timeB - timeA;
          });

          const p: {id: string, url: string}[] = [];
          const v: {id: string, url: string}[] = [];
          const vo: {id: string, url: string}[] = [];
          
          allMemories.forEach(data => {
            const memory = { id: data.id, url: data.url };
            if (data.type === 'photo') p.push(memory);
            if (data.type === 'video') v.push(memory);
            if (data.type === 'voice') vo.push(memory);
          });
          setPhotos(p);
          setVideos(v);
          setVoices(vo);
        });

        // Listen to mistakes
        const mistakesRef = collection(db, 'surprises', SURPRISE_ID, 'mistakes');
        unsubscribeMistakes = onSnapshot(mistakesRef, (snapshot) => {
          const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
            .sort((a, b) => (b.createdAt?.toMillis?.() || Date.now()) - (a.createdAt?.toMillis?.() || Date.now()));
          setMistakes(sorted);
        });

        // Listen to quiz
        const quizRef = collection(db, 'surprises', SURPRISE_ID, 'quiz');
        unsubscribeQuiz = onSnapshot(quizRef, (snapshot) => {
          const sorted = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
            .sort((a, b) => (b.createdAt?.toMillis?.() || Date.now()) - (a.createdAt?.toMillis?.() || Date.now()));
          setQuiz(sorted);
        });

        setIsLoading(false);
        return () => {
          authUnsub();
        };
      } catch (err) {
        console.error("Firebase Sync Error:", err);
        setIsLoading(false);
      }
    };

    initSync();
    return () => {
      unsubscribeDoc?.();
      unsubscribeMemories?.();
      unsubscribeMistakes?.();
      unsubscribeQuiz?.();
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 40) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          try {
            const memoriesRef = collection(db, 'surprises', SURPRISE_ID, 'memories');
            await addDoc(memoriesRef, {
              url: base64Audio,
              type: 'voice',
              userId: auth.currentUser?.uid || 'anonymous',
              createdAt: serverTimestamp(),
              replies: []
            });
          } catch (err) {
            console.error("Failed to save recording:", err);
          }
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Please allow microphone access to record voice notes!");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAddReply = async (memoryId: string) => {
    if (!replyText.trim()) return;
    try {
      const memoryRef = doc(db, 'surprises', SURPRISE_ID, 'memories', memoryId);
      const memorySnap = await getDoc(memoryRef);
      if (memorySnap.exists()) {
        const currentReplies = memorySnap.data().replies || [];
        const newReply = {
          id: Date.now().toString(),
          text: replyText,
          author: user?.displayName || 'Someone',
          createdAt: new Date().toISOString()
        };
        await updateDoc(memoryRef, {
          replies: [...currentReplies, newReply]
        });
        setReplyText('');
        setReplyingTo(null);
      }
    } catch (err) {
      console.error("Failed to add reply:", err);
    }
  };

  const emergencyMessage = `chinnu…

manam epudu okate ra ❤️
edaram okate 🫂

entha misunderstanding vachina…
entha godava cheskona kuda…
ardham ayindha? 🥺

I love u chalaaaaaaaaaaaaaaaaaaaaaaa 🫂💋
miss u chalaaaaaaaaaaaaaaaaaaaaaaa 🫂💋`;

  const TypingText = ({ text }: { text: string }) => {
    const [displayed, setDisplayed] = useState('');
    useEffect(() => {
      if (!text) return;
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.slice(0, i));
        i++;
        if (i > text.length) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }, [text]);
    return <div className="whitespace-pre-wrap">{displayed}</div>;
  };

  const PhotoSlideshow = ({ photos }: { photos: {id: string, url: string}[] }) => {
    const [index, setIndex] = useState(0);
    useEffect(() => {
      if (photos.length <= 1) return;
      const interval = setInterval(() => {
        setIndex((prev) => (prev + 1) % photos.length);
      }, 4000);
      return () => clearInterval(interval);
    }, [photos.length]);

    if (photos.length === 0) return null;

    return (
      <div className="w-full max-w-4xl mx-auto aspect-video rounded-[40px] overflow-hidden shadow-2xl relative bg-zinc-900 border-4 border-white">
        <AnimatePresence mode="wait">
          <motion.img
            key={photos[index].id}
            src={photos[index].url}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full object-cover"
          />
        </AnimatePresence>
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
          {photos.map((p) => (
            <div key={p.id} className={`w-2 h-2 rounded-full transition-all ${p.id === photos[index].id ? 'bg-white w-6' : 'bg-white/40'}`} />
          ))}
        </div>
        <div className="absolute top-6 left-6 bg-black/20 backdrop-blur-md px-4 py-2 rounded-full text-white text-xs font-bold uppercase tracking-widest">
          Memory Slideshow ❤️
        </div>
      </div>
    );
  };

  useEffect(() => {
    if (isCinematic) {
       confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#ff69b4', '#9D174D', '#D97706']
      });
      const timer = setTimeout(() => setIsCinematic(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [isCinematic]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'video' | 'voice') => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;

    setIsUploading(true);
    
    // Process files one by one to avoid Firestore load issues
    for (const file of files) {
      // Base64 adds ~33% overhead. Firestore limit is 1,048,487 bytes per doc.
      // 780KB * 1.33 = ~1,037,400 bytes. This is safe.
      const maxSizeBytes = 780 * 1024; 
      
      if (file.size > maxSizeBytes) {
        if (type === 'video') {
          alert(`Video "${file.name}" is too large! 😅\n\nSince we store memories in our private vault (Firestore), videos must be under 780KB.\n\nTips: Use a 1-2 second clip or a low-resolution WhatsApp video! ❤️`);
        } else if (type === 'voice') {
           alert(`Voice note "${file.name}" is too large! Please keep recordings under 40 seconds to save them permanently! ❤️`);
        } else {
          alert(`Photo "${file.name}" is too large. Please compress it first! ❤️`);
        }
        continue;
      }

      await new Promise<void>((resolve) => {
        const reader = new FileReader();
        reader.onload = async (event) => {
          const url = event.target?.result as string;
          try {
            const memoriesRef = collection(db, 'surprises', SURPRISE_ID, 'memories');
            await addDoc(memoriesRef, {
              url,
              type,
              userId: auth.currentUser?.uid || 'anonymous',
              createdAt: serverTimestamp()
            });
          } catch (err) {
            console.error("Upload failed:", err);
            alert(`Failed to save "${file.name}".`);
          }
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    setIsUploading(false);
    e.target.value = '';
  };

    const handleStoryUpdate = async (id: string, content: string) => {
    try {
      const docRef = doc(db, 'surprises', SURPRISE_ID);
      const newStories = { ...stories, [id]: { ...stories[id], content } };
      // Using setDoc with { merge: true } instead of updateDoc to prevent "document does not exist" errors
      await setDoc(docRef, { stories: newStories }, { merge: true });
      setEditingStoryId(null);
    } catch (err) {
      console.error("Story update failed:", err);
    }
  };

  const deleteMemory = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'surprises', SURPRISE_ID, 'memories', id));
    } catch (err) {
      console.error("Delete memory failed:", err);
    }
  };

  const addMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeName || !mistakeText) return;
    try {
      await addDoc(collection(db, 'surprises', SURPRISE_ID, 'mistakes'), {
        name: mistakeName,
        text: mistakeText,
        date: new Date().toLocaleDateString(),
        createdAt: serverTimestamp(),
        userId: auth.currentUser?.uid || 'anonymous'
      });
      setMistakeName('');
      setMistakeText('');
    } catch (err) {
      console.error("Mistake failed:", err);
    }
  };

  const deleteMistake = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'surprises', SURPRISE_ID, 'mistakes', id));
    } catch (err) {
      console.error("Delete mistake error:", err);
    }
  };

  const addQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quizQuestion || !quizAnswer) return;
    try {
      await addDoc(collection(db, 'surprises', SURPRISE_ID, 'quiz'), {
        question: quizQuestion,
        answer: quizAnswer,
        userId: auth.currentUser?.uid || 'anonymous',
        createdAt: serverTimestamp()
      });
      setQuizQuestion('');
      setQuizAnswer('');
    } catch (err) {
      console.error("Quiz add failed:", err);
    }
  };

  const deleteQuiz = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'surprises', SURPRISE_ID, 'quiz', id));
    } catch (err) {
      console.error("Delete quiz error:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50">
        <div className="text-center space-y-4">
          <Heart className="w-12 h-12 text-pink-500 animate-pulse mx-auto" />
          <p className="font-serif italic text-pink-deep">Loading memories for Chinnu... ❤️</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 pb-24 relative overflow-x-hidden main-stage">
      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* Header & Stories Area */}
        <section className="text-center space-y-8 relative">
          <div className="flex flex-wrap justify-center gap-4 mb-4">
             {(!user || user.isAnonymous) ? (
               <button 
                 onClick={() => loginWithGoogle()}
                 className="bg-white text-pink-deep border-2 border-pink-100 p-4 rounded-full shadow-lg cursor-pointer hover:scale-105 transition-transform flex items-center gap-2 px-8"
               >
                 <Heart className="w-5 h-5 fill-pink-500" />
                 <span className="font-bold text-sm">Sync with Google Account</span>
               </button>
             ) : (
               <div className="bg-pink-50 text-pink-deep px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-pink-100">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Logged in as {user.displayName || 'Admin'}
               </div>
             )}
             <div className="flex flex-wrap justify-center gap-4 w-full">
               <label className={`bg-pink-deep text-white p-4 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform group flex items-center gap-2 px-6 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                  {isUploading ? <Heart className="w-5 h-5 animate-pulse" /> : <ImageIcon className="w-5 h-5" />}
                  <span className="font-bold text-xs md:text-sm">{isUploading ? 'Saving...' : 'Add Photos'}</span>
                  <input type="file" multiple accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, 'photo')} />
               </label>
               <label className={`bg-zinc-800 text-white p-4 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform group flex items-center gap-2 px-6 ${isUploading ? 'opacity-50 cursor-wait' : ''}`}>
                  {isUploading ? <Heart className="w-5 h-5 animate-pulse" /> : <VideoIcon className="w-5 h-5" />}
                  <span className="font-bold text-xs md:text-sm">{isUploading ? 'Saving...' : 'Add Videos'}</span>
                  <input type="file" multiple accept="video/*" className="hidden" disabled={isUploading} onChange={(e) => handleFileUpload(e, 'video')} />
               </label>
             </div>
          </div>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="relative inline-block">
             <div className="w-48 h-48 md:w-64 md:h-64 bg-white border-8 border-white rounded-[40px] shadow-2xl overflow-hidden relative rotate-2 group">
                {photos.length > 0 ? (
                  <div className="w-full h-full relative group/main">
                    <img src={photos[0].url} className="w-full h-full object-cover cursor-pointer" alt="Main" onClick={() => setZoomPhoto(photos[0].url)} />
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteMemory(photos[0].id); }}
                      className="absolute top-4 right-4 bg-white/90 p-2 rounded-full text-red-500 opacity-0 group-hover/main:opacity-100 transition-opacity shadow-lg"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <label className="w-full h-full bg-pink-50 flex flex-col items-center justify-center p-4 cursor-pointer hover:bg-pink-100 transition-colors">
                    <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                      <Plus className="text-pink-deep w-8 h-8" />
                    </div>
                    <span className="text-[10px] text-pink-deep/60 uppercase font-black tracking-widest px-8 text-center">Add our best photo ❤️</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                  </label>
                )}
             </div>
             <div className="absolute -top-4 -right-4 bg-pink-deep text-white p-3 rounded-full shadow-lg">
                <Sparkles className="w-6 h-6" />
             </div>
          </motion.div>

          <h1 className="text-4xl md:text-6xl font-serif italic text-pink-deep">Happy 28th Birthday Ra Chinnu Mogudu 🫂💋</h1>
          <p className="text-xl text-pink-deep italic opacity-70">Happy Birthday Wishes from Chinnu Pellam</p>
        </section>

        {/* Story Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.values(stories).map((story: any) => (
            <GlassCard key={story.id} className="relative group">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="label-tiny">{story.date || 'Our Story'}</span>
                  <h3 className="font-serif italic text-2xl text-pink-deep">{story.title}</h3>
                </div>
                <button 
                  onClick={() => setEditingStoryId(story.id)}
                  className="opacity-40 group-hover:opacity-100 p-2 hover:bg-pink-100 rounded-full transition-all text-pink-deep"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>

              {editingStoryId === story.id ? (
                <div className="space-y-4">
                  <textarea 
                    className="w-full bg-white/50 border border-pink-200 rounded-2xl p-4 text-zinc-800 h-32 outline-none focus:ring-2 focus:ring-pink-300"
                    defaultValue={story.content}
                    id={`edit-${story.id}`}
                  />
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditingStoryId(null)} className="px-4 py-2 text-zinc-500 text-sm">Cancel</button>
                    <button 
                      onClick={() => {
                        const val = (document.getElementById(`edit-${story.id}`) as HTMLTextAreaElement).value;
                        handleStoryUpdate(story.id, val);
                      }}
                      className="bg-pink-deep text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-zinc-700 leading-relaxed italic">{story.content}</p>
              )}
            </GlassCard>
          ))}
        </div>

        {/* Love Quiz & Mistakes (Moved Higher) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 pt-8">
          {/* Love Quiz */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-serif italic text-pink-deep">Love Quiz 🧠❤️</h2>
               <div className="flex-1 h-px bg-pink-100" />
            </div>
            <GlassCard className="h-fit mb-6">
                 <h4 className="label-tiny mb-4">Add a New Question</h4>
                 <form onSubmit={addQuiz} className="space-y-4">
                   <input 
                      placeholder="Ask something (e.g. Favorite memory together?)" 
                      value={quizQuestion}
                      onChange={(e) => setQuizQuestion(e.target.value)}
                      className="w-full bg-white/80 border border-pink-100 px-4 py-3 rounded-xl outline-none italic"
                    />
                    <textarea 
                      placeholder="Your Answer..." 
                      value={quizAnswer}
                      onChange={(e) => setQuizAnswer(e.target.value)}
                      className="w-full bg-white/80 border border-pink-100 px-4 py-3 rounded-xl outline-none h-20"
                    />
                    <button type="submit" className="w-full bg-pink-deep text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-900/10">Post Question</button>
                 </form>
               </GlassCard>
               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {quiz.map((q) => (
                    <div key={q.id} className="bg-white/40 p-5 rounded-2xl border border-pink-50 relative group">
                      <div className="flex justify-between items-start mb-3">
                        <p className="font-bold text-zinc-800 pr-8">Q: {q.question}</p>
                        <button onClick={() => deleteQuiz(q.id)} className="text-zinc-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="bg-white/80 p-4 rounded-xl text-pink-deep font-serif italic shadow-sm">A: {q.answer}</p>
                    </div>
                  ))}
                  {quiz.length === 0 && <p className="text-zinc-400 italic text-center py-8">Add some questions for each other! ❤️</p>}
               </div>
          </section>

          {/* Our Mistakes */}
          <section className="space-y-6">
            <div className="flex items-center gap-4">
               <h2 className="text-2xl font-serif italic text-pink-deep">Our Mistakes 😅</h2>
               <div className="flex-1 h-px bg-pink-100" />
            </div>
            <GlassCard className="h-fit mb-6">
                <form onSubmit={addMistake} className="space-y-4">
                  <input 
                    placeholder="His/Her Name" 
                    value={mistakeName}
                    onChange={(e) => setMistakeName(e.target.value)}
                    className="w-full bg-white/80 border border-pink-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-pink-200"
                  />
                  <textarea 
                    placeholder="What was the mistake? (It will stay here forever...)" 
                    value={mistakeText}
                    onChange={(e) => setMistakeText(e.target.value)}
                    className="w-full bg-white/80 border border-pink-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-pink-200 h-20"
                  />
                  <button type="submit" className="w-full bg-pink-deep text-white py-3 rounded-xl font-bold shadow-lg shadow-pink-900/10">Submit Mistake</button>
                </form>
              </GlassCard>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {mistakes.map((m) => (
                  <div key={m.id} className="bg-white/40 p-4 rounded-xl border border-pink-50 flex justify-between group">
                    <div>
                      <div className="label-tiny mb-1">{m.name} • {m.date}</div>
                      <p className="text-zinc-700 italic">"{m.text}"</p>
                    </div>
                    <button onClick={() => deleteMistake(m.id)} className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {mistakes.length === 0 && <p className="text-zinc-400 italic text-center py-8">All clean! No mistakes reported yet. 😌</p>}
              </div>
          </section>
        </div>

        {/* Photo Slideshow Section */}
        {photos.length > 1 && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center">
              <h2 className="text-3xl font-serif italic text-pink-deep">Our Beautiful Journey ✨</h2>
              <p className="text-pink-deep/60 text-sm mt-2 font-bold uppercase tracking-widest">Reliving our best moments together</p>
            </div>
            <PhotoSlideshow photos={photos} />
          </motion.section>
        )}

        {/* Media Grids */}
        <section className="space-y-12">
          {/* Photos */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end border-b border-pink-100 pb-4 gap-4">
              <h2 className="text-3xl font-serif italic text-pink-deep">Our Memories 📸</h2>
              <div className="flex gap-2">
                <label className="bg-white px-4 py-2 rounded-full text-xs md:text-sm font-bold text-pink-deep shadow-sm cursor-pointer hover:bg-pink-50 flex items-center gap-2 border border-pink-100">
                  <ImageIcon className="w-4 h-4" /> + Add Photos
                  <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'photo')} />
                </label>
                <label className="bg-white px-4 py-2 rounded-full text-xs md:text-sm font-bold text-pink-deep shadow-sm cursor-pointer hover:bg-pink-50 flex items-center gap-2 border border-pink-100">
                  <VideoIcon className="w-4 h-4" /> + Add Videos
                  <input type="file" multiple accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                </label>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {photos.map((item) => (
                <motion.div key={item.id} whileHover={{ scale: 1.05 }} className="relative aspect-square group cursor-pointer" onClick={() => setZoomPhoto(item.url)}>
                  <img src={item.url} className="w-full h-full object-cover rounded-2xl shadow-md" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                    <Maximize2 className="text-white w-6 h-6" />
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); deleteMemory(item.id); }}
                    className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full text-red-500 md:opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all shadow-sm z-10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Videos & Voices Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <GlassCard>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif italic text-2xl text-pink-deep">Video Clips 🎥</h3>
                <label className="cursor-pointer text-pink-deep p-2 hover:bg-pink-100 rounded-full transition-colors">
                  <Plus className="w-6 h-6" />
                  <input type="file" multiple accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                </label>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videos.map((item) => (
                  <div key={item.id} className="relative group">
                    <video 
                      src={item.url} 
                      controls 
                      playsInline 
                      preload="metadata" 
                      className="w-full rounded-xl shadow-sm" 
                    />
                    <button 
                      onClick={() => deleteMemory(item.id)}
                      className="absolute -top-2 -right-2 bg-white p-2 rounded-full text-red-500 md:opacity-0 group-hover:opacity-100 shadow-md z-10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              {videos.length === 0 && <p className="text-zinc-400 italic text-center py-8">No videos added yet</p>}
            </GlassCard>

            <GlassCard>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-serif italic text-2xl text-pink-deep">Voice Notes 🎵</h3>
                <div className="flex items-center gap-2">
                  {isRecording && (
                    <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      <span className="text-xs font-bold text-red-600">{formatTime(recordingTime)} / 0:40</span>
                    </div>
                  )}
                  {voices.length > 0 && !isRecording && (
                    <button 
                      onClick={() => setActiveVoiceIndex(0)}
                      className="text-[10px] font-black uppercase tracking-widest bg-pink-100 text-pink-deep px-4 py-2 rounded-full hover:bg-pink-deep hover:text-white transition-all shadow-sm"
                    >
                      Play All
                    </button>
                  )}
                  <button 
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-pink-100 text-pink-deep hover:bg-pink-200'}`}
                    title={isRecording ? "Stop Recording" : "Record Voice Note"}
                  >
                    {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <label className="cursor-pointer text-pink-deep p-2 hover:bg-pink-100 rounded-full transition-colors">
                    <Plus className="w-6 h-6" />
                    <input type="file" multiple accept="audio/*" className="hidden" onChange={(e) => handleFileUpload(e, 'voice')} />
                  </label>
                </div>
              </div>
              <div className="space-y-4">
                {voices.map((item, i) => (
                  <div key={item.id} className="space-y-2">
                    <div className={`bg-white/60 p-4 rounded-xl flex items-center gap-4 group transition-all ${activeVoiceIndex === i ? 'ring-2 ring-pink-400 bg-pink-50' : ''}`}>
                      <Music className={`shrink-0 w-6 h-6 ${activeVoiceIndex === i ? 'text-pink-500 animate-bounce' : 'text-pink-deep'}`} />
                      <audio 
                        src={item.url} 
                        controls 
                        className="flex-1 h-8" 
                        autoPlay={activeVoiceIndex === i}
                        onPlay={() => setActiveVoiceIndex(i)}
                        onEnded={() => {
                          if (activeVoiceIndex === i && i < voices.length - 1) {
                            setActiveVoiceIndex(i + 1);
                          } else if (i === voices.length - 1) {
                            setActiveVoiceIndex(null);
                          }
                        }}
                      />
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setReplyingTo(replyingTo === item.id ? null : item.id)}
                          className="p-2 text-zinc-400 hover:text-pink-500 transition-colors"
                          title="Reply"
                        >
                          <Reply className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteMemory(item.id)}
                          className="p-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Replies Section */}
                    <div className="ml-8 space-y-2">
                      {(item as any).replies?.map((reply: any) => (
                        <div key={reply.id} className="bg-pink-50/50 p-3 rounded-2xl border border-pink-100/50 flex flex-col">
                          <span className="text-[10px] font-bold text-pink-deep/60">{reply.author}</span>
                          <p className="text-sm text-zinc-700 italic">{reply.text}</p>
                        </div>
                      ))}
                      
                      {replyingTo === item.id && (
                        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2">
                          <input 
                            autoFocus
                            placeholder="Type a reply..."
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddReply(item.id)}
                            className="flex-1 bg-white border border-pink-100 rounded-xl px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-200"
                          />
                          <button 
                            onClick={() => handleAddReply(item.id)}
                            className="bg-pink-deep text-white p-2 rounded-xl"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ))}
                {voices.length === 0 && <p className="text-zinc-400 italic text-center py-8">No voice notes added yet</p>}
              </div>
            </GlassCard>
          </div>
        </section>


        {/* Open WhenTickets Area */}
        <section className="space-y-8">
           <div className="flex items-center gap-4">
             <h2 className="text-3xl font-serif italic text-pink-deep">Open When... 🎫</h2>
             <div className="flex-1 h-px bg-pink-100" />
           </div>
           <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
             {OPEN_WHEN_TICKETS.map(ticket => (
               <motion.button
                 key={ticket.id}
                 whileHover={{ x: 10 }}
                 onClick={() => setSelectedTicket(ticket)}
                 className="bg-white/40 p-6 rounded-3xl border border-pink-50 text-left hover:bg-white transition-all shadow-sm group flex items-center gap-6"
               >
                 <div className="text-4xl group-hover:scale-125 transition-transform shrink-0">{ticket.emoji}</div>
                 <div className="label-tiny !mb-0 text-lg md:text-xl">{ticket.title}</div>
               </motion.button>
             ))}
           </div>
        </section>

        {/* Big Heart Wish Button */}
        <section className="py-20 flex flex-col items-center gap-8">
           <motion.button 
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              onClick={() => {
                setIsCinematic(true);
                setTimeout(() => setShowSecret(true), 1500);
              }}
              className="w-48 h-48 md:w-64 md:h-64 flex items-center justify-center bg-white rounded-full shadow-[0_0_50px_rgba(157,23,77,0.2)] border-8 border-pink-100 group"
           >
              <Heart className="w-32 h-32 md:w-48 md:h-48 text-pink-deep fill-pink-deep/10 group-hover:fill-pink-deep transition-all" />
           </motion.button>
           <h3 className="text-2xl font-serif italic text-pink-deep">Click my big heart Ra Chinnu Mogudu ❤️</h3>
        </section>

        <div className="flex justify-center pb-20 px-4">
           <motion.button
             whileHover={{ scale: 1.05, rotate: [0, -1, 1, -1, 1, 0] }}
             onClick={() => setShowEmergency(true)}
             className="bg-pink-deep text-white px-8 py-4 md:px-10 md:py-5 rounded-[30px] font-black text-base md:text-lg shadow-xl flex items-center gap-3 border-4 border-white/20 group text-center"
           >
             <MessageCircle className="w-5 h-5 md:w-6 md:h-6 group-hover:animate-bounce shrink-0" />
             Open only when we fight 😅
           </motion.button>
        </div>
      </div>

      {/* MODALS */}
      <AnimatePresence>
        {selectedTicket && (
          <div className="fixed inset-0 z-[290] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }} 
              className="bg-white rounded-[40px] p-8 md:p-12 max-w-xl w-full relative text-center shadow-2xl border-4 border-pink-50"
            >
               <div className="text-7xl mb-6">{selectedTicket.emoji}</div>
               <h2 className="text-2xl font-black text-pink-deep mb-8">{selectedTicket.title}</h2>
               <div className="bg-pink-50 p-6 rounded-3xl text-lg italic text-zinc-700 leading-relaxed min-h-[120px] flex items-center justify-center">
                 <TypingText text={selectedTicket.content} />
               </div>
               
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: (selectedTicket.content.length * 0.05) + 0.5 }}
                 className="mt-8"
               >
                 <button 
                  onClick={() => setSelectedTicket(null)}
                  className="bg-pink-deep text-white px-10 py-4 rounded-full font-bold shadow-lg shadow-pink-900/20 hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                 >
                   <Heart className="w-5 h-5 fill-white" /> Keep it safe ❤️
                 </button>
               </motion.div>
            </motion.div>
          </div>
        )}

        {showEmergency && (
          <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              className="absolute inset-0 bg-pink-deep/40 backdrop-blur-3xl" 
              onClick={() => setShowEmergency(false)} 
            />
            <motion.div 
              initial={{ scale: 0.8, x: -10 }} 
              animate={{ 
                scale: 1, 
                x: [0, -5, 5, -5, 5, 0],
                transition: { 
                  x: { duration: 0.5, ease: "easeInOut" },
                  scale: { duration: 0.3 }
                }
              }} 
              exit={{ scale: 0.8, opacity: 0 }} 
              className="bg-white rounded-[50px] p-8 md:p-12 max-w-2xl w-full relative shadow-2xl border-4 border-pink-100"
            >
               <button onClick={() => setShowEmergency(false)} className="absolute top-8 right-8 p-3 hover:bg-pink-50 rounded-full text-pink-deep">
                 <X className="w-8 h-8" />
               </button>
               <div className="text-center space-y-8">
                  <div className="inline-block bg-pink-50 p-4 rounded-full mb-4">
                    <Heart className="w-12 h-12 text-pink-500 fill-pink-500 animate-pulse" />
                  </div>
                  <h2 className="text-3xl font-black text-pink-deep italic">Emergency Love Message ❤️</h2>
                  <div className="bg-pink-50/50 p-8 rounded-[40px] text-left text-xl md:text-2xl font-serif italic text-zinc-800 leading-relaxed shadow-inner">
                    <TypingText text={emergencyMessage} />
                  </div>
                  <p className="text-pink-deep/60 text-sm font-bold uppercase tracking-widest">Read this carefully chinnu mogudu 🫂</p>
               </div>
            </motion.div>
          </div>
        )}

        {showSecret && (
          <div className="fixed inset-0 z-[210] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-purple-950/90 backdrop-blur-xl" onClick={() => setShowSecret(false)} />
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="bg-black/40 border border-white/20 p-8 md:p-12 max-w-3xl w-full max-h-[90vh] overflow-y-auto relative rounded-[50px] shadow-2xl custom-scrollbar text-white">
               <button onClick={() => setShowSecret(false)} className="absolute top-8 right-8 p-3 bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
               <div className="text-center mb-12">
                  <div className="label-tiny text-pink-400 mb-2">Private & Confidential</div>
                  <h2 className="text-4xl md:text-5xl font-serif italic mb-4">My Secret Wish for You...</h2>
                  <Heart className="w-12 h-12 text-pink-500 fill-pink-500 mx-auto animate-pulse" />
               </div>
               
               <div className="space-y-8 text-xl md:text-2xl font-serif italic text-zinc-100 leading-relaxed">
                  <p className="bg-white/5 p-8 rounded-[40px]">
                    chinnu nv nilla undu please na maraku nv alla marinapudu nunchi naki bayam ga undhi enduko nalla cheyaku please 🥺🙏😭ardham Chesko nv nilla ne undu nenu marutha enka manchiga unta sare na nenu em chesthe nv adhe reverse ◀️ lo naki chestha unavu adhi naki nachaledhu anduke ........... please 🥺
                  </p>
                  
                  <div className="border-t border-white/10 pt-8 mt-12">
                    <p className="text-pink-300 font-bold mb-4">A Heartfelt Message:</p>
                    <div className="whitespace-pre-wrap text-lg md:text-xl">{LOVE_LETTER}</div>
                  </div>
               </div>
            </motion.div>
          </div>
        )}

        {zoomPhoto && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/95" onClick={() => setZoomPhoto(null)}>
             <motion.img 
                layoutId={`photo-${zoomPhoto}`}
                src={zoomPhoto} 
                className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" 
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
             />
             <button className="absolute top-8 right-8 text-white p-4"><X className="w-10 h-10" /></button>
          </div>
        )}

        {isCinematic && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[205] bg-black flex items-center justify-center pointer-events-none">
             <motion.div animate={{ scale: [1, 2, 50], opacity: [1, 1, 0] }} transition={{ duration: 2 }} className="text-9xl">❤️</motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(157, 23, 77, 0.05); }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(157, 23, 77, 0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};
