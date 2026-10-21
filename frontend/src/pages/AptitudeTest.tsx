import React, { useState } from 'react';
import { generateAptitudeTest } from '../services/api';
import { Loader2, CheckCircle2, XCircle, Brain, Play, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Question {
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    question: "What is the primary difference between a stack and a queue data structure?",
    options: [
      "Stack is FIFO (First In First Out), Queue is LIFO (Last In First Out)",
      "Stack is LIFO (Last In First Out), Queue is FIFO (First In First Out)",
      "Stack can only store numbers, Queue can store objects",
      "Queue operations are O(n), Stack operations are O(1)"
    ],
    correct_answer: "Stack is LIFO (Last In First Out), Queue is FIFO (First In First Out)",
    explanation: "A stack removes elements in the reverse order of addition (LIFO), whereas a queue processes elements in the arrival order (FIFO)."
  },
  {
    question: "In Python, which of the following is true regarding mutable vs immutable types?",
    options: [
      "Lists and dictionaries are mutable; tuples and strings are immutable",
      "Tuples and sets are mutable; lists are immutable",
      "Strings and dictionaries are mutable; lists are immutable",
      "All Python objects are mutable by default"
    ],
    correct_answer: "Lists and dictionaries are mutable; tuples and strings are immutable",
    explanation: "In Python, lists, dictionaries, and sets can be modified in-place (mutable), whereas tuples, strings, and integers cannot (immutable)."
  },
  {
    question: "What is the worst-case time complexity of QuickSort?",
    options: [
      "O(n log n)",
      "O(n)",
      "O(n²)",
      "O(log n)"
    ],
    correct_answer: "O(n²)",
    explanation: "When an unbalanced pivot is chosen repeatedly (such as already sorted array with first/last element pivot), QuickSort degrades to O(n²)."
  },
  {
    question: "Which HTTP status code is used when a requested resource requires client authentication?",
    options: [
      "403 Forbidden",
      "401 Unauthorized",
      "404 Not Found",
      "400 Bad Request"
    ],
    correct_answer: "401 Unauthorized",
    explanation: "HTTP 401 Unauthorized indicates that the request has not been applied because it lacks valid authentication credentials for the target resource."
  },
  {
    question: "In relational database design, what does the 'ACID' acronym stand for?",
    options: [
      "Atomicity, Consistency, Isolation, Durability",
      "Asynchronous, Concurrent, Indexed, Distributed",
      "Access, Control, Integrity, Definition",
      "Automatic, Continuous, Integrated, Durable"
    ],
    correct_answer: "Atomicity, Consistency, Isolation, Durability",
    explanation: "ACID properties guarantee that database transactions are processed reliably."
  }
];

const AptitudeTest: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [testComplete, setTestComplete] = useState(false);

  const startTest = async () => {
    setLoading(true);
    try {
      const resumeId = localStorage.getItem('current_resume_id') || undefined;
      const res = await generateAptitudeTest(resumeId);
      if (res && res.questions && res.questions.length > 0) {
        setQuestions(res.questions);
      } else {
        setQuestions(FALLBACK_QUESTIONS);
      }
      setCurrentIdx(0);
      setScore(0);
      setTestComplete(false);
      setSelectedAnswer(null);
      setIsAnswered(false);
      toast.success('Test ready! Best of luck.');
    } catch (error) {
      console.warn('API test generation error, loading fallback test:', error);
      setQuestions(FALLBACK_QUESTIONS);
      setCurrentIdx(0);
      setScore(0);
      setTestComplete(false);
      setSelectedAnswer(null);
      setIsAnswered(false);
      toast.success('Test loaded! Best of luck.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: string) => {
    if (isAnswered) return;
    setSelectedAnswer(option);
  };

  const submitAnswer = () => {
    if (!selectedAnswer) return;
    
    if (selectedAnswer === questions[currentIdx].correct_answer) {
      setScore(s => s + 1);
    }
    setIsAnswered(true);
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(c => c + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      setTestComplete(true);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={48} className="text-brand-500 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Generating your AI Aptitude Test...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center animate-fade-in">
        <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm">
          <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Brain size={40} className="text-brand-500" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Aptitude Test</h1>
          <p className="text-slate-500 mb-8 max-w-lg mx-auto">
            Test your logic, reasoning, and domain knowledge with an AI-generated 10-question quiz. 
          </p>
          <button onClick={startTest} className="btn-primary flex items-center gap-2 mx-auto">
            <Play size={18} />
            Start Test
          </button>
        </div>
      </div>
    );
  }

  if (testComplete) {
    const percentage = (score / questions.length) * 100;
    return (
      <div className="max-w-2xl mx-auto mt-12 text-center animate-slide-up">
        <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Test Complete!</h2>
          <p className="text-slate-500 mb-8">Here is how you performed.</p>
          
          <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="10" />
              <circle 
                cx="50" cy="50" r="45" fill="none" 
                stroke={percentage >= 70 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#ef4444'} 
                strokeWidth="10" 
                strokeDasharray={`${(percentage / 100) * 283} 283`}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-slate-900">{score}/{questions.length}</span>
            </div>
          </div>
          
          <button onClick={startTest} className="btn-secondary flex items-center gap-2 mx-auto">
            <RefreshCw size={18} />
            Retake Test
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];

  return (
    <div className="max-w-3xl mx-auto py-8 animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Aptitude Test</h1>
        <div className="text-sm font-semibold text-brand-600 bg-brand-50 px-4 py-2 rounded-full border border-brand-200">
          Question {currentIdx + 1} of {questions.length}
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-8 shadow-sm mb-6">
        <h2 className="text-lg sm:text-xl font-medium text-slate-800 mb-6 sm:mb-8 leading-relaxed">
          {q.question}
        </h2>
        
        <div className="space-y-3">
          {q.options.map((opt, idx) => {
            let stateClass = "border-slate-200 bg-white hover:border-brand-300 hover:bg-brand-50 text-slate-700";
            if (isAnswered) {
              if (opt === q.correct_answer) {
                stateClass = "border-emerald-500 bg-emerald-50 text-emerald-800";
              } else if (opt === selectedAnswer) {
                stateClass = "border-rose-500 bg-rose-50 text-rose-800";
              } else {
                stateClass = "border-slate-200 bg-slate-50 opacity-50";
              }
            } else if (selectedAnswer === opt) {
              stateClass = "border-brand-500 bg-brand-50 text-brand-700 ring-2 ring-brand-500/20";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(opt)}
                disabled={isAnswered}
                className={`w-full text-left px-6 py-4 rounded-xl border transition-all duration-200 flex items-center justify-between ${stateClass}`}
              >
                <span>{opt}</span>
                {isAnswered && opt === q.correct_answer && <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />}
                {isAnswered && opt === selectedAnswer && opt !== q.correct_answer && <XCircle className="text-rose-500 shrink-0" size={20} />}
              </button>
            );
          })}
        </div>
      </div>

      {isAnswered && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-6 animate-slide-up">
          <h3 className="font-semibold text-slate-900 flex items-center gap-2 mb-2">
            <Brain size={18} className="text-brand-500" />
            Explanation
          </h3>
          <p className="text-slate-600 text-sm leading-relaxed">{q.explanation}</p>
        </div>
      )}

      <div className="flex justify-end">
        {!isAnswered ? (
          <button 
            onClick={submitAnswer} 
            disabled={!selectedAnswer}
            className="btn-primary"
          >
            Submit Answer
          </button>
        ) : (
          <button 
            onClick={nextQuestion} 
            className="btn-primary"
          >
            {currentIdx < questions.length - 1 ? 'Next Question' : 'Finish Test'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AptitudeTest;
