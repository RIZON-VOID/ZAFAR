import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  MessageSquare, 
  LayoutDashboard, 
  Calendar, 
  Settings, 
  Plus, 
  Send, 
  Mic, 
  Image as ImageIcon, 
  Camera, 
  FileText,
  ChevronLeft,
  Search,
  Trophy,
  Timer,
  CheckCircle2,
  Menu,
  X,
  ArrowDown,
  Package,
  ShoppingBag,
  Palette,
  Award,
  Sparkles,
  Loader2,
  Users,
  Zap,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { UserProfile, Subject, Message, DailyTask, StudyKit, Material, ShopItem, AnswerMode, CommunityQuestion, CommunityAnswer, Flashcard, Note } from './types';
import { generateStudyResponse, analyzeImage, suggestStudyKitMaterials, generateCurriculum, detectSyllabusFromImage, generateFlashcards, generateFlashcardsFromText } from './services/geminiService';
import { cn } from './lib/utils';
import { format, differenceInDays } from 'date-fns';

// --- Components ---

const CommunityFeed = ({ 
  questions, 
  user, 
  onReply, 
  onVote 
}: { 
  questions: CommunityQuestion[]; 
  user: UserProfile; 
  onReply: (qId: string, text: string) => void;
  onVote: (qId: string, type: 'up' | 'down', aId?: string) => void;
}) => {
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Community Feed</h2>
          <p className="text-slate-500">Learn together with other students</p>
        </div>
        <div className="flex items-center gap-2 bg-sky-50 px-4 py-2 rounded-full text-sky-600 font-bold">
          <Users size={20} />
          <span>{questions.length} Active</span>
        </div>
      </header>

      <div className="space-y-6">
        {questions.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-slate-100">
            <MessageSquare size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400">No questions yet. Be the first to ask!</p>
          </div>
        ) : (
          questions.map(q => (
            <motion.div 
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center text-sky-600 font-bold">
                    {q.userName[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{q.userName}</h4>
                    <p className="text-xs text-slate-400">{format(q.timestamp, 'MMM d, h:mm a')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 rounded-xl p-1">
                  <button 
                    onClick={() => onVote(q.id, 'up')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      q.likedBy.includes(user.id) ? "bg-emerald-100 text-emerald-600" : "text-slate-400 hover:text-emerald-500 hover:bg-white"
                    )}
                  >
                    <ThumbsUp size={18} />
                  </button>
                  <span className="text-sm font-bold text-slate-600">{q.upvotes - q.downvotes}</span>
                  <button 
                    onClick={() => onVote(q.id, 'down')}
                    className={cn(
                      "p-2 rounded-lg transition-colors",
                      q.dislikedBy.includes(user.id) ? "bg-rose-100 text-rose-600" : "text-slate-400 hover:text-rose-500 hover:bg-white"
                    )}
                  >
                    <ThumbsDown size={18} />
                  </button>
                </div>
              </div>

              <p className="text-slate-700 leading-relaxed">{q.content}</p>

              <div className="pt-4 border-t border-slate-50 space-y-4">
                <div className="space-y-3">
                  {q.answers.map(a => (
                    <div key={a.id} className="bg-slate-50 rounded-2xl p-4 ml-8 relative">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900">{a.userName}</span>
                          <span className="text-[10px] text-slate-400">{format(a.timestamp, 'h:mm a')}</span>
                        </div>
                        <button 
                          onClick={() => onVote(q.id, 'up', a.id)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors",
                            a.likedBy.includes(user.id) ? "bg-emerald-100 text-emerald-600" : "text-slate-400 hover:bg-white hover:text-emerald-500"
                          )}
                        >
                          <ThumbsUp size={12} /> {a.upvotes}
                        </button>
                      </div>
                      <p className="text-sm text-slate-600">{a.content}</p>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2 ml-8">
                  <input 
                    type="text"
                    value={replyInputs[q.id] || ''}
                    onChange={e => setReplyInputs(prev => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Write a helpful reply..."
                    className="flex-1 bg-slate-50 border-none rounded-xl p-3 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                  <button 
                    onClick={() => {
                      if (replyInputs[q.id]) {
                        onReply(q.id, replyInputs[q.id]);
                        setReplyInputs(prev => ({ ...prev, [q.id]: '' }));
                      }
                    }}
                    className="bg-sky-500 text-white p-3 rounded-xl hover:bg-sky-600 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

const ChatOnboarding = ({ onComplete, loading: parentLoading }: { onComplete: (u: UserProfile, detectedSubjects?: Subject[]) => void; loading: boolean }) => {
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<{ role: 'model' | 'user'; text: string }[]>([
    { role: 'model', text: 'Assalamu Alaikum! I am Zafar, your personal AI teacher. What is your name?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Partial<UserProfile>>({
    name: '',
    class: '',
    roll: '',
    target: '',
    country: 'Bangladesh',
    language: 'English',
    educationType: 'school',
    coins: 0,
    streak: 1,
    onboarded: false,
    isSyllabusVerified: false,
    syllabusConfirmed: false,
    pomodoroSettings: {
      studyDuration: 25,
      breakDuration: 5,
      sound: 'bell'
    }
  });
  const [detectedSubjects, setDetectedSubjects] = useState<Subject[]>([]);
  const [showVerification, setShowVerification] = useState(false);

  const questions = [
    "What is your name?",
    "What is your class?",
    "What is your class roll?",
    "What is your target (goal/rank)?",
    "What is your country?",
    "Which language do you prefer?",
    "Can you upload your syllabus? (Upload a photo or type 'skip')"
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(',')[1];
        const mime = file.type;
        
        setMessages(prev => [...prev, { role: 'user', text: "Uploaded syllabus photo." }]);
        
        try {
          const result = await detectSyllabusFromImage(base64, mime, data as UserProfile);
          setDetectedSubjects(result.subjects);
          
          let updatedData = { ...data, syllabusImage: base64 };

          if (result.examInfo) {
            updatedData.nextExam = result.examInfo;
          }
          
          setData(updatedData);
          setShowVerification(true);
        } catch (error) {
          console.error("Syllabus detection failed", error);
          setMessages(prev => [...prev, { role: 'model', text: "I couldn't read the syllabus clearly. Let's continue manually." }]);
          setStep(step + 1);
          setMessages(prev => [...prev, { role: 'model', text: questions[step + 1] }]);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVerify = async (verified: Subject[]) => {
    const finalData = { ...data, onboarded: true, syllabusConfirmed: true, isSyllabusVerified: true };
    setDetectedSubjects(verified);
    setData(finalData);
    setShowVerification(false);
    setMessages(prev => [...prev, { role: 'model', text: "✅ Syllabus confirmed! Everything is ready." }]);
    setTimeout(() => onComplete(finalData as UserProfile, verified), 1000);
  };

  const handleSkipSyllabus = async () => {
    setLoading(true);
    try {
      const curriculum = await generateCurriculum(data as UserProfile);
      setDetectedSubjects(curriculum);
      setShowVerification(true);
    } catch (error) {
      console.error("Curriculum generation failed", error);
      onComplete({ ...data, onboarded: true, syllabusConfirmed: true } as UserProfile);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    if (!input.trim() && step < 6) return;
    
    const text = input.trim() || (step === 6 ? "Skipped syllabus upload" : "");
    const newMessages = [...messages, { role: 'user' as const, text }];
    setMessages(newMessages);
    
    const currentStep = step;
    const nextStep = step + 1;
    
    let updatedData = { ...data, id: data.id || `user-${Date.now()}` };
    if (currentStep === 0) updatedData.name = text;
    if (currentStep === 1) updatedData.class = text;
    if (currentStep === 2) updatedData.roll = text;
    if (currentStep === 3) updatedData.target = text;
    if (currentStep === 4) updatedData.country = text;
    if (currentStep === 5) updatedData.language = text;
    
    setData(updatedData);
    setInput('');

    if (nextStep < questions.length) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'model', text: questions[nextStep] }]);
        setStep(nextStep);
      }, 600);
    } else {
      if (text.toLowerCase().includes('skip')) {
        handleSkipSyllabus();
      } else {
        // Wait for upload
        setMessages(prev => [...prev, { role: 'model', text: "Please upload your syllabus photo using the button below." }]);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-sky-50 flex flex-col items-center justify-center p-4">
      {showVerification && (
        <SyllabusVerification 
          subjects={detectedSubjects}
          onConfirm={handleVerify}
          onRetry={() => setShowVerification(false)}
        />
      )}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full bg-white rounded-3xl shadow-2xl flex flex-col h-[600px] overflow-hidden border border-sky-100"
      >
        <div className="p-6 bg-sky-500 text-white flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold">Z</div>
          <div>
            <h2 className="font-bold">Zafar Onboarding</h2>
            <p className="text-xs text-sky-100">Setting up your learning journey</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, x: m.role === 'model' ? -10 : 10 }}
              animate={{ opacity: 1, x: 0 }}
              className={cn(
                "max-w-[80%] p-4 rounded-2xl text-sm font-medium",
                m.role === 'model' ? "bg-sky-50 text-slate-700 self-start rounded-tl-none" : "bg-sky-500 text-white self-end rounded-tr-none ml-auto"
              )}
            >
              {m.text}
            </motion.div>
          ))}
          {loading && (
            <div className="flex gap-2 p-4 bg-sky-50 rounded-2xl w-16 items-center justify-center">
              <Loader2 className="animate-spin text-sky-500" size={20} />
            </div>
          )}
        </div>

        <div className="p-4 border-t border-sky-50 flex gap-2">
          {step === 6 && (
            <>
              <input 
                type="file" 
                id="syllabus-upload" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
              <label 
                htmlFor="syllabus-upload"
                className="p-4 bg-sky-100 text-sky-600 rounded-2xl cursor-pointer hover:bg-sky-200 transition-colors"
              >
                <Camera size={20} />
              </label>
            </>
          )}
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleSend()}
            placeholder={step === 6 ? "Type 'skip' or upload photo..." : "Type your answer..."}
            className="flex-1 p-4 bg-sky-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500"
          />
          <button 
            onClick={handleSend}
            className="p-4 bg-sky-500 text-white rounded-2xl shadow-lg shadow-sky-100"
          >
            <Send size={20} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const SyllabusVerification = ({ 
  subjects, 
  onConfirm, 
  onRetry 
}: { 
  subjects: Subject[]; 
  onConfirm: (subjects: Subject[]) => void; 
  onRetry: () => void;
}) => {
  const [editedSubjects, setEditedSubjects] = useState(subjects);

  return (
    <div className="fixed inset-0 z-[110] bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 space-y-6 max-h-[80vh] overflow-y-auto"
      >
        <div className="text-center space-y-2">
          <Sparkles className="mx-auto text-sky-500" size={40} />
          <h2 className="text-2xl font-bold text-slate-900">Syllabus Detected!</h2>
          <p className="text-slate-500">I've analyzed your syllabus. Please check if it's correct:</p>
        </div>

        <div className="space-y-4">
          {editedSubjects.map((subject, sIdx) => (
            <div key={subject.id} className="p-4 bg-sky-50 rounded-2xl border border-sky-100">
              <input 
                type="text" 
                value={subject.name}
                onChange={e => {
                  const newSubs = [...editedSubjects];
                  newSubs[sIdx].name = e.target.value;
                  setEditedSubjects(newSubs);
                }}
                className="font-bold text-sky-700 bg-transparent border-none p-0 focus:ring-0 w-full"
              />
              <div className="mt-2 space-y-1">
                {subject.chapters.map((chapter, cIdx) => (
                  <div key={chapter.id} className="flex items-center gap-2 text-sm text-slate-600">
                    <div className="w-1.5 h-1.5 bg-sky-300 rounded-full" />
                    <input 
                      type="text" 
                      value={chapter.title}
                      onChange={e => {
                        const newSubs = [...editedSubjects];
                        newSubs[sIdx].chapters[cIdx].title = e.target.value;
                        setEditedSubjects(newSubs);
                      }}
                      className="bg-transparent border-none p-0 focus:ring-0 flex-1"
                    />
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-white rounded-full text-sky-500 uppercase">
                      {chapter.term || 'General'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            onClick={onRetry}
            className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold"
          >
            Re-upload / Retry
          </button>
          <button 
            onClick={() => onConfirm(editedSubjects)}
            className="flex-1 py-4 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-200"
          >
            Yes, this is correct!
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const PomodoroTimer = ({ onComplete, settings, onUpdateSettings }: { 
  onComplete: () => void; 
  settings: UserProfile['pomodoroSettings'];
  onUpdateSettings: (s: UserProfile['pomodoroSettings']) => void;
}) => {
  const [timeLeft, setTimeLeft] = useState(settings.studyDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'study' | 'break'>('study');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    setTimeLeft(mode === 'study' ? settings.studyDuration * 60 : settings.breakDuration * 60);
  }, [settings.studyDuration, settings.breakDuration, mode]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      if (mode === 'study') {
        onComplete();
      }
      // Play sound
      if (settings.sound !== 'none') {
        const audio = new Audio(`https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3`); // Placeholder for bell
        audio.play().catch(() => {});
      }
      setMode(m => m === 'study' ? 'break' : 'study');
      setTimeLeft(mode === 'study' ? settings.breakDuration * 60 : settings.studyDuration * 60);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, onComplete, settings.sound, settings.breakDuration, settings.studyDuration]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg", mode === 'study' ? "bg-rose-50 text-rose-500" : "bg-emerald-50 text-emerald-500")}>
            <Timer size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">{mode === 'study' ? 'Study Session' : 'Break Time'}</p>
            <p className="text-xl font-mono font-bold text-slate-700">{formatTime(timeLeft)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-sky-50 rounded-lg text-slate-400"
          >
            <Settings size={18} />
          </button>
          <button 
            onClick={() => setIsActive(!isActive)}
            className={cn(
              "px-4 py-2 rounded-xl font-bold text-sm transition-all",
              isActive ? "bg-slate-100 text-slate-600" : "bg-sky-500 text-white shadow-lg shadow-sky-100"
            )}
          >
            {isActive ? 'Pause' : 'Start'}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pt-2 border-t border-sky-50 space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Study (min)</label>
                <input 
                  type="number" 
                  value={settings.studyDuration}
                  onChange={e => onUpdateSettings({...settings, studyDuration: parseInt(e.target.value) || 1})}
                  className="w-full p-2 bg-sky-50 border-none rounded-lg text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Break (min)</label>
                <input 
                  type="number" 
                  value={settings.breakDuration}
                  onChange={e => onUpdateSettings({...settings, breakDuration: parseInt(e.target.value) || 1})}
                  className="w-full p-2 bg-sky-50 border-none rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Alert Sound</label>
              <select 
                value={settings.sound}
                onChange={e => onUpdateSettings({...settings, sound: e.target.value as any})}
                className="w-full p-2 bg-sky-50 border-none rounded-lg text-xs"
              >
                <option value="bell">Bell</option>
                <option value="chime">Chime</option>
                <option value="digital">Digital</option>
                <option value="none">None</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SubjectWorkspace = ({ 
  subject, 
  onBack, 
  onStudyComplete,
  onUpdateSubject,
  updatePomodoroSettings,
  user,
  flashcards,
  onSaveFlashcards,
  notes,
  onAddNote,
  onDeleteNote
}: { 
  subject: Subject; 
  onBack: () => void; 
  onStudyComplete: () => void;
  onUpdateSubject: (s: Subject) => void;
  updatePomodoroSettings: (s: UserProfile['pomodoroSettings']) => void;
  user: UserProfile;
  flashcards: Flashcard[];
  onSaveFlashcards: (f: Flashcard[]) => void;
  notes: Note[];
  onAddNote: (n: Omit<Note, 'id' | 'timestamp'>) => void;
  onDeleteNote: (id: string) => void;
}) => {
  const [activeTab, setActiveTab] = useState<'study' | 'flashcards' | 'notes'>('study');
  const currentChapter = subject.chapters.find(c => !c.completed) || subject.chapters[0];

  const toggleChapter = (chapterId: string) => {
    const updatedChapters = subject.chapters.map(c => 
      c.id === chapterId ? { ...c, completed: !c.completed } : c
    );
    const completedCount = updatedChapters.filter(c => c.completed).length;
    const progress = Math.round((completedCount / updatedChapters.length) * 100);
    
    // Calculate exam progress
    const examTerm = user.nextExam?.type;
    const examChapters = updatedChapters.filter(c => c.term === examTerm);
    const examCompletedCount = examChapters.filter(c => c.completed).length;
    const examProgress = examChapters.length > 0 
      ? Math.round((examCompletedCount / examChapters.length) * 100)
      : progress; // fallback to overall if no specific chapters for this term

    onUpdateSubject({ ...subject, chapters: updatedChapters, progress, examProgress });
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="p-2 hover:bg-sky-100 rounded-xl text-slate-500">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-slate-900">{subject.name}</h2>
          <div className="flex items-center gap-4 mt-1">
            <div className="flex-1 max-w-xs bg-sky-100 h-2 rounded-full overflow-hidden">
              <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${subject.progress}%` }} />
            </div>
            <span className="text-xs font-bold text-sky-600">{subject.progress}% Complete</span>
          </div>
        </div>
      </header>

      <div className="flex gap-2 border-b border-sky-100">
        <button 
          onClick={() => setActiveTab('study')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all border-b-2",
            activeTab === 'study' ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Study Materials
        </button>
        <button 
          onClick={() => setActiveTab('flashcards')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all border-b-2",
            activeTab === 'flashcards' ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Flashcards
        </button>
        <button 
          onClick={() => setActiveTab('notes')}
          className={cn(
            "px-6 py-3 font-bold text-sm transition-all border-b-2",
            activeTab === 'notes' ? "border-sky-500 text-sky-600" : "border-transparent text-slate-400 hover:text-slate-600"
          )}
        >
          Notes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 space-y-6">
          {activeTab === 'study' ? (
            <>
              <section className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold">Current Topic: {currentChapter?.title}</h3>
                    <p className="text-xs text-slate-400 uppercase font-bold mt-1">Syllabus: {user.country} {user.educationType}</p>
                  </div>
                  {currentChapter && !currentChapter.completed && (
                    <button 
                      onClick={() => toggleChapter(currentChapter.id)}
                      className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-100"
                    >
                      Mark as Completed
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  <p className="text-slate-600 leading-relaxed">
                    This topic covers the essential concepts of {currentChapter?.title} as per the national curriculum.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {currentChapter?.topics.map((topic, i) => (
                      <span key={i} className="px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-[10px] font-bold">
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex gap-3">
                  <button className="px-4 py-2 bg-sky-500 text-white rounded-xl text-sm font-bold">Continue Learning</button>
                  <button className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-sm font-bold">Take Quiz</button>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-lg font-bold">Curriculum Chapters</h3>
                <div className="grid grid-cols-1 gap-3">
                  {subject.chapters.map(chapter => {
                    const isExamChapter = chapter.term === user.nextExam?.type;
                    return (
                      <div 
                        key={chapter.id} 
                        className={cn(
                          "p-4 rounded-2xl border transition-all flex items-center justify-between group",
                          isExamChapter ? "bg-sky-50 border-sky-200 shadow-sm" : "bg-white border-sky-100 shadow-sm hover:border-sky-300"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => toggleChapter(chapter.id)}
                            className={cn(
                              "w-6 h-6 rounded-lg border flex items-center justify-center transition-all",
                              chapter.completed ? "bg-sky-500 border-sky-500 text-white" : "border-sky-200 bg-white"
                            )}
                          >
                            {chapter.completed && <CheckCircle2 size={14} />}
                          </button>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={cn("font-bold text-sm", chapter.completed ? "text-slate-400 line-through" : "text-slate-700")}>
                                {chapter.title}
                              </p>
                              {isExamChapter && (
                                <span className="px-2 py-0.5 bg-sky-500 text-white text-[8px] font-bold rounded-full uppercase">
                                  Exam Focus
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400">{chapter.topics.length} key topics • {chapter.term || 'General'}</p>
                          </div>
                        </div>
                        {!chapter.completed && (
                          <button onClick={() => toggleChapter(chapter.id)} className="text-xs font-bold text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity">
                            Quick Complete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          ) : activeTab === 'flashcards' ? (
            <FlashcardSystem 
              subject={subject}
              chapter={currentChapter}
              user={user}
              flashcards={flashcards}
              onSaveFlashcards={onSaveFlashcards}
            />
          ) : (
            <NotesView 
              notes={notes.filter(n => n.subjectId === subject.id)} 
              subjects={[subject]} 
              onAddNote={(n) => onAddNote({ ...n, subjectId: subject.id })} 
              onDeleteNote={onDeleteNote} 
            />
          )}
        </div>

        <div className="space-y-6">
          <PomodoroTimer 
            onComplete={onStudyComplete} 
            settings={user.pomodoroSettings}
            onUpdateSettings={updatePomodoroSettings}
          />
          <div className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Chapters Done</span>
                <span className="text-sm font-bold text-slate-700">{subject.chapters.filter(c => c.completed).length}/{subject.chapters.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Remaining</span>
                <span className="text-sm font-bold text-rose-500">{subject.chapters.filter(c => !c.completed).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryCard = ({ title, date }: any) => (
  <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm hover:border-sky-300 transition-all cursor-pointer">
    <p className="font-bold text-slate-700">{title}</p>
    <p className="text-xs text-slate-400 mt-1">{date}</p>
  </div>
);

const SyllabusItem = ({ title, completed }: any) => (
  <div className="flex items-center gap-3">
    <div className={cn("w-4 h-4 rounded-full border-2", completed ? "bg-sky-500 border-sky-500" : "border-sky-200")} />
    <span className={cn("text-sm font-medium", completed ? "text-slate-400" : "text-slate-700")}>{title}</span>
  </div>
);

const StudyKitsView = ({ 
  kits, 
  user, 
  onCreateKit, 
  onUpdateKit 
}: { 
  kits: StudyKit[]; 
  user: UserProfile; 
  onCreateKit: (title: string, focus: string) => void;
  onUpdateKit: (kit: StudyKit) => void;
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newFocus, setNewFocus] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    setIsCreating(true);
    await onCreateKit(newTitle, newFocus);
    setIsCreating(false);
    setShowCreate(false);
    setNewTitle('');
    setNewFocus('');
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Study Kits</h2>
          <p className="text-slate-500">Custom learning bundles for your goals</p>
        </div>
        <button 
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-200 hover:bg-sky-600 transition-all"
        >
          <Plus size={20} /> Create Kit
        </button>
      </header>

      <AnimatePresence>
        {showCreate && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-3xl border border-sky-100 shadow-xl space-y-4"
          >
            <h3 className="text-xl font-bold">New Study Kit</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">Kit Title</label>
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Final Exam Prep"
                  className="w-full p-4 bg-sky-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">What's the focus?</label>
                <input 
                  type="text" 
                  value={newFocus}
                  onChange={e => setNewFocus(e.target.value)}
                  placeholder="e.g. Physics Chapter 1-5"
                  className="w-full p-4 bg-sky-50 border-none rounded-2xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreate(false)} className="px-6 py-3 text-slate-500 font-bold">Cancel</button>
              <button 
                onClick={handleCreate}
                disabled={!newTitle || !newFocus || isCreating}
                className="px-8 py-3 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-200 disabled:opacity-50 flex items-center gap-2"
              >
                {isCreating ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                {isCreating ? 'AI Generating...' : 'Generate with AI'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kits.map(kit => (
          <div key={kit.id} className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm hover:shadow-md transition-all space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold text-slate-900">{kit.title}</h3>
                <p className="text-sm text-slate-500">{kit.focus}</p>
              </div>
              <div className="bg-sky-50 px-3 py-1 rounded-full text-sky-600 text-xs font-bold">
                {(kit.materials || []).length} Materials
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-400 uppercase">Preparation Progress</span>
                <span className="text-sky-600">{kit.progress}%</span>
              </div>
              <div className="w-full bg-sky-50 h-2 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${kit.progress}%` }} />
              </div>
            </div>

            <div className="space-y-3">
              {(kit.materials || []).map(material => (
                <div key={material.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl group hover:bg-sky-50 transition-colors">
                  <button 
                    onClick={() => {
                      const updatedMaterials = kit.materials.map(m => 
                        m.id === material.id ? { ...m, completed: !m.completed } : m
                      );
                      const completedCount = updatedMaterials.filter(m => m.completed).length;
                      const progress = Math.round((completedCount / (updatedMaterials.length || 1)) * 100);
                      onUpdateKit({ ...kit, materials: updatedMaterials, progress });
                    }}
                    className={cn(
                      "w-5 h-5 rounded-md border flex items-center justify-center transition-all",
                      material.completed ? "bg-sky-500 border-sky-500 text-white" : "border-slate-300 bg-white"
                    )}
                  >
                    {material.completed && <CheckCircle2 size={14} />}
                  </button>
                  <div className="flex-1">
                    <p className={cn("text-sm font-medium", material.completed && "text-slate-400 line-through")}>{material.title}</p>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{material.type}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ShopView = ({ 
  user, 
  onPurchase,
  onActivate
}: { 
  user: UserProfile; 
  onPurchase: (item: ShopItem) => void;
  onActivate: (item: ShopItem) => void;
}) => {
  const shopItems: ShopItem[] = [
    { id: 'theme-sunset', name: 'Sunset Theme', description: 'Warm orange and pink tones', price: 500, type: 'theme', previewColor: 'bg-orange-400' },
    { id: 'theme-emerald', name: 'Emerald Theme', description: 'Deep green and forest tones', price: 500, type: 'theme', previewColor: 'bg-emerald-400' },
    { id: 'theme-midnight', name: 'Midnight Theme', description: 'Dark mode with neon accents', price: 1000, type: 'theme', previewColor: 'bg-slate-900' },
    { id: 'badge-scholar', name: 'Scholar Badge', description: 'Show off your dedication', price: 200, type: 'badge', icon: 'Award' },
    { id: 'badge-master', name: 'Master Badge', description: 'For the top of the class', price: 500, type: 'badge', icon: 'Trophy' },
    { id: 'badge-streak', name: 'Streak King', description: '10+ days streak required', price: 300, type: 'badge', icon: 'Timer' },
  ];

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Nur Shop</h2>
          <p className="text-slate-500">Spend your hard-earned coins on cosmetics</p>
        </div>
        <div className="bg-amber-50 border border-amber-100 px-6 py-3 rounded-2xl flex items-center gap-3">
          <Trophy className="text-amber-500" size={24} />
          <span className="text-2xl font-bold text-amber-700">{user.coins}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shopItems.map(item => {
          const isUnlocked = item.type === 'theme' 
            ? user.unlockedThemes.includes(item.id)
            : user.unlockedBadges.includes(item.id);
          
          return (
            <div key={item.id} className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm flex flex-col items-center text-center space-y-4">
              <div className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center shadow-inner",
                item.previewColor || "bg-sky-50"
              )}>
                {item.icon === 'Award' && <Award className="text-sky-500" size={40} />}
                {item.icon === 'Trophy' && <Trophy className="text-amber-500" size={40} />}
                {item.icon === 'Timer' && <Timer className="text-rose-500" size={40} />}
                {!item.icon && <Palette className="text-white" size={40} />}
              </div>
              
              <div>
                <h3 className="text-lg font-bold">{item.name}</h3>
                <p className="text-xs text-slate-500">{item.description}</p>
              </div>

              <button 
                disabled={user.coins < item.price && !isUnlocked}
                onClick={() => isUnlocked ? onActivate(item) : onPurchase(item)}
                className={cn(
                  "w-full py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2",
                  isUnlocked 
                    ? item.id === user.activeTheme || user.unlockedBadges.includes(item.id) && item.type === 'badge'
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : "bg-emerald-500 text-white shadow-lg shadow-emerald-100 hover:bg-emerald-600"
                    : user.coins >= item.price
                      ? "bg-sky-500 text-white shadow-lg shadow-sky-100 hover:bg-sky-600"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                )}
              >
                {isUnlocked 
                  ? item.type === 'theme' 
                    ? item.id === user.activeTheme ? 'Active' : 'Activate'
                    : 'Unlocked'
                  : (
                  <>
                    <Trophy size={16} />
                    {item.price}
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-sky-50 p-6 rounded-3xl border border-sky-100">
        <h3 className="font-bold text-sky-800 mb-2">How to earn Nur Coins?</h3>
        <ul className="text-sm text-sky-700 space-y-2">
          <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Complete a 25-min study session: <strong>+50 Coins</strong></li>
          <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Maintain a daily streak: <strong>+20 Coins/day</strong></li>
          <li className="flex items-center gap-2"><CheckCircle2 size={14} /> Help others in community (Coming soon): <strong>+30 Coins</strong></li>
        </ul>
      </div>
    </div>
  );
};

const Sidebar = ({ 
  user, 
  subjects, 
  activeTab, 
  setActiveTab, 
  onSelectSubject,
  isOpen,
  setIsOpen
}: { 
  user: UserProfile; 
  subjects: Subject[]; 
  activeTab: string; 
  setActiveTab: (tab: string) => void; 
  onSelectSubject: (s: Subject) => void;
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}) => {
  const showSubjects = user.isSyllabusVerified && subjects.length > 0;

  return (
    <motion.aside 
      initial={false}
      animate={{ x: isOpen ? 0 : -300 }}
      className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-sky-100 flex flex-col transition-all duration-300 md:relative md:translate-x-0",
        !isOpen && "md:w-20"
      )}
    >
      <div className="p-6 flex items-center justify-between">
        <div className={cn("flex items-center gap-2", !isOpen && "md:hidden")}>
          <div className="w-8 h-8 bg-sky-500 rounded-lg flex items-center justify-center text-white font-bold">Z</div>
          <h1 className="text-xl font-bold text-sky-600">Zafar <span className="text-xs font-normal text-slate-400">زفار</span></h1>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-sky-50 rounded-lg text-slate-500">
          {isOpen ? <X size={20} className="md:hidden" /> : <Menu size={20} />}
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} collapsed={!isOpen} />
        <NavItem icon={<MessageSquare size={20} />} label="AI Tutor" active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} collapsed={!isOpen} />
        <NavItem icon={<Users size={20} />} label="Community" active={activeTab === 'community'} onClick={() => setActiveTab('community')} collapsed={!isOpen} />
        <NavItem icon={<Zap size={20} />} label="Flashcards" active={activeTab === 'flashcards'} onClick={() => setActiveTab('flashcards')} collapsed={!isOpen} />
        <NavItem icon={<FileText size={20} />} label="My Notes" active={activeTab === 'notes'} onClick={() => setActiveTab('notes')} collapsed={!isOpen} />
        <NavItem icon={<Package size={20} />} label="Study Kits" active={activeTab === 'kits'} onClick={() => setActiveTab('kits')} collapsed={!isOpen} />
        <NavItem icon={<ShoppingBag size={20} />} label="Nur Shop" active={activeTab === 'shop'} onClick={() => setActiveTab('shop')} collapsed={!isOpen} />
        <NavItem icon={<Calendar size={20} />} label="Study Diary" active={activeTab === 'diary'} onClick={() => setActiveTab('diary')} collapsed={!isOpen} />
        
        {showSubjects && (
          <>
            <div className={cn("pt-4 pb-2", !isOpen && "md:hidden")}>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2">Subjects</p>
            </div>
            
            {subjects.map(subject => (
              <button
                key={subject.id}
                onClick={() => onSelectSubject(subject)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all group",
                  activeTab === `subject-${subject.id}` ? "bg-sky-100 text-sky-600" : "hover:bg-sky-50 text-slate-600"
                )}
              >
                <div className="w-8 h-8 rounded-lg bg-white border border-sky-100 flex items-center justify-center group-hover:border-sky-300">
                  <BookOpen size={16} />
                </div>
                {isOpen && (
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium truncate">{subject.name}</p>
                    <div className="w-full bg-sky-200 h-1 rounded-full mt-1">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${subject.progress}%` }} />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-sky-50">
        <div className={cn("flex items-center gap-3 p-2 rounded-xl bg-sky-50", !isOpen && "md:justify-center")}>
          <div className="w-10 h-10 rounded-full bg-sky-200 flex items-center justify-center text-sky-700 font-bold">
            {user.name[0]}
          </div>
          {isOpen && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-slate-500">Class {user.class}</p>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

const NavItem = ({ icon, label, active, onClick, collapsed }: any) => (
  <button
    onClick={onClick}
    className={cn(
      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all",
      active ? "bg-sky-500 text-white shadow-lg shadow-sky-200" : "hover:bg-sky-50 text-slate-600",
      collapsed && "md:justify-center"
    )}
  >
    {icon}
    {!collapsed && <span className="font-medium">{label}</span>}
  </button>
);

const QUICK_ACTIONS = [
  { id: 'explain', label: 'Explain Topic', icon: <BookOpen size={12} />, prompt: 'Can you explain the current topic in detail?' },
  { id: 'quiz', label: 'Quick Quiz', icon: <Zap size={12} />, prompt: 'Give me a quick 5-question quiz on what we just learned.' },
  { id: 'summary', label: 'Summarize', icon: <FileText size={12} />, prompt: 'Summarize the key points of this chapter.' },
  { id: 'help', label: 'Help me solve', icon: <Plus size={12} />, prompt: 'I have a specific problem I need help solving.' },
];

const ChatBar = ({ 
  onSend, 
  onUpload,
  activeMode,
  onModeChange,
  user
}: { 
  onSend: (text: string) => void; 
  onUpload: (base64: string, mime: string) => void;
  activeMode: AnswerMode;
  onModeChange: (mode: AnswerMode) => void;
  user: UserProfile;
}) => {
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (input.trim()) {
      onSend(input);
      setInput('');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        onUpload(base64, file.type);
      };
      reader.readAsDataURL(file);
    }
    setShowMenu(false);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [input]);

  const modes = [
    { id: 'premium', label: 'Answer with AI', icon: Sparkles, sub: `${50 - user.dailyPremiumUsage}/50 left` },
    { id: 'community', label: 'Ask Community', icon: Users, sub: 'Peer Help' },
    { id: 'free', label: 'Free AI', icon: Zap, sub: 'Unlimited' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 md:left-auto md:w-[calc(100%-288px)] flex flex-col items-center pointer-events-none">
      {/* Quick Actions */}
      <div className="w-full max-w-3xl flex gap-2 mb-3 pointer-events-auto overflow-x-auto pb-1 no-scrollbar">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              setInput(action.prompt);
              textareaRef.current?.focus();
            }}
            className="flex-shrink-0 px-3 py-1.5 bg-white/80 backdrop-blur-sm border border-sky-100 rounded-full text-[10px] font-bold text-sky-600 hover:bg-sky-500 hover:text-white hover:border-sky-400 transition-all flex items-center gap-1.5 shadow-sm"
          >
            {action.icon}
            {action.label}
          </button>
        ))}
      </div>

      {/* Mode Selector */}
      <div className="w-full max-w-3xl flex gap-2 mb-3 pointer-events-auto">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id as AnswerMode)}
            className={cn(
              "flex-1 p-2 rounded-xl border transition-all text-left flex flex-col",
              activeMode === mode.id 
                ? "bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-200" 
                : "bg-white border-sky-100 text-slate-600 hover:border-sky-300"
            )}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <mode.icon size={12} className={activeMode === mode.id ? "text-white" : "text-sky-500"} />
              <span className="text-[10px] font-bold uppercase tracking-wider">{mode.label}</span>
            </div>
            <span className={cn("text-[9px] px-0.5", activeMode === mode.id ? "text-sky-100" : "text-slate-400")}>
              {mode.sub}
            </span>
          </button>
        ))}
      </div>

      <div className="w-full max-w-3xl glass rounded-2xl p-2 flex items-end gap-2 pointer-events-auto shadow-xl border border-white/20">
        <div className="relative">
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="p-3 hover:bg-sky-100 rounded-xl text-sky-600 transition-colors"
          >
            <Plus size={20} />
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*" 
            onChange={handleFileChange} 
          />

          <AnimatePresence>
            {showMenu && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-2xl shadow-2xl border border-sky-100 p-2 z-50"
              >
                <MenuOption icon={<ImageIcon size={18} />} label="Upload Image" onClick={() => fileInputRef.current?.click()} />
                <MenuOption icon={<Camera size={18} />} label="Take Photo" onClick={() => fileInputRef.current?.click()} />
                <MenuOption icon={<FileText size={18} />} label="Attach File" onClick={() => {}} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Zafar anything..."
          className="flex-1 bg-transparent border-none focus:ring-0 py-3 px-2 resize-none max-h-[150px] text-slate-700"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />

        <div className="flex items-center gap-1 pb-1 pr-1">
          <button className="p-3 hover:bg-sky-100 rounded-xl text-slate-400 transition-colors">
            <Mic size={20} />
          </button>
          <button 
            onClick={handleSend}
            disabled={!input.trim()}
            className={cn(
              "p-3 rounded-xl transition-all",
              input.trim() ? "bg-sky-500 text-white shadow-lg shadow-sky-200" : "bg-slate-100 text-slate-400"
            )}
          >
            <Send size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuOption = ({ icon, label, onClick }: any) => (
  <button onClick={onClick} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-sky-50 rounded-xl text-slate-600 transition-colors text-sm font-medium">
    {icon}
    {label}
  </button>
);

const MasteryQuiz = ({ 
  flashcards, 
  onClose,
  onFinish,
  onUpdateFlashcard
}: { 
  flashcards: Flashcard[]; 
  onClose: () => void;
  onFinish: (score: number) => void;
  onUpdateFlashcard: (f: Flashcard) => void;
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [quizCards] = useState(() => [...flashcards].sort(() => Math.random() - 0.5).slice(0, 10));

  const handleQuizAnswer = (correct: boolean) => {
    const currentCard = quizCards[currentIndex];
    const newMastery = correct ? Math.min(100, currentCard.mastery + 20) : Math.max(0, currentCard.mastery - 10);
    
    // Spaced Repetition Logic (Simplified SM-2)
    let newInterval = currentCard.interval || 0;
    let newEaseFactor = currentCard.easeFactor || 2.5;
    
    if (correct) {
      if (newInterval === 0) newInterval = 1;
      else if (newInterval === 1) newInterval = 6;
      else newInterval = Math.round(newInterval * newEaseFactor);
      newEaseFactor = Math.min(5, newEaseFactor + 0.1);
    } else {
      newInterval = 1;
      newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
    }
    
    const nextReview = Date.now() + newInterval * 24 * 60 * 60 * 1000;

    onUpdateFlashcard({ 
      ...currentCard, 
      mastery: newMastery, 
      lastReviewed: Date.now(),
      nextReview,
      interval: newInterval,
      easeFactor: newEaseFactor
    });

    if (correct) setQuizScore(s => s + 1);
    if (currentIndex < quizCards.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleFinish = () => {
    onFinish(quizScore);
    onClose();
  };

  if (quizCards.length === 0) {
    return (
      <div className="fixed inset-0 bg-white z-[100] flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <Zap size={48} className="mx-auto text-slate-300" />
          <h3 className="text-xl font-bold">No Flashcards Yet</h3>
          <p className="text-slate-500">Create some flashcards first to start a Mastery Quiz!</p>
          <button onClick={onClose} className="px-6 py-2 bg-sky-500 text-white rounded-xl font-bold">Close</button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-[100] overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-8">
        <div className="flex justify-between items-center">
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-500">
            <X size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-xl font-bold">Mastery Quiz</h2>
            <p className="text-xs text-slate-400 font-bold uppercase">All Subjects</p>
          </div>
          <div className="w-10" />
        </div>

        {quizFinished ? (
          <div className="text-center space-y-8 py-10">
            <motion.div 
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
            >
              <Trophy size={48} />
            </motion.div>
            <div>
              <h3 className="text-3xl font-bold">Quiz Complete!</h3>
              <p className="text-slate-500 mt-2 text-lg">You mastered {quizScore} out of {quizCards.length} concepts.</p>
            </div>
            <div className="p-6 bg-sky-50 rounded-3xl border border-sky-100">
              <p className="text-sky-600 font-bold text-sm">Reward: +{quizScore * 10} Nur Coins</p>
            </div>
            <button 
              onClick={handleFinish}
              className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100"
            >
              Finish & Collect Coins
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Progress: {currentIndex + 1} / {quizCards.length}</span>
              <span className="text-emerald-500">Score: {quizScore}</span>
            </div>

            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / quizCards.length) * 100}%` }}
                className="bg-sky-500 h-full rounded-full"
              />
            </div>

            <div className="bg-white border-2 border-sky-100 rounded-3xl p-10 min-h-[250px] flex flex-col items-center justify-center text-center shadow-sm relative">
              <span className="absolute top-6 left-6 px-3 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full uppercase">Question</span>
              <h3 className="text-2xl font-bold text-slate-800 leading-tight">{quizCards[currentIndex].question}</h3>
              
              <AnimatePresence>
                {isFlipped && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 pt-8 border-t border-slate-100 w-full"
                  >
                    <p className="text-lg text-slate-600 font-medium">{quizCards[currentIndex].answer}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {!isFlipped ? (
              <button 
                onClick={() => setIsFlipped(true)}
                className="w-full py-5 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100 text-lg"
              >
                Show Answer
              </button>
            ) : (
              <div className="flex gap-4">
                <button 
                  onClick={() => handleQuizAnswer(false)}
                  className="flex-1 py-5 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-100 text-lg"
                >
                  I was wrong
                </button>
                <button 
                  onClick={() => handleQuizAnswer(true)}
                  className="flex-1 py-5 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100 text-lg"
                >
                  I was right!
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const FlashcardDeck = ({ 
  flashcards, 
  subjects 
}: { 
  flashcards: Flashcard[]; 
  subjects: Subject[];
}) => {
  const [filter, setFilter] = useState('all');
  
  const filtered = flashcards.filter(f => {
    if (filter === 'all') return true;
    if (filter === 'low-mastery') return f.mastery < 50;
    if (filter === 'high-importance') return f.importance === 'High';
    if (filter === 'review-due') return !f.nextReview || f.nextReview <= Date.now();
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Flashcard Deck</h2>
          <p className="text-slate-500">Master {flashcards.length} concepts across all subjects</p>
        </div>
        <div className="flex gap-2">
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-white border border-sky-100 rounded-xl px-4 py-2 text-sm font-bold text-slate-600 focus:ring-2 focus:ring-sky-500"
          >
            <option value="all">All Cards</option>
            <option value="review-due">Due for Review</option>
            <option value="low-mastery">Needs Review (&lt; 50%)</option>
            <option value="high-importance">High Importance</option>
          </select>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(fc => {
          const subject = subjects.find(s => s.id === fc.subjectId);
          return (
            <div key={fc.id} className="p-6 bg-white rounded-3xl border border-sky-100 shadow-sm space-y-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <span className="px-2 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full uppercase">{subject?.name || 'Unknown'}</span>
                <div className={cn(
                  "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                  fc.importance === 'High' ? "bg-rose-50 text-rose-500" : 
                  fc.importance === 'Medium' ? "bg-amber-50 text-amber-500" : "bg-sky-50 text-sky-500"
                )}>
                  {fc.importance}
                </div>
              </div>
              <h4 className="font-bold text-slate-800 leading-tight">{fc.question}</h4>
              {fc.nextReview && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                  <Timer size={12} />
                  <span>Next Review: {format(new Date(fc.nextReview), 'MMM d, h:mm a')}</span>
                </div>
              )}
              <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Mastery</span>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${fc.mastery}%` }} />
                  </div>
                </div>
                <span className="text-xs font-bold text-emerald-600">{fc.mastery}%</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-3xl border border-sky-100">
          <Zap size={48} className="mx-auto text-slate-200 mb-4" />
          <p className="text-slate-400 font-bold">No flashcards found matching this filter.</p>
        </div>
      )}
    </div>
  );
};

const FlashcardSelectionModal = ({ 
  subjects, 
  onSelect, 
  onClose 
}: { 
  subjects: Subject[]; 
  onSelect: (sId: string, cId: string) => void; 
  onClose: () => void;
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState(subjects[0]?.id || '');
  const selectedSubject = subjects.find(s => s.id === selectedSubjectId);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
      >
        <div className="p-6 border-b border-sky-50 flex justify-between items-center bg-sky-50/50">
          <h3 className="text-xl font-bold text-slate-800">Save Flashcards To...</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl text-slate-400"><X size={20} /></button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Subject</label>
            <div className="grid grid-cols-1 gap-2">
              {subjects.map(s => (
                <button 
                  key={s.id}
                  onClick={() => setSelectedSubjectId(s.id)}
                  className={cn(
                    "p-4 rounded-2xl border-2 text-left transition-all",
                    selectedSubjectId === s.id ? "border-sky-500 bg-sky-50" : "border-slate-100 hover:border-sky-200"
                  )}
                >
                  <p className="font-bold text-slate-700">{s.name}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{s.chapters.length} Chapters</p>
                </button>
              ))}
            </div>
          </div>

          {selectedSubject && (
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Chapter</label>
              <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {selectedSubject.chapters.map(c => (
                  <button 
                    key={c.id}
                    onClick={() => onSelect(selectedSubject.id, c.id)}
                    className="p-3 rounded-xl border border-slate-100 hover:border-sky-300 hover:bg-sky-50 text-left transition-all group"
                  >
                    <p className="text-sm font-bold text-slate-600 group-hover:text-sky-600">{c.title}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
        </div>
      </motion.div>
    </div>
  );
};

const FlashcardSystem = ({ 
  subject, 
  chapter, 
  user, 
  flashcards, 
  onSaveFlashcards 
}: { 
  subject: Subject; 
  chapter: any; 
  user: UserProfile; 
  flashcards: Flashcard[]; 
  onSaveFlashcards: (f: Flashcard[]) => void;
}) => {
  const [mode, setMode] = useState<'list' | 'study' | 'quiz'>('list');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const chapterFlashcards = flashcards.filter(f => f.chapterId === chapter.id && f.subjectId === subject.id);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const generated = await generateFlashcards(subject.name, chapter.title, chapter.topics, user);
      const newFlashcards: Flashcard[] = generated.map((f, i) => ({
        id: `fc-${Date.now()}-${i}`,
        question: f.question!,
        answer: f.answer!,
        chapterId: chapter.id,
        subjectId: subject.id,
        importance: f.importance as any,
        mastery: 0,
        interval: 0,
        easeFactor: 2.5
      }));
      onSaveFlashcards([...flashcards, ...newFlashcards]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizAnswer = (correct: boolean) => {
    const currentCard = chapterFlashcards[currentIndex];
    const updatedFlashcards = flashcards.map(f => {
      if (f.id === currentCard.id) {
        const newMastery = correct ? Math.min(100, f.mastery + 20) : Math.max(0, f.mastery - 10);
        
        // Spaced Repetition Logic (Simplified SM-2)
        let newInterval = f.interval || 0;
        let newEaseFactor = f.easeFactor || 2.5;
        
        if (correct) {
          if (newInterval === 0) newInterval = 1;
          else if (newInterval === 1) newInterval = 6;
          else newInterval = Math.round(newInterval * newEaseFactor);
          newEaseFactor = Math.min(5, newEaseFactor + 0.1);
        } else {
          newInterval = 1;
          newEaseFactor = Math.max(1.3, newEaseFactor - 0.2);
        }
        
        const nextReview = Date.now() + newInterval * 24 * 60 * 60 * 1000;
        
        return { 
          ...f, 
          mastery: newMastery, 
          lastReviewed: Date.now(),
          nextReview,
          interval: newInterval,
          easeFactor: newEaseFactor
        };
      }
      return f;
    });
    onSaveFlashcards(updatedFlashcards);

    if (correct) setQuizScore(s => s + 1);
    if (currentIndex < chapterFlashcards.length - 1) {
      setCurrentIndex(i => i + 1);
      setIsFlipped(false);
    } else {
      setQuizFinished(true);
    }
  };

  if (mode === 'study' && chapterFlashcards.length > 0) {
    const current = chapterFlashcards[currentIndex];
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => setMode('list')} className="text-sm font-bold text-slate-400 flex items-center gap-1">
            <ChevronLeft size={16} /> Back to List
          </button>
          <span className="text-xs font-bold text-slate-400 uppercase">Card {currentIndex + 1} of {chapterFlashcards.length}</span>
        </div>

        <motion.div 
          onClick={() => setIsFlipped(!isFlipped)}
          className="relative w-full h-64 cursor-pointer perspective-1000"
        >
          <motion.div 
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ duration: 0.6, type: 'spring' }}
            className="w-full h-full relative preserve-3d"
          >
            {/* Front */}
            <div className="absolute inset-0 backface-hidden bg-white border-2 border-sky-100 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
              <span className="absolute top-4 left-4 px-2 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full uppercase">Question</span>
              <h3 className="text-xl font-bold text-slate-800">{current.question}</h3>
              <p className="mt-4 text-xs text-slate-400 font-medium">Click to flip</p>
            </div>
            {/* Back */}
            <div className="absolute inset-0 backface-hidden bg-sky-500 border-2 border-sky-400 rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-lg text-white rotate-y-180">
              <span className="absolute top-4 left-4 px-2 py-1 bg-white/20 text-white text-[10px] font-bold rounded-full uppercase">Answer</span>
              <p className="text-lg font-medium">{current.answer}</p>
              <p className="mt-4 text-xs text-white/60 font-medium">Click to flip back</p>
            </div>
          </motion.div>
        </motion.div>

        <div className="flex justify-between gap-4">
          <button 
            disabled={currentIndex === 0}
            onClick={() => { setCurrentIndex(i => i - 1); setIsFlipped(false); }}
            className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold disabled:opacity-50"
          >
            Previous
          </button>
          <button 
            disabled={currentIndex === chapterFlashcards.length - 1}
            onClick={() => { setCurrentIndex(i => i + 1); setIsFlipped(false); }}
            className="flex-1 py-3 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    );
  }

  if (mode === 'quiz' && chapterFlashcards.length > 0) {
    if (quizFinished) {
      return (
        <div className="text-center space-y-6 py-10">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <Trophy size={40} />
          </div>
          <div>
            <h3 className="text-2xl font-bold">Quiz Finished!</h3>
            <p className="text-slate-500">You scored {quizScore} out of {chapterFlashcards.length}</p>
          </div>
          <button 
            onClick={() => { setMode('list'); setQuizFinished(false); setQuizScore(0); setCurrentIndex(0); }}
            className="px-8 py-3 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100"
          >
            Back to Flashcards
          </button>
        </div>
      );
    }

    const current = chapterFlashcards[currentIndex];
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <button onClick={() => setMode('list')} className="text-sm font-bold text-slate-400 flex items-center gap-1">
            <ChevronLeft size={16} /> Quit Quiz
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-emerald-500">Score: {quizScore}</span>
            <span className="text-xs font-bold text-slate-400 uppercase">{currentIndex + 1} / {chapterFlashcards.length}</span>
          </div>
        </div>

        <div className="bg-white border-2 border-sky-100 rounded-3xl p-8 min-h-[200px] flex flex-col items-center justify-center text-center shadow-sm relative">
          <span className="absolute top-4 left-4 px-2 py-1 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full uppercase">Question</span>
          <h3 className="text-xl font-bold text-slate-800">{current.question}</h3>
          
          <AnimatePresence>
            {isFlipped && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 pt-6 border-t border-slate-100 w-full"
              >
                <p className="text-slate-600 font-medium">{current.answer}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!isFlipped ? (
          <button 
            onClick={() => setIsFlipped(true)}
            className="w-full py-4 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100"
          >
            Show Answer
          </button>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={() => handleQuizAnswer(false)}
              className="flex-1 py-4 bg-rose-50 text-rose-600 rounded-2xl font-bold border border-rose-100"
            >
              I was wrong
            </button>
            <button 
              onClick={() => handleQuizAnswer(true)}
              className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-100"
            >
              I was right!
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Zap size={20} className="text-amber-500" /> Flashcards
        </h3>
        {chapterFlashcards.length > 0 && (
          <div className="flex gap-2">
            <button 
              onClick={() => { setMode('study'); setCurrentIndex(0); setIsFlipped(false); }}
              className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-xs font-bold"
            >
              Study Mode
            </button>
            <button 
              onClick={() => { setMode('quiz'); setCurrentIndex(0); setIsFlipped(false); setQuizScore(0); setQuizFinished(false); }}
              className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-100"
            >
              Quiz Me
            </button>
          </div>
        )}
      </div>

      {chapterFlashcards.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Sparkles size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500 text-sm mb-4">No flashcards for this chapter yet.</p>
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="px-6 py-3 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100 disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
            {loading ? 'Generating...' : 'Generate with AI'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {chapterFlashcards.map(fc => (
            <div key={fc.id} className="p-4 bg-white rounded-2xl border border-sky-100 shadow-sm flex justify-between items-center">
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700">{fc.question}</p>
                <p className="text-xs text-slate-400 mt-1 truncate max-w-xs">{fc.answer}</p>
              </div>
              <div className={cn(
                "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                fc.importance === 'High' ? "bg-rose-50 text-rose-500" : 
                fc.importance === 'Medium' ? "bg-amber-50 text-amber-500" : "bg-sky-50 text-sky-500"
              )}>
                {fc.importance}
              </div>
            </div>
          ))}
          <button 
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-4 border-2 border-dashed border-sky-200 rounded-2xl text-sky-500 font-bold hover:bg-sky-50 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
            {loading ? 'Generating more...' : 'Generate More Flashcards'}
          </button>
        </div>
      )}
    </div>
  );
};

const CircularProgress = ({ value, size = 60, strokeWidth = 6, color = "text-sky-500" }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          className="text-slate-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold">
        {value}%
      </div>
    </div>
  );
};

const Dashboard = ({ 
  user, 
  subjects, 
  flashcards,
  onAction,
  onStartMasteryQuiz
}: { 
  user: UserProfile; 
  subjects: Subject[]; 
  flashcards: Flashcard[];
  onAction: (a: string) => void;
  onStartMasteryQuiz: () => void;
}) => {
  const totalChapters = subjects.reduce((acc, s) => acc + s.chapters.length, 0);
  const completedChapters = subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.completed).length, 0);
  const overallProgress = totalChapters > 0 ? Math.round((completedChapters / totalChapters) * 100) : 0;

  const currentExamType = user.nextExam?.type || 'Final';
  const examChapters = subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.term === currentExamType).length, 0);
  const completedExamChapters = subjects.reduce((acc, s) => acc + s.chapters.filter(c => c.term === currentExamType && c.completed).length, 0);
  const examProgress = examChapters > 0 ? Math.round((completedExamChapters / examChapters) * 100) : 0;

  const daysToExam = user.nextExam ? differenceInDays(new Date(user.nextExam.date), new Date()) : null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-slate-900">Assalamu Alaikum, {user.name}! 👋</h2>
          <p className="text-slate-500">Ready to master your studies today?</p>
        </div>
        <div className="flex gap-3">
          {user.nextExam && (
            <div className="bg-sky-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-sky-100 flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl">
                <Calendar size={20} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase opacity-80">Next Exam</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-lg font-bold">{daysToExam !== null ? (daysToExam > 0 ? daysToExam : 0) : '--'}</p>
                  <p className="text-[10px] font-bold uppercase opacity-80">Days Left</p>
                </div>
              </div>
            </div>
          )}
          <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-emerald-100 flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Trophy size={20} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase opacity-80">Daily Goal</p>
              <p className="text-sm font-bold">2/3 Chapters</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard icon={<Trophy className="text-amber-500" />} label="Nur Coins" value={user.coins} color="bg-amber-50" />
        <StatCard icon={<Timer className="text-sky-500" />} label="Daily Streak" value={`${user.streak} Days`} color="bg-sky-50" />
        <StatCard icon={<CheckCircle2 className="text-emerald-500" />} label="Overall Progress" value={`${overallProgress}%`} color="bg-emerald-50" />
        <StatCard icon={<Sparkles className="text-purple-500" />} label="Exam Progress" value={`${examProgress}%`} color="bg-purple-50" />
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Plus size={20} className="text-sky-500" /> Smart Suggestions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SuggestionCard title="Analyze Topic" desc="Deep dive into next chapter" onClick={() => onAction('analyze')} />
          <SuggestionCard title="Summarize" desc="Get the core concepts fast" onClick={() => onAction('summarize')} />
          <SuggestionCard title="Generate Test" desc="Practice with AI quizzes" onClick={() => onAction('test')} />
          <SuggestionCard title="Smart Notes" desc="AI-generated study guides" onClick={() => onAction('notes')} />
          <SuggestionCard title="Mastery Quiz" desc={`Quiz on ${flashcards.length} flashcards`} onClick={onStartMasteryQuiz} />
        </div>
      </section>

      <section className="bg-white p-8 rounded-[2rem] border border-sky-100 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
          <Trophy size={120} className="text-sky-500" />
        </div>
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-sky-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-sky-100">
              <Zap size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Study Session Goal</h3>
              <p className="text-sm text-slate-500">Master 3 chapters of Physics today</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <div className="flex justify-between text-sm font-bold">
              <span className="text-slate-600">Session Progress</span>
              <span className="text-sky-600">66%</span>
            </div>
            <div className="w-full bg-sky-50 h-3 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: '66%' }}
                className="bg-sky-500 h-full rounded-full"
              />
            </div>
          </div>

          <div className="flex gap-4 pt-2">
            <button className="px-6 py-3 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100 hover:bg-sky-600 transition-colors">
              Continue Session
            </button>
            <button className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-colors">
              Edit Goal
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="space-y-4">
          <h3 className="text-lg font-bold">My Badges</h3>
          <div className="flex flex-wrap gap-3">
            {(user.unlockedBadges || []).length === 0 ? (
              <p className="text-sm text-slate-400 italic">No badges unlocked yet. Visit the shop!</p>
            ) : (
              (user.unlockedBadges || []).map(badgeId => (
                <div key={badgeId} className="p-3 bg-white rounded-xl border border-sky-100 shadow-sm flex items-center gap-2">
                  <Award className="text-sky-500" size={16} />
                  <span className="text-xs font-bold text-slate-700">{badgeId.replace('badge-', '').toUpperCase()}</span>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold">Subject Progress</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {subjects.map(s => (
              <div key={s.id} className="bg-white p-5 rounded-[2rem] border border-sky-100 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
                <CircularProgress value={s.progress} size={70} strokeWidth={8} />
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{s.name}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-full bg-sky-50 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-sky-500 h-full rounded-full" style={{ width: `${s.progress}%` }} />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">{s.chapters.filter(c => c.completed).length}/{s.chapters.length}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-bold">AI Daily Diary</h3>
          <div className="bg-white p-6 rounded-2xl border border-sky-100 shadow-sm space-y-4">
            <DiaryItem title="Complete Physics Assignment" time="2:00 PM" completed={false} />
            <DiaryItem title="Review Math Formulas" time="4:30 PM" completed={true} />
            <DiaryItem title="AI: Practice English Grammar" time="Suggestion" completed={false} isAI />
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, color }: any) => (
  <div className={cn("p-6 rounded-2xl border border-sky-100 flex items-center gap-4", color)}>
    <div className="p-3 bg-white rounded-xl shadow-sm">{icon}</div>
    <div>
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
    </div>
  </div>
);

const SuggestionCard = ({ title, desc, onClick }: any) => (
  <button onClick={onClick} className="text-left p-4 bg-white rounded-2xl border border-sky-100 shadow-sm hover:border-sky-400 hover:shadow-lg transition-all group">
    <p className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{title}</p>
    <p className="text-xs text-slate-500 mt-1">{desc}</p>
  </button>
);

const DiaryItem = ({ title, time, completed, isAI }: any) => (
  <div className="flex items-center gap-3">
    <div className={cn("w-5 h-5 rounded-md border flex items-center justify-center", completed ? "bg-sky-500 border-sky-500 text-white" : "border-slate-300")}>
      {completed && <CheckCircle2 size={14} />}
    </div>
    <div className="flex-1">
      <p className={cn("text-sm font-medium", completed && "text-slate-400 line-through")}>{title}</p>
      <p className={cn("text-[10px] font-bold uppercase", isAI ? "text-sky-500" : "text-slate-400")}>{time}</p>
    </div>
  </div>
);

const NotesView = ({ 
  notes, 
  subjects, 
  onAddNote, 
  onDeleteNote 
}: { 
  notes: Note[]; 
  subjects: Subject[]; 
  onAddNote: (n: Omit<Note, 'id' | 'timestamp'>) => void;
  onDeleteNote: (id: string) => void;
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', subjectId: '' });

  const handleAdd = () => {
    if (!newNote.title || !newNote.content) return;
    onAddNote(newNote);
    setNewNote({ title: '', content: '', subjectId: '' });
    setIsAdding(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8 pb-32">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Study Notes</h2>
          <p className="text-slate-500">Organize your thoughts and key concepts</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-sky-500 text-white rounded-2xl font-bold shadow-lg shadow-sky-100 hover:bg-sky-600 transition-all"
        >
          <Plus size={20} /> New Note
        </button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-3xl border-2 border-sky-200 shadow-xl space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input 
                type="text" 
                placeholder="Note Title" 
                value={newNote.title}
                onChange={e => setNewNote({ ...newNote, title: e.target.value })}
                className="p-3 rounded-xl border border-sky-100 focus:ring-2 focus:ring-sky-500 outline-none font-bold"
              />
              <select 
                value={newNote.subjectId}
                onChange={e => setNewNote({ ...newNote, subjectId: e.target.value })}
                className="p-3 rounded-xl border border-sky-100 focus:ring-2 focus:ring-sky-500 outline-none font-bold text-slate-600"
              >
                <option value="">Select Subject (Optional)</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <textarea 
              placeholder="Write your note here... (Markdown supported)" 
              rows={5}
              value={newNote.content}
              onChange={e => setNewNote({ ...newNote, content: e.target.value })}
              className="w-full p-4 rounded-xl border border-sky-100 focus:ring-2 focus:ring-sky-500 outline-none resize-none"
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setIsAdding(false)} className="px-6 py-2 font-bold text-slate-400 hover:text-slate-600">Cancel</button>
              <button onClick={handleAdd} className="px-8 py-2 bg-sky-500 text-white rounded-xl font-bold shadow-lg shadow-sky-100">Save Note</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-[2rem] border border-sky-100">
            <FileText size={48} className="mx-auto text-slate-200 mb-4" />
            <p className="text-slate-400 font-bold">No notes yet. Start by creating your first study note!</p>
          </div>
        ) : (
          notes.map(note => {
            const subject = subjects.find(s => s.id === note.subjectId);
            return (
              <motion.div 
                key={note.id} 
                layout
                className="bg-white p-6 rounded-3xl border border-sky-100 shadow-sm hover:shadow-md transition-all group flex flex-col h-full"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    {subject && (
                      <span className="px-2 py-0.5 bg-sky-50 text-sky-600 text-[10px] font-bold rounded-full uppercase">
                        {subject.name}
                      </span>
                    )}
                    <h4 className="font-bold text-slate-800 group-hover:text-sky-600 transition-colors">{note.title}</h4>
                  </div>
                  <button 
                    onClick={() => onDeleteNote(note.id)}
                    className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="flex-1 prose prose-sm prose-slate line-clamp-4 text-slate-600 mb-4">
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase">
                  <span>{format(note.timestamp, 'MMM d, yyyy')}</span>
                  <button className="text-sky-500 hover:underline">View Full Note</button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Reset usage if it's a new day
  useEffect(() => {
    if (user) {
      const lastReset = new Date(user.lastUsageReset);
      const now = new Date();
      if (lastReset.toDateString() !== now.toDateString()) {
        saveUser({
          ...user,
          dailyPremiumUsage: 0,
          lastUsageReset: now.toISOString()
        });
      }
    }
  }, [user]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [detectedSyllabus, setDetectedSyllabus] = useState<Subject[] | null>(null);
  const [showSyllabusVerification, setShowSyllabusVerification] = useState(false);
  const [loading, setLoading] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [communityQuestions, setCommunityQuestions] = useState<CommunityQuestion[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [kits, setKits] = useState<StudyKit[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'model', content: "Hello! I'm Zafar, your personal AI teacher. How can I help you study today?", timestamp: Date.now() }
  ]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [flashcardSourceText, setFlashcardSourceText] = useState<string | null>(null);
  const [showMasteryQuiz, setShowMasteryQuiz] = useState(false);
  const [msgCountSinceLastSmartQ, setMsgCountSinceLastSmartQ] = useState(0);
  const [activeSmartQKey, setActiveSmartQKey] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load data from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('zafar_user');
    const savedKits = localStorage.getItem('zafar_kits');
    const savedSubjects = localStorage.getItem('zafar_subjects');
    const savedNotes = localStorage.getItem('zafar_notes');
    
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      // Ensure all fields are present for migration
      const migratedUser: UserProfile = {
        ...parsedUser,
        id: parsedUser.id ?? `user-${Date.now()}`,
        coins: parsedUser.coins ?? 0,
        streak: parsedUser.streak ?? 1,
        unlockedThemes: parsedUser.unlockedThemes ?? ['theme-sky'],
        unlockedBadges: parsedUser.unlockedBadges ?? [],
        activeTheme: parsedUser.activeTheme ?? 'theme-sky',
        dailyPremiumUsage: parsedUser.dailyPremiumUsage ?? 0,
        lastUsageReset: parsedUser.lastUsageReset ?? new Date().toISOString(),
        preferredMode: parsedUser.preferredMode ?? 'premium',
        educationType: parsedUser.educationType ?? 'school',
        pomodoroSettings: parsedUser.pomodoroSettings ?? {
          studyDuration: 25,
          breakDuration: 5,
          sound: 'bell'
        }
      };
      setUser(migratedUser);
    }
    if (savedKits) setKits(JSON.parse(savedKits));
    if (savedSubjects) setSubjects(JSON.parse(savedSubjects));
    
    const savedFlashcards = localStorage.getItem('zafar_flashcards');
    if (savedFlashcards) setFlashcards(JSON.parse(savedFlashcards));
    
    const savedCommunity = localStorage.getItem('zafar_community');
    if (savedCommunity) setCommunityQuestions(JSON.parse(savedCommunity));
  }, []);

  const saveUser = (u: UserProfile) => {
    setUser(u);
    localStorage.setItem('zafar_user', JSON.stringify(u));
  };

  // Proactive Suggestions
  useEffect(() => {
    if (user?.onboarded && messages.length === 1 && (user.weakSubjects?.length || user.nextExam)) {
      const generateSuggestion = async () => {
        setIsTyping(true);
        let prompt = `I'm Zafar. Based on your profile, I see you have an upcoming ${user.nextExam?.type} exam on ${user.nextExam?.date}. `;
        if (user.weakSubjects?.length) {
          prompt += `You've also mentioned that you're struggling with ${user.weakSubjects.join(', ')}. `;
        }
        prompt += "Would you like to start with a quick review of one of these subjects, or should we focus on a specific chapter today?";
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: `suggestion-${Date.now()}`,
            role: 'model',
            content: prompt,
            timestamp: Date.now()
          }]);
          setIsTyping(false);
        }, 1500);
      };
      generateSuggestion();
    }
  }, [user?.onboarded]);

  const saveCommunity = (questions: CommunityQuestion[]) => {
    setCommunityQuestions(questions);
    localStorage.setItem('zafar_community', JSON.stringify(questions));
  };

  const saveFlashcards = (f: Flashcard[]) => {
    setFlashcards(f);
    localStorage.setItem('zafar_flashcards', JSON.stringify(f));
  };

  const saveNotes = (n: Note[]) => {
    setNotes(n);
    localStorage.setItem('zafar_notes', JSON.stringify(n));
  };

  const handleAddNote = (n: Omit<Note, 'id' | 'timestamp'>) => {
    const newNote: Note = {
      ...n,
      id: `note-${Date.now()}`,
      timestamp: Date.now()
    };
    saveNotes([...notes, newNote]);
  };

  const handleDeleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  const handleCreateFlashcardsFromMsg = (text: string) => {
    setFlashcardSourceText(text);
  };

  const handleGenerateFlashcardsFromText = async (subjectId: string, chapterId: string) => {
    if (!user || !flashcardSourceText) return;
    setLoading(true);
    try {
      const generated = await generateFlashcardsFromText(flashcardSourceText, user);
      const newFlashcards: Flashcard[] = generated.map((f, i) => ({
        id: `fc-text-${Date.now()}-${i}`,
        question: f.question!,
        answer: f.answer!,
        chapterId,
        subjectId,
        importance: f.importance as any,
        mastery: 0,
        interval: 0,
        easeFactor: 2.5
      }));
      saveFlashcards([...flashcards, ...newFlashcards]);
      setFlashcardSourceText(null);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `✅ **Flashcards Created!** I've generated ${newFlashcards.length} flashcards from the notes and added them to your collection.`,
        timestamp: Date.now()
      }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommunityReply = (qId: string, text: string) => {
    if (!user) return;
    const newReply: CommunityAnswer = {
      id: `reply-${Date.now()}`,
      userId: user.id,
      userName: user.name,
      content: text,
      timestamp: Date.now(),
      upvotes: 0,
      likedBy: []
    };
    const updated = communityQuestions.map(q => 
      q.id === qId ? { ...q, answers: [...q.answers, newReply] } : q
    );
    saveCommunity(updated);
  };

  const handleCommunityVote = (qId: string, type: 'up' | 'down', aId?: string) => {
    if (!user) return;
    const updated = communityQuestions.map(q => {
      if (q.id === qId) {
        if (aId) {
          return {
            ...q,
            answers: q.answers.map(a => {
              if (a.id === aId) {
                const alreadyLiked = a.likedBy.includes(user.id);
                if (type === 'up') {
                  return {
                    ...a,
                    likedBy: alreadyLiked ? a.likedBy.filter(id => id !== user.id) : [...a.likedBy, user.id],
                    upvotes: alreadyLiked ? a.upvotes - 1 : a.upvotes + 1
                  };
                }
              }
              return a;
            })
          };
        }
        
        const alreadyLiked = q.likedBy.includes(user.id);
        const alreadyDisliked = q.dislikedBy.includes(user.id);

        if (type === 'up') {
          if (alreadyLiked) {
            return { ...q, likedBy: q.likedBy.filter(id => id !== user.id), upvotes: q.upvotes - 1 };
          } else {
            return { 
              ...q, 
              likedBy: [...q.likedBy, user.id], 
              upvotes: q.upvotes + 1,
              dislikedBy: q.dislikedBy.filter(id => id !== user.id),
              downvotes: alreadyDisliked ? q.downvotes - 1 : q.downvotes
            };
          }
        } else {
          if (alreadyDisliked) {
            return { ...q, dislikedBy: q.dislikedBy.filter(id => id !== user.id), downvotes: q.downvotes - 1 };
          } else {
            return { 
              ...q, 
              dislikedBy: [...q.dislikedBy, user.id], 
              downvotes: q.downvotes + 1,
              likedBy: q.likedBy.filter(id => id !== user.id),
              upvotes: alreadyLiked ? q.upvotes - 1 : q.upvotes
            };
          }
        }
      }
      return q;
    });
    saveCommunity(updated);
  };

  const saveKits = (k: StudyKit[]) => {
    setKits(k);
    localStorage.setItem('zafar_kits', JSON.stringify(k));
  };

  const handleOnboarding = async (u: Partial<UserProfile>, detected?: Subject[]) => {
    setLoading(true);
    try {
      const fullUser: UserProfile = {
        ...u,
        coins: 100,
        streak: 1,
        lastActive: new Date().toISOString(),
        unlockedThemes: ['default'],
        unlockedBadges: [],
        activeTheme: 'default',
        dailyPremiumUsage: 0,
        lastUsageReset: new Date().toISOString(),
        preferredMode: 'premium',
        educationType: u.educationType || 'school',
        isSyllabusVerified: !!detected && detected.length > 0,
        syllabusConfirmed: false,
        onboarded: false,
        pomodoroSettings: u.pomodoroSettings || {
          studyDuration: 25,
          breakDuration: 5,
          sound: 'bell'
        }
      } as UserProfile;

      if (detected && detected.length > 0) {
        setSubjects(detected);
        localStorage.setItem('zafar_subjects', JSON.stringify(detected));
      } else if (!fullUser.syllabusImage) {
        const curriculum = await generateCurriculum(fullUser);
        setSubjects(curriculum);
        localStorage.setItem('zafar_subjects', JSON.stringify(curriculum));
      }
      
      saveUser(fullUser);
    } catch (error) {
      console.error("Onboarding Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySyllabus = (verifiedSubjects: Subject[]) => {
    if (!user) return;
    const updatedUser = { ...user, isSyllabusVerified: true, syllabusConfirmed: true, onboarded: true };
    setSubjects(verifiedSubjects);
    saveUser(updatedUser);
    localStorage.setItem('zafar_subjects', JSON.stringify(verifiedSubjects));
    setShowSyllabusVerification(false);
    setDetectedSyllabus(null);
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      content: "🎉 **Onboarding Complete!** I am now in **Teacher Mode**. I've set up your curriculum and I'm ready to guide your learning journey. Let's start with your first chapter!",
      timestamp: Date.now()
    }]);
  };

  const handleRetrySyllabus = () => {
    setShowSyllabusVerification(false);
    setDetectedSyllabus(null);
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      content: "No problem! Please upload a clearer photo of your syllabus so I can try again.",
      timestamp: Date.now()
    }]);
  };

  const handleCreateKit = async (title: string, focus: string) => {
    if (!user) return;
    const suggestedMaterials = await suggestStudyKitMaterials(focus, user);
    const newKit: StudyKit = {
      id: Date.now().toString(),
      title,
      focus,
      progress: 0,
      materials: suggestedMaterials,
      createdAt: Date.now()
    };
    saveKits([...kits, newKit]);
  };

  const handleUpdateKit = (updatedKit: StudyKit) => {
    saveKits(kits.map(k => k.id === updatedKit.id ? updatedKit : k));
  };

  const handlePurchase = (item: ShopItem) => {
    if (!user || user.coins < item.price) return;
    
    const updatedUser = { ...user };
    updatedUser.coins -= item.price;
    if (item.type === 'theme') {
      updatedUser.unlockedThemes.push(item.id);
    } else {
      updatedUser.unlockedBadges.push(item.id);
    }
    saveUser(updatedUser);
  };

  const handleStudySessionComplete = () => {
    if (!user) return;
    const updatedUser = { ...user };
    updatedUser.coins += 50;
    saveUser(updatedUser);
    // Show notification or message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'model',
      content: "🎉 **Great job!** You've completed a study session and earned **50 Nur Coins**. Keep it up!",
      timestamp: Date.now()
    }]);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!user) return;
    const currentMode = user.preferredMode;

    // Continuous Learning: Detect answers to smart questions
    let updatedUser = { ...user };
    let profileUpdated = false;

    if (activeSmartQKey) {
      if (activeSmartQKey === 'weakSubjects') {
        updatedUser.weakSubjects = [...(updatedUser.weakSubjects || []), text];
        profileUpdated = true;
      } else if (activeSmartQKey === 'learningPreference') {
        updatedUser.learningPreference = text.toLowerCase().includes('short') ? 'short' : 'detailed';
        profileUpdated = true;
      } else if (activeSmartQKey === 'learningStyle') {
        updatedUser.learningStyle = text.toLowerCase().includes('test') ? 'tests' : 'explanations';
        profileUpdated = true;
      } else if (activeSmartQKey === 'currentTopic') {
        updatedUser.currentTopic = text;
        profileUpdated = true;
      } else if (activeSmartQKey === 'comfortLevel') {
        updatedUser.comfortLevel = text;
        profileUpdated = true;
      } else if (activeSmartQKey === 'wantsTest') {
        updatedUser.wantsTest = text.toLowerCase().includes('yes');
        profileUpdated = true;
      }
      setActiveSmartQKey(null);
      setMsgCountSinceLastSmartQ(0);
    }

    // Detect if user mentions a weak subject or topic naturally
    if (text.toLowerCase().includes('struggle with') || text.toLowerCase().includes('hard for me')) {
      const words = text.split(' ');
      const subject = words[words.length - 1].replace(/[?!.]/g, '');
      if (subject && !updatedUser.weakSubjects?.includes(subject)) {
        updatedUser.weakSubjects = [...(updatedUser.weakSubjects || []), subject];
        profileUpdated = true;
      }
    }

    if (profileUpdated) {
      saveUser(updatedUser);
    }

    // Check usage for premium
    if (currentMode === 'premium' && user.dailyPremiumUsage >= 50) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "⚠️ **Premium limit reached!** You've used your 50 daily premium messages. Switching to **Free AI** for now.",
        timestamp: Date.now()
      }]);
      saveUser({ ...user, preferredMode: 'free' });
      return;
    }

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: text, 
      timestamp: Date.now(),
      mode: currentMode
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setActiveTab('chat');

    try {
      if (currentMode === 'community') {
        const newQuestion: CommunityQuestion = {
          id: Date.now().toString(),
          userId: user.id,
          userName: user.name,
          content: text,
          timestamp: Date.now(),
          upvotes: 0,
          downvotes: 0,
          likedBy: [],
          dislikedBy: [],
          answers: []
        };
        saveCommunity([...communityQuestions, newQuestion]);
        
        setIsTyping(false);
        const communityMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'community',
          content: "Your question has been posted to the **Zafar Community**! Other students and teachers will reply soon. You'll earn **Nur Coins** for helpful replies!",
          timestamp: Date.now() + 1,
          type: 'community-post',
          mode: 'community',
          communityData: newQuestion
        };
        setMessages(prev => [...prev, communityMsg]);
      } else {
        const response = await generateStudyResponse(text, updatedUser, {
          subject: selectedSubject?.name,
          mode: currentMode as 'premium' | 'free',
          curriculum: subjects
        });
        
        setIsTyping(false);
        let finalContent = response || "I'm sorry, I couldn't process that.";

        // Continuous Learning: Ask a new smart question occasionally
        const newMsgCount = msgCountSinceLastSmartQ + 1;
        setMsgCountSinceLastSmartQ(newMsgCount);

        if (newMsgCount >= 4) {
          const smartQuestions = [
            { key: 'weakSubjects', question: "By the way, which subject do you find the hardest to study?" },
            { key: 'learningPreference', question: "Do you prefer quick short notes or deep, detailed explanations?" },
            { key: 'learningStyle', question: "Would you like me to suggest more practice tests or detailed explanations for your topics?" },
            { key: 'currentTopic', question: "Which topic are you currently studying in school? I can help you master it!" },
            { key: 'comfortLevel', question: "Are you comfortable with the topics we've covered so far, or should I explain something again?" },
            { key: 'wantsTest', question: "Do you feel ready for a quick test on what we've learned today?" }
          ];

          const missingQ = smartQuestions.find(q => !updatedUser[q.key as keyof UserProfile]);
          if (missingQ) {
            finalContent += `\n\n---\n**Zafar's Smart Question:** ${missingQ.question}`;
            setActiveSmartQKey(missingQ.key);
            setMsgCountSinceLastSmartQ(0);
          }
        }

        const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          content: finalContent, 
          timestamp: Date.now(),
          mode: currentMode
        };
        setMessages(prev => [...prev, aiMsg]);

        // Increment usage if premium
        if (currentMode === 'premium') {
          saveUser({ ...updatedUser, dailyPremiumUsage: updatedUser.dailyPremiumUsage + 1 });
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
    }
  };

  const handleAction = (action: string) => {
    setActiveTab('chat');
    let prompt = "";
    switch(action) {
      case 'analyze': prompt = "Can you help me analyze the next topic in my syllabus?"; break;
      case 'summarize': prompt = "I need a summary of the last chapter we studied."; break;
      case 'test': prompt = "Generate a quick test for me based on my recent progress."; break;
      case 'notes': prompt = "Create some smart notes for my upcoming exam."; break;
    }
    handleSendMessage(prompt);
  };

  const handleImageUpload = async (base64: string, mime: string) => {
    if (!user) return;
    const currentMode = user.preferredMode;

    const userMsg: Message = { 
      id: Date.now().toString(), 
      role: 'user', 
      content: "Analyzing this image...", 
      timestamp: Date.now(),
      type: 'image',
      imageUrl: `data:${mime};base64,${base64}`,
      mode: currentMode
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setActiveTab('chat');

    // Check if it looks like a syllabus or if the user is in onboarding
    const isSyllabus = !user.isSyllabusVerified;

    if (isSyllabus) {
      const result = await detectSyllabusFromImage(base64, mime, user);
      setIsTyping(false);
      if (result.subjects && result.subjects.length > 0) {
        setDetectedSyllabus(result.subjects);
        setShowSyllabusVerification(true);
        if (result.examInfo) {
          const updatedUser = { ...user, nextExam: result.examInfo };
          saveUser(updatedUser);
        }
      } else {
        const response = await analyzeImage(base64, mime, user);
        const aiMsg: Message = { 
          id: (Date.now() + 1).toString(), 
          role: 'model', 
          content: response || "I couldn't analyze the image.", 
          timestamp: Date.now(),
          mode: currentMode
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } else {
      const response = await analyzeImage(base64, mime, user);
      setIsTyping(false);
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        content: response || "I couldn't analyze the image.", 
        timestamp: Date.now(),
        mode: currentMode
      };
      setMessages(prev => [...prev, aiMsg]);
    }
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    const updatedSubjects = subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s);
    setSubjects(updatedSubjects);
    setSelectedSubject(updatedSubject);
    localStorage.setItem('zafar_subjects', JSON.stringify(updatedSubjects));
  };

  const updatePomodoroSettings = (settings: UserProfile['pomodoroSettings']) => {
    if (!user) return;
    const updatedUser = { ...user, pomodoroSettings: settings };
    saveUser(updatedUser);
  };

  if (!user || !user.onboarded) return <ChatOnboarding onComplete={handleOnboarding} loading={loading} />;

  return (
    <div className={cn(
      "flex h-screen overflow-hidden transition-colors duration-500",
      user.activeTheme === 'theme-sunset' ? "bg-orange-50" : 
      user.activeTheme === 'theme-emerald' ? "bg-emerald-50" :
      user.activeTheme === 'theme-midnight' ? "bg-slate-950 text-white" : "bg-sky-50"
    )}>
      {showSyllabusVerification && detectedSyllabus && (
        <SyllabusVerification 
          subjects={detectedSyllabus}
          onConfirm={handleVerifySyllabus}
          onRetry={handleRetrySyllabus}
        />
      )}
      {flashcardSourceText && (
        <FlashcardSelectionModal 
          subjects={subjects}
          onSelect={handleGenerateFlashcardsFromText}
          onClose={() => setFlashcardSourceText(null)}
        />
      )}
      {showMasteryQuiz && (
        <MasteryQuiz 
          flashcards={flashcards}
          onClose={() => setShowMasteryQuiz(false)}
          onUpdateFlashcard={(updated) => {
            saveFlashcards(flashcards.map(f => f.id === updated.id ? updated : f));
          }}
          onFinish={(score) => {
            if (!user) return;
            saveUser({ ...user, coins: user.coins + (score * 10) });
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'model',
              content: `🎉 **Mastery Quiz Complete!** You earned **${score * 10} Nur Coins**. Great job!`,
              timestamp: Date.now()
            }]);
          }}
        />
      )}
      <Sidebar 
        user={user} 
        subjects={subjects} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        onSelectSubject={(s) => {
          setSelectedSubject(s);
          setActiveTab(`subject-${s.id}`);
          setIsSidebarOpen(false);
        }}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Bar for Mobile */}
        <div className={cn(
          "md:hidden p-4 flex items-center justify-between border-b",
          user.activeTheme === 'theme-midnight' ? "bg-slate-900 border-slate-800" : "bg-white border-sky-100"
        )}>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-sky-50 rounded-lg">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-sky-600">Zafar</h1>
          <div className="w-8" />
        </div>

        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'dashboard' ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <Dashboard 
                  user={user} 
                  subjects={subjects} 
                  flashcards={flashcards}
                  onAction={handleAction} 
                  onStartMasteryQuiz={() => setShowMasteryQuiz(true)}
                />
              </motion.div>
            ) : activeTab === 'flashcards' ? (
              <motion.div
                key="flashcards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <FlashcardDeck flashcards={flashcards} subjects={subjects} />
              </motion.div>
            ) : activeTab === 'notes' ? (
              <motion.div
                key="notes"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <NotesView 
                  notes={notes} 
                  subjects={subjects} 
                  onAddNote={handleAddNote} 
                  onDeleteNote={handleDeleteNote} 
                />
              </motion.div>
            ) : activeTab === 'kits' ? (
              <motion.div
                key="kits"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <StudyKitsView kits={kits} user={user} onCreateKit={handleCreateKit} onUpdateKit={handleUpdateKit} />
              </motion.div>
            ) : activeTab === 'shop' ? (
              <motion.div
                key="shop"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <ShopView 
                  user={user} 
                  onPurchase={handlePurchase} 
                  onActivate={(item) => {
                    if (item.type === 'theme') {
                      saveUser({ ...user, activeTheme: item.id });
                    }
                  }}
                />
              </motion.div>
            ) : activeTab === 'community' ? (
              <motion.div
                key="community"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <CommunityFeed 
                  questions={communityQuestions} 
                  user={user} 
                  onReply={handleCommunityReply} 
                  onVote={handleCommunityVote} 
                />
              </motion.div>
            ) : activeTab.startsWith('subject-') && selectedSubject ? (
              <motion.div
                key="subject"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <SubjectWorkspace 
                  subject={selectedSubject} 
                  onBack={() => setActiveTab('dashboard')} 
                  onStudyComplete={handleStudySessionComplete}
                  onUpdateSubject={handleUpdateSubject}
                  updatePomodoroSettings={updatePomodoroSettings}
                  user={user}
                  flashcards={flashcards}
                  onSaveFlashcards={saveFlashcards}
                  notes={notes}
                  onAddNote={handleAddNote}
                  onDeleteNote={handleDeleteNote}
                />
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col max-w-4xl mx-auto w-full"
              >
                <div className="flex-1 p-4 space-y-6 pb-32 overflow-y-auto">
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className={cn(
                        "flex flex-col max-w-[85%] group",
                        msg.role === 'user' ? "ml-auto items-end" : "mr-auto items-start"
                      )}
                    >
                      <div className={cn(
                        "p-4 rounded-2xl shadow-sm relative",
                        msg.role === 'user' ? "bg-sky-500 text-white rounded-tr-none" : 
                        msg.role === 'community' ? "bg-amber-50 text-amber-900 rounded-tl-none border border-amber-100" :
                        user.activeTheme === 'theme-midnight' ? "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700" :
                        "bg-white text-slate-800 rounded-tl-none border border-sky-100"
                      )}>
                        {msg.role === 'model' && (
                          <div className="absolute -left-10 top-0 w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center text-sky-600">
                            <Sparkles size={16} />
                          </div>
                        )}
                        {msg.imageUrl && (
                          <div className="relative mb-3 group/img">
                            <img src={msg.imageUrl} alt="Uploaded" className="max-w-full rounded-xl border border-white/20 shadow-md" referrerPolicy="no-referrer" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                              <Search className="text-white" size={24} />
                            </div>
                          </div>
                        )}
                      {msg.type === 'community-post' ? (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-amber-600 font-bold text-xs uppercase tracking-widest">
                            <Users size={14} />
                            <span>Community Question</span>
                          </div>
                          <p className="text-sm font-medium">{msg.content}</p>
                          <div className="flex items-center gap-4 pt-3 border-t border-amber-200/50">
                            <button className="flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors">
                              <ThumbsUp size={12} /> {msg.communityData?.upvotes || 0}
                            </button>
                            <button className="flex items-center gap-1 text-[10px] font-bold text-amber-700 hover:bg-amber-100 px-2 py-1 rounded-lg transition-colors">
                              <ThumbsDown size={12} /> {msg.communityData?.downvotes || 0}
                            </button>
                            <button className="ml-auto text-[10px] font-bold bg-amber-500 text-white px-3 py-1 rounded-lg shadow-sm">Reply</button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="prose prose-sm max-w-none prose-slate">
                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                          </div>
                          {msg.content.length > 50 && (
                            <div className={cn(
                              "pt-2 border-t flex justify-end",
                              msg.role === 'user' ? "border-white/20" : "border-sky-50"
                            )}>
                              <button 
                                onClick={() => handleCreateFlashcardsFromMsg(msg.content)}
                                className={cn(
                                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-colors",
                                  msg.role === 'user' ? "bg-white/20 text-white hover:bg-white/30" : "bg-sky-50 text-sky-600 hover:bg-sky-100"
                                )}
                              >
                                <Sparkles size={12} />
                                Create Flashcards
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 px-1">
                      <span className="text-[10px] text-slate-400">
                        {format(msg.timestamp, 'h:mm a')}
                      </span>
                      {msg.mode && (
                        <span className={cn(
                          "text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full",
                          msg.mode === 'premium' ? "bg-sky-100 text-sky-600" :
                          msg.mode === 'community' ? "bg-amber-100 text-amber-600" :
                          "bg-slate-100 text-slate-600"
                        )}>
                          {msg.mode}
                        </span>
                      )}
                    </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className={cn(
                      "flex gap-1 p-4 rounded-2xl rounded-tl-none border w-16 shadow-sm",
                      user.activeTheme === 'theme-midnight' ? "bg-slate-800 border-slate-700" : "bg-white border-sky-100"
                    )}>
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-sky-400 rounded-full" />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <ChatBar 
          onSend={handleSendMessage} 
          onUpload={handleImageUpload} 
          activeMode={user.preferredMode}
          onModeChange={(mode) => saveUser({ ...user, preferredMode: mode })}
          user={user}
        />

        {/* Scroll to bottom button */}
        <button 
          onClick={scrollToBottom}
          className={cn(
            "fixed bottom-24 right-8 p-3 border rounded-full shadow-lg transition-all",
            user.activeTheme === 'theme-midnight' ? "bg-slate-800 border-slate-700 text-sky-400" : "bg-white border-sky-100 text-sky-500 hover:bg-sky-50"
          )}
        >
          <ArrowDown size={20} />
        </button>
      </main>
    </div>
  );
}
