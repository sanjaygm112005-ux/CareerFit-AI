import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Bot, User, Loader2, Play, Square, Video, StopCircle, ClipboardCheck, AlertCircle } from 'lucide-react';
import { getAnalysisHistory, sendInterviewMessage, scoreInterview } from '../services/api';
import { useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import ProgressRing from '../components/ProgressRing';

interface Message {
  role: 'assistant' | 'user';
  content: string;
  image?: string;
}

const Interview: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const location = useLocation();
  const [resumeId, setResumeId] = useState<string | null>(
    (location.state as any)?.resumeId || localStorage.getItem('current_resume_id')
  );
  
  // Scoring state
  const [scoring, setScoring] = useState(false);
  const [scorecard, setScorecard] = useState<any | null>(null);

  // AV Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);

  const speakMessage = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Stop any ongoing speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.includes('en-US') && v.name.includes('Google'));
      if (preferredVoice) utterance.voice = preferredVoice;
      
      window.speechSynthesis.speak(utterance);
    }
  };

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
        setInput(transcript);
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
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsListening(true);
      } else {
        toast.error('Voice recognition is not supported in this browser.');
      }
    }
  };

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing webcam:', err);
      toast.error('Could not access webcam. Make sure you grant permissions.');
    }
  };

  const stopWebcam = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
  };

  const captureSnapshot = (): string | undefined => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        // Draw the current video frame onto the canvas
        context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
        // Get the image data URL (base64)
        return canvasRef.current.toDataURL('image/jpeg', 0.8);
      }
    }
    return undefined;
  };

  const startInterview = async () => {
    let activeResumeId = resumeId;
    if (!activeResumeId) {
      try {
        const hist = await getAnalysisHistory();
        if (hist.history && hist.history.length > 0) {
          activeResumeId = hist.history[0].resume_id;
          setResumeId(activeResumeId);
          localStorage.setItem('current_resume_id', activeResumeId);
        }
      } catch (err) {
        console.warn('Could not auto-fetch history:', err);
      }
    }
    setStarted(true);
    setLoading(true);
    await startWebcam();
    try {
      const res = await sendInterviewMessage([], activeResumeId || undefined);
      setMessages([{ role: 'assistant', content: res.reply }]);
      speakMessage(res.reply);
    } catch (err) {
      toast.error('Failed to start interview.');
      console.error(err);
      setStarted(false);
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    if (messages.length < 2) {
      toast.error('You need to answer some questions before ending!');
      return;
    }
    setScoring(true);
    stopWebcam();
    if (isListening) toggleListen();
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    try {
      const score = await scoreInterview(messages, resumeId || undefined);
      setScorecard(score);
      toast.success('Interview analyzed successfully!');
    } catch (err) {
      toast.error('Failed to generate scorecard.');
      console.error(err);
      setScoring(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    if (isListening) toggleListen(); // stop listening when sending
    
    const userMessage = input.trim();
    setInput('');
    
    // Capture user's facial expression at the exact moment they answer
    const imageBase64 = captureSnapshot();
    
    const newMessages: Message[] = [
      ...messages,
      { role: 'user', content: userMessage, image: imageBase64 }
    ];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await sendInterviewMessage(newMessages, resumeId || undefined);
      setMessages([...newMessages, { role: 'assistant', content: res.reply }]);
      speakMessage(res.reply);
    } catch (err) {
      toast.error('Failed to send message.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (scorecard) {
    return (
      <div className="max-w-4xl mx-auto py-8 animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Interview Results</h1>
            <p className="text-slate-500">Here is your comprehensive behavioral scorecard.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            <ProgressRing score={scorecard.confidence || 0} label="Confidence" sublabel="Body Language" size={140} color="#3b82f6" />
            <ProgressRing score={scorecard.speaking_quality || 0} label="Speaking Quality" sublabel="Clarity & Tone" size={140} color="#f97316" />
            <ProgressRing score={scorecard.communication || 0} label="Communication" sublabel="Answer Structure" size={140} color="#10b981" />
            <div className="flex flex-col items-center gap-2">
               <ProgressRing score={100 - (scorecard.nervousness || 0)} label="Composure" sublabel={`Nervousness: ${scorecard.nervousness}%`} size={140} color="#8b5cf6" />
            </div>
          </div>
          
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <User className="text-brand-500" size={20} />
              AI Hiring Manager Feedback
            </h3>
            <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
              {scorecard.feedback}
            </p>
          </div>
        </div>
        
        <button onClick={() => window.location.reload()} className="btn-secondary w-full">
          Start a New Interview
        </button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex flex-col items-center justify-center text-center mt-20">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mb-6">
            <Video className="text-brand-500" size={40} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Video Mock Interview</h1>
          <p className="text-slate-600 max-w-lg mb-8 leading-relaxed">
            Practice for your next big opportunity with our AI hiring manager. 
            We will use your webcam and microphone to analyze your body language, confidence, and speaking quality in real-time.
          </p>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 text-amber-800 text-sm flex items-start gap-3 max-w-lg text-left">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <p>Your browser will request access to your webcam and microphone. We only take periodic snapshots during the interview which are not stored permanently.</p>
          </div>

          <button 
            onClick={startInterview} 
            disabled={!resumeId}
            className="btn-primary w-full max-w-sm flex items-center justify-center gap-2 mb-4 disabled:opacity-50"
          >
            <Play size={20} />
            Start Mock Interview
          </button>
          {!resumeId && (
            <p className="text-rose-500 text-sm bg-rose-50 p-3 rounded-lg max-w-sm">
              ⚠ You haven't uploaded a resume yet. The AI needs your resume to interview you!
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto min-h-[calc(100dvh-7.5rem)] md:h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 md:gap-6 pb-6 animate-fade-in">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden relative min-h-[420px]">
        {/* Header */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSpeaking ? 'bg-brand-500 animate-pulse shadow-lg shadow-brand-500/40' : 'bg-brand-500'}`}>
              <Bot className="text-white" size={20} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">AI Hiring Manager</h2>
              <p className="text-xs text-brand-600 font-medium">
                {isSpeaking ? 'Speaking...' : 'Recording & Analyzing'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={endInterview} 
            disabled={scoring || loading}
            className="px-4 py-2 bg-rose-50 text-rose-600 font-semibold rounded-lg hover:bg-rose-100 transition-colors flex items-center gap-2 text-sm"
          >
            {scoring ? <Loader2 size={16} className="animate-spin" /> : <StopCircle size={16} />}
            End & Get Score
          </button>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-200' : 'bg-brand-100'
                }`}>
                  {msg.role === 'user' ? <User size={16} className="text-slate-600" /> : <Bot size={16} className="text-brand-600" />}
                </div>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-sm' 
                    : 'bg-slate-50 text-slate-800 border border-slate-200 rounded-tl-sm'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0">
                  <Bot size={16} className="text-brand-600" />
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl rounded-tl-sm border border-slate-200 flex items-center gap-2">
                  <Loader2 size={18} className="animate-spin text-brand-400" />
                  <span className="text-sm text-slate-500">Interviewer is thinking...</span>
                </div>
              </div>
            </div>
          )}
          {scoring && (
            <div className="flex justify-center my-8">
              <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center gap-3">
                 <Loader2 size={32} className="animate-spin text-brand-500" />
                 <p className="font-semibold text-slate-800">Generating your Scorecard...</p>
                 <p className="text-xs text-slate-500">Analyzing body language and speech quality</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="flex items-end gap-2 relative">
            <button
              onClick={toggleListen}
              className={`p-4 rounded-xl shrink-0 transition-all ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {isListening ? <Square size={20} /> : <Mic size={20} />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... speak now." : "Type your answer or use the microphone..."}
              disabled={loading || scoring}
              className="input-field flex-1 resize-none h-14 py-4"
              rows={1}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || scoring}
              className="p-4 bg-brand-500 text-white rounded-xl hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Video Feed Section */}
      <div className="w-full md:w-72 flex flex-col sm:flex-row md:flex-col gap-4 md:gap-6 shrink-0">
        <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-sm relative border-4 border-slate-900 h-44 sm:h-48">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className="w-full h-full object-cover transform -scale-x-100"
           />
           <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-md">
             <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
             <span className="text-white text-xs font-medium">Recording</span>
           </div>
        </div>
        
        {/* Hidden canvas for taking snapshots */}
        <canvas ref={canvasRef} width={640} height={480} className="hidden" />

        <div className="bg-brand-50 p-6 rounded-2xl border border-brand-100">
          <h3 className="font-bold text-brand-900 mb-2">Interview Tips</h3>
          <ul className="text-sm text-brand-800 space-y-3">
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              Maintain eye contact with the camera.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              Use the microphone button to practice speaking clearly.
            </li>
            <li className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 mt-1.5 shrink-0" />
              Sit up straight to show confidence.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Interview;
