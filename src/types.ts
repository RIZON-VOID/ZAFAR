export type AnswerMode = 'premium' | 'community' | 'free';

export type ExamType = 'First Term' | 'Half-Yearly' | 'Second Term' | 'Final';

export type Chapter = {
  id: string;
  title: string;
  completed: boolean;
  topics: string[];
  term?: ExamType;
  importance?: 'High' | 'Medium' | 'Low';
};

export type Subject = {
  id: string;
  name: string;
  progress: number;
  examProgress: number; // Progress specifically for the upcoming exam
  lastActivity: string;
  chapters: Chapter[];
};

export type ExamInfo = {
  type: ExamType;
  date: string;
};

export type PomodoroSettings = {
  studyDuration: number;
  breakDuration: number;
  sound: 'bell' | 'chime' | 'digital' | 'none';
};

export type UserProfile = {
  id: string;
  name: string;
  class: string;
  roll: string;
  target: string;
  country: string;
  language: string;
  educationType: 'school' | 'madrasah';
  onboarded: boolean;
  coins: number;
  streak: number;
  lastActive: string;
  unlockedThemes: string[];
  unlockedBadges: string[];
  activeTheme: string;
  dailyPremiumUsage: number;
  lastUsageReset: string;
  preferredMode: AnswerMode;
  pomodoroSettings: PomodoroSettings;
  syllabusImage?: string;
  examSystem?: string;
  nextExam?: ExamInfo;
  isSyllabusVerified: boolean;
  syllabusConfirmed?: boolean;
  weakSubjects?: string[];
  learningPreference?: 'short' | 'detailed';
  learningStyle?: 'tests' | 'explanations';
  currentChapterId?: string;
  currentSubjectId?: string;
  currentTopic?: string;
  comfortLevel?: string;
  wantsTest?: boolean;
};

export type CommunityQuestion = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  upvotes: number;
  downvotes: number;
  likedBy: string[];
  dislikedBy: string[];
  answers: CommunityAnswer[];
};

export type CommunityAnswer = {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  upvotes: number;
  likedBy: string[];
};

export type Message = {
  id: string;
  role: 'user' | 'model' | 'community';
  content: string;
  timestamp: number;
  type?: 'text' | 'image' | 'test' | 'note' | 'community-post';
  imageUrl?: string;
  mode?: AnswerMode;
  communityData?: CommunityQuestion;
};

export type TopicHistory = {
  id: string;
  subjectId: string;
  title: string;
  timestamp: number;
};

export type DailyTask = {
  id: string;
  title: string;
  completed: boolean;
  type: 'study' | 'reminder' | 'ai-suggestion';
};

export type Material = {
  id: string;
  title: string;
  type: 'note' | 'paper' | 'quiz' | 'flashcard';
  completed: boolean;
  url?: string;
};

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
  chapterId: string;
  subjectId: string;
  importance: 'High' | 'Medium' | 'Low';
  lastReviewed?: number;
  nextReview?: number;
  interval: number; // in days
  easeFactor: number; // default 2.5
  mastery: number; // 0 to 100
};

export type Note = {
  id: string;
  title: string;
  content: string;
  subjectId?: string;
  chapterId?: string;
  timestamp: number;
  tags?: string[];
};

export type StudyKit = {
  id: string;
  title: string;
  focus: string;
  progress: number;
  materials: Material[];
  createdAt: number;
};

export type ShopItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'theme' | 'badge';
  previewColor?: string;
  icon?: string;
};
