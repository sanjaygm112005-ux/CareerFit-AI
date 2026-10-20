import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers, Loader2, RefreshCw, ChevronLeft, ChevronRight, Eye, EyeOff,
  Sparkles, CheckCircle2, BookOpen, Upload, HelpCircle
} from 'lucide-react';
import { generateFlashcards, getAnalysisHistory } from '../services/api';
import type { Flashcard } from '../services/api';

const BENCHMARK_FLASHCARDS: Flashcard[] = [
  {
    category: "System Design",
    question: "How do you design a high-throughput caching layer for a distributed application?",
    answer: "Use Redis or Memcached with a Cache-Aside (Lazy Loading) or Write-Through strategy. Implement cache eviction (LRU), set sensible TTLs to prevent stale data, and mitigate cache stampede using mutex locks or probabilistic early expiration."
  },
  {
    category: "React & Frontend",
    question: "What is the difference between useMemo, useCallback, and React.memo?",
    answer: "• React.memo: Higher-Order Component that skips re-rendering a functional component if its props haven't changed.\n• useMemo: Memoizes the computed RESULT of an expensive function between renders.\n• useCallback: Memoizes the FUNCTION DEFINITION itself to maintain reference equality across renders."
  },
  {
    category: "Python & Backend",
    question: "Explain the Python Global Interpreter Lock (GIL) and how to handle CPU-bound vs I/O-bound tasks.",
    answer: "The GIL allows only one thread to execute Python bytecode at a time. For I/O-bound tasks (network, disk, databases), use asyncio or multithreading since the GIL is released during I/O. For CPU-bound tasks, use multiprocessing to leverage multi-core processors."
  },
  {
    category: "Databases",
    question: "When should you choose PostgreSQL (Relational) vs MongoDB (Document NoSQL)?",
    answer: "• PostgreSQL: Ideal for structured data, strict ACID guarantees, complex relational queries, financial transactions, and foreign key integrity.\n• MongoDB: Ideal for rapidly evolving unstructured schemas, hierarchical JSON documents, and horizontally distributed read-heavy workloads."
  },
  {
    category: "Behavioral",
    question: "Tell me about a time you had a technical disagreement with a teammate. How did you resolve it?",
    answer: "Use the STAR framework: Focus on the objective trade-offs (performance, maintainability, delivery timeline) rather than personal opinion. Propose running a small benchmark or POC, document decisions in an RFC, and commit to the chosen path collaboratively."
  }
];

