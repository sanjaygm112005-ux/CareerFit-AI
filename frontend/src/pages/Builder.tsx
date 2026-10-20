import React, { useState, useEffect, useRef } from 'react';
import { PenTool, ArrowRight, Loader2, Download, CheckCircle2, Mic, Bot, FastForward, StopCircle } from 'lucide-react';
import { generateResumeFromScratch } from '../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const INTERVIEW_QUESTIONS = [
  "Let's start with your technical skills. What programming languages, frameworks, or tools do you know?",
  "What is your educational background? Are you currently studying, or have you graduated? Please mention your degree and university.",
  "What about personal or academic projects? Have you built anything interesting you'd like to include?",
  "Great! Do you have any formal work experience, internships, or major capstone projects you'd like to highlight? What were your key achievements?",
  "Finally, do you have a LinkedIn profile, GitHub account, or personal portfolio you'd like to link? Just say the URLs or usernames."
];

const Builder: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedMarkdown, setGeneratedMarkdown] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    target_role: '',
  });

  // Interview State
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(Array(INTERVIEW_QUESTIONS.length).fill(''));
  const [currentAnswer, setCurrentAnswer] = useState('');
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Setup Speech Recognition
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentAnswer(transcript);
      };
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      recognition.onend = () => {
        setIsListening(false);
      };
      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Text-to-Speech
  const speakQuestion = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Start the interview step
  const handleStartInterview = () => {
    setStep(2);
    setTimeout(() => {
      speakQuestion(INTERVIEW_QUESTIONS[0]);
    }, 500);
  };

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        // Clear previous input if starting fresh
        if (!currentAnswer) setCurrentAnswer('');
        recognitionRef.current.start();
        setIsListening(true);
        // Stop AI from talking if user starts talking
        if (isSpeaking && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } else {
        toast.error('Voice recognition is not supported in this browser.');
      }
    }
  };

  const handleNextQuestion = async (skip: boolean = false) => {
    // Save answer
    const newAnswers = [...answers];
    newAnswers[qIndex] = skip ? "Skipped." : currentAnswer || "Skipped.";
    setAnswers(newAnswers);

    // Stop listening if active
    if (isListening) toggleListen();
    setCurrentAnswer('');

    if (qIndex < INTERVIEW_QUESTIONS.length - 1) {
      // Go to next question
      setQIndex(qIndex + 1);
      speakQuestion(INTERVIEW_QUESTIONS[qIndex + 1]);
    } else {
      // Finished all questions, compile and submit!
      await handleGenerate(newAnswers);
    }
  };

  const handleGenerate = async (finalAnswers: string[]) => {
    setLoading(true);
    if (isSpeaking && 'speechSynthesis' in window) window.speechSynthesis.cancel();

    // Compile Transcript
    let compiledTranscript = "INTERVIEW TRANSCRIPT:\n\n";
    INTERVIEW_QUESTIONS.forEach((q, i) => {
      compiledTranscript += `Q: ${q}\nA: ${finalAnswers[i]}\n\n`;
    });

    const payload = {
      ...form,
      raw_text: compiledTranscript
    };

    try {
      const res = await generateResumeFromScratch(payload);
      setGeneratedMarkdown(res.resume_markdown);
      // Save resume_id so career tools (roadmap, cheat sheet) can use the resume text
      if (res.resume_id) {
        localStorage.setItem('current_resume_id', res.resume_id);
      }
      setStep(3); // Success step
      toast.success('Resume generated perfectly!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate resume.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById('resume-preview-content');
    if (!el) return;
    const toastId = toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${form.name.replace(/\s+/g, '_')}_Resume.pdf`);
      toast.success('PDF downloaded!', { id: toastId });
    } catch (err) {
      toast.error('Failed to generate PDF.', { id: toastId });
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
          <PenTool className="text-indigo-600" />
          AI Resume Builder
        </h1>
        <p className="text-slate-600 mt-2">
          Don't have a resume? Let our AI interview you. Just talk into your mic, and we'll build a perfect, ATS-optimized professional resume.
        </p>
      </div>

      {step === 1 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">1</span>
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
              <input type="text" name="name" value={form.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="Alex Morgan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email Address</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="alex@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number</label>
              <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Target Role *</label>
              <input type="text" name="target_role" value={form.target_role} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200" placeholder="e.g. Senior Frontend Engineer" />
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button onClick={handleStartInterview} disabled={!form.name || !form.target_role} className="btn-primary group">
              Begin Building Resume <Mic size={18} className="ml-1" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in relative overflow-hidden">
          
          {loading && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center z-10">
               <Loader2 size={48} className="animate-spin text-indigo-500 mb-4" />
               <p className="text-lg font-medium text-slate-800">Compiling your answers...</p>
               <p className="text-sm text-slate-500 mt-2">Gemini is structuring your professional resume.</p>
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm">2</span>
              Interactive Interview ({qIndex + 1}/{INTERVIEW_QUESTIONS.length})
            </h2>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-6 flex gap-4">
            <div className="shrink-0 w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <Bot className={`text-indigo-600 ${isSpeaking ? 'animate-pulse' : ''}`} size={24} />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700 mb-1">AI Resume Coach</p>
              <p className="text-slate-900 text-lg">{INTERVIEW_QUESTIONS[qIndex]}</p>
            </div>
          </div>

          <div className="mb-8">
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              className="w-full h-32 px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all resize-none"
              placeholder="Your answer will appear here... (You can also just type it manually)"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button onClick={() => handleNextQuestion(true)} className="px-4 py-2 text-slate-500 hover:text-slate-800 flex items-center gap-2 font-medium w-full sm:w-auto justify-center">
              <FastForward size={18} />
              Skip Question
            </button>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button 
                onClick={toggleListen} 
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all shadow-md ${isListening ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-slate-800 hover:bg-slate-900'}`}
              >
                {isListening ? (
                  <><StopCircle size={18} /> Stop Recording</>
                ) : (
                  <><Mic size={18} /> Speak Answer</>
                )}
              </button>

              <button 
                onClick={() => handleNextQuestion(false)} 
                disabled={!currentAnswer.trim()}
                className="flex-1 sm:flex-none btn-primary"
              >
                {qIndex === INTERVIEW_QUESTIONS.length - 1 ? 'Finish & Generate' : 'Next Question'} <ArrowRight size={18} />
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 3 && generatedMarkdown && (
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={24} />
              <span className="font-semibold text-lg">Your Resume is Ready!</span>
            </div>
            <button onClick={handleDownloadPDF} className="btn-primary">
              <Download size={18} /> Download PDF
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex justify-center">
            <style>{`
              #resume-preview-content {
                font-family: 'Times New Roman', Times, serif;
                color: #000;
                width: 100%;
                max-w: 800px;
                padding: 40px;
                background: white;
                box-shadow: 0 0 10px rgba(0,0,0,0.05);
              }
              #resume-preview-content h1 {
                text-align: center;
                font-size: 24pt;
                margin-bottom: 4px;
                font-weight: normal;
              }
              #resume-preview-content h1 + p {
                text-align: center;
                margin-top: 0;
                margin-bottom: 16px;
                font-size: 11pt;
              }
              #resume-preview-content h2 {
                border-bottom: 1px solid #000;
                font-size: 14pt;
                margin-top: 16px;
                margin-bottom: 8px;
                padding-bottom: 2px;
                font-weight: bold;
              }
              #resume-preview-content h3 {
                font-size: 12pt;
                font-weight: bold;
                margin-top: 8px;
                margin-bottom: 4px;
              }
              #resume-preview-content p {
                margin-top: 4px;
                margin-bottom: 4px;
                line-height: 1.4;
                font-size: 11pt;
              }
              #resume-preview-content ul {
                margin-top: 4px;
                margin-bottom: 8px;
                padding-left: 20px;
                list-style-type: disc;
              }
              #resume-preview-content li {
                margin-top: 2px;
                margin-bottom: 2px;
                font-size: 11pt;
                line-height: 1.4;
              }
              #resume-preview-content strong {
                font-weight: bold;
              }
            `}</style>
            <div id="resume-preview-content">
              <ReactMarkdown>{generatedMarkdown}</ReactMarkdown>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <button onClick={() => {
              setStep(1);
              setQIndex(0);
              setAnswers(Array(INTERVIEW_QUESTIONS.length).fill(''));
              setCurrentAnswer('');
              setGeneratedMarkdown(null);
            }} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm transition-colors">
              Create another resume
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Builder;