const Flashcards: React.FC = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [studyMode, setStudyMode] = useState(false); // Dual view mode: shows question and answer together
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        let resumeId = localStorage.getItem('current_resume_id');
        if (!resumeId) {
          try {
            const hist = await getAnalysisHistory();
            if (hist.history && hist.history.length > 0) {
              resumeId = hist.history[0].resume_id;
              localStorage.setItem('current_resume_id', resumeId);
            }
          } catch {}
        }

        if (resumeId) {
          const res = await generateFlashcards(resumeId);
          if (res.flashcards && res.flashcards.length > 0) {
            setFlashcards(res.flashcards);
            setIsDemo(false);
          } else {
            setFlashcards(BENCHMARK_FLASHCARDS);
            setIsDemo(true);
          }
        } else {
          setFlashcards(BENCHMARK_FLASHCARDS);
          setIsDemo(true);
        }
      } catch (err) {
        console.warn('Failed to generate customized flashcards, showing benchmark cards:', err);
        setFlashcards(BENCHMARK_FLASHCARDS);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % flashcards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
    }, 150);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <Loader2 size={36} className="animate-spin text-blue-600" />
        <p className="text-slate-600 font-medium">Generating interview flashcards from your resume...</p>
      </div>
    );
  }

  if (flashcards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <HelpCircle size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Interview Flashcards</h2>
        <p className="text-slate-500 mt-2 mb-4">Upload a resume to generate customized technical and behavioral flashcards.</p>
        <button onClick={() => navigate('/app/upload')} className="btn-primary">
          Upload Resume
        </button>
      </div>
    );
  }

  const currentCard = flashcards[currentIndex] || BENCHMARK_FLASHCARDS[0];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 animate-fade-in select-none">
      {/* Demo Banner */}
      {isDemo && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-blue-600 shrink-0" />
            <p className="text-xs text-blue-900 font-medium">
              <strong>Benchmark Flashcards:</strong> Showing core technical &amp; behavioral questions. Upload your resume for tailored flashcards!
            </p>
          </div>
          <button
            onClick={() => navigate('/app/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Upload size={13} /> Upload Resume
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-blue-500/20">
          <Layers size={28} />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 mb-1">Interview Flashcards</h1>
        <p className="text-slate-600 text-sm">
          High-yield technical and behavioral interview preparation cards.
        </p>
      </div>

      {/* Subheader Toolbar */}
      <div className="flex items-center justify-between mb-4 px-2">
        <span className="text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
          {currentCard.category || 'General'}
        </span>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setStudyMode(!studyMode)}
            className={`text-xs font-semibold px-3 py-1 rounded-lg border transition-all flex items-center gap-1.5 ${
              studyMode
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-bold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={13} />
            <span>{studyMode ? 'Study Mode (Active)' : 'Study Mode (Dual View)'}</span>
          </button>
          <span className="text-xs font-bold text-slate-500">
            {currentIndex + 1} of {flashcards.length}
          </span>
        </div>
      </div>

      {/* Mode A: Study Mode (Dual View - Both Question and Answer visible) */}
      {studyMode ? (
        <div className="space-y-4">
          {/* Question Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100 mb-3 inline-block">
              Question
            </span>
            <h2 className="text-xl font-bold text-slate-900 leading-snug">
              {currentCard.question}
            </h2>
          </div>

          {/* Answer Box */}
          <div className="bg-gradient-to-br from-indigo-50/80 via-white to-blue-50/50 border border-indigo-200 rounded-2xl p-7 shadow-md">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 mb-3 inline-block flex items-center gap-1 w-fit">
              <CheckCircle2 size={12} /> Correct Answer &amp; Key Points
            </span>
            <div className="text-slate-800 text-base leading-relaxed whitespace-pre-wrap font-medium">
              {currentCard.answer}
            </div>
          </div>
        </div>
      ) : (
        /* Mode B: Interactive 3D Flip Card */
        <div className="relative w-full h-[340px] perspective-1000">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="w-full h-full cursor-pointer relative"
            style={{
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              transformStyle: 'preserve-3d',
              transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            {/* Front Side: Question */}
            <div
              className="absolute inset-0 w-full h-full bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between items-center text-center shadow-xl shadow-slate-200/60 hover:border-blue-300 transition-colors"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
            >
              <div className="w-full flex justify-between items-center text-xs text-slate-400 font-semibold">
                <span className="flex items-center gap-1 text-blue-600">
                  <HelpCircle size={14} /> QUESTION
                </span>
                <span>Click card or button below to flip</span>
              </div>

              <h2 className="text-2xl font-extrabold text-slate-800 leading-relaxed px-4 max-w-xl">
                {currentCard.question}
              </h2>

              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 font-bold text-xs border border-blue-100 shadow-xs">
                <Eye size={14} />
                <span>Click to Reveal Answer</span>
              </div>
            </div>

            {/* Back Side: Answer */}
            <div
              className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-blue-700 text-white border border-indigo-500 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-indigo-600/20 overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              <div className="w-full flex justify-between items-center text-xs text-indigo-200 font-semibold pb-2 border-b border-indigo-500/50">
                <span className="flex items-center gap-1 text-emerald-300 font-bold">
                  <CheckCircle2 size={14} /> MODEL ANSWER
                </span>
                <span>Click to flip back to question</span>
              </div>

              <div className="my-auto py-2 text-left whitespace-pre-wrap leading-relaxed text-base md:text-lg font-medium text-white">
                {currentCard.answer}
              </div>

              <div className="w-full pt-2 border-t border-indigo-500/50 flex justify-between items-center text-xs text-indigo-200">
                <span>Category: {currentCard.category}</span>
                <span className="font-semibold text-white flex items-center gap-1">
                  <RefreshCw size={12} /> Flip Back
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Prominent Action Button: Reveal / Hide Answer */}
      {!studyMode && (
        <div className="flex justify-center mt-5">
          <button
            onClick={() => setIsFlipped(!isFlipped)}
            className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm ${
              isFlipped
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20'
            }`}
          >
            {isFlipped ? (
              <>
                <EyeOff size={15} />
                <span>Hide Answer (Flip to Question)</span>
              </>
            ) : (
              <>
                <Eye size={15} />
                <span>Reveal Answer</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Carousel Navigation Controls */}
      <div className="flex items-center justify-center gap-6 mt-8">
        <button
          onClick={handlePrev}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
        >
          <ChevronLeft size={18} />
          <span>Previous</span>
        </button>
        <span className="text-xs font-extrabold text-slate-400">
          {currentIndex + 1} / {flashcards.length}
        </span>
        <button
          onClick={handleNext}
          className="p-3.5 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-all shadow-sm flex items-center gap-2 text-xs font-bold"
        >
          <span>Next</span>
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
