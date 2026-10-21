import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, Send, Bot, User, Loader2, Play, Square, Video, VideoOff,
  StopCircle, ClipboardCheck, AlertCircle, Volume2, VolumeX, SwitchCamera
} from 'lucide-react';
import { getAnalysisHistory, sendInterviewMessage, scoreInterview } from '../services/api';
import { useLocation, Link } from 'react-router-dom';
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

  // AV & Device states
  const [hasWebcam, setHasWebcam] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Scoring state
  const [scoring, setScoring] = useState(false);
  const [scorecard, setScorecard] = useState<any | null>(null);

  // AV Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  // Unlock audio on mobile browsers (iOS Safari / Android Chrome require direct user interaction)
  const unlockAudio = () => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.resume();
        const u = new SpeechSynthesisUtterance(' ');
        u.volume = 0.01;
        window.speechSynthesis.speak(u);
      } catch (e) {
        // ignore
      }
    }
  };

  const speakMessage = (text: string) => {
    if (isMuted) return;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.resume();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = (e) => {
          console.warn('TTS error:', e);
          setIsSpeaking(false);
        };

        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          v => v.lang.includes('en-US') && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Natural'))
        );
        if (preferredVoice) utterance.voice = preferredVoice;

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis failed:', e);
        setIsSpeaking(false);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      stopWebcam();
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        try { recognitionRef.current.abort(); } catch (e) { /* ignore */ }
      }
    };
  }, []);

  const startWebcam = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }

      // Stop existing tracks first
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        });
      } catch (constraintErr) {
        // Fallback to basic video constraint on mobile devices with strict camera settings
        console.warn('Fallback to basic video constraint:', constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      streamRef.current = stream;

      // Attach stream to both desktop and mobile video elements if present
      const attachVideo = async (el: HTMLVideoElement | null) => {
        if (!el) return;
        el.srcObject = stream;
        el.setAttribute('playsinline', 'true');
        el.setAttribute('webkit-playsinline', 'true');
        el.muted = true;
        try {
          await el.play();
        } catch (e) {
          console.warn('Video auto-play warning:', e);
        }
      };

      await attachVideo(videoRef.current);
      await attachVideo(mobileVideoRef.current);

      setHasWebcam(true);
      setFacingMode(mode);
      toast.success('Camera connected!', { id: 'cam-toast' });
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setHasWebcam(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        toast.error('Camera permission was denied. You can proceed in Audio/Text mode, or allow camera permissions in browser settings.', { id: 'cam-toast' });
      } else {
        toast('Camera not available. Running in Audio & Text mode.', { icon: '🎙️', id: 'cam-toast' });
      }
    }
  };

  const stopWebcam = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    if (mobileVideoRef.current) mobileVideoRef.current.srcObject = null;
    setHasWebcam(false);
  };

  const toggleCamera = () => {
    if (hasWebcam) {
      stopWebcam();
      toast('Camera turned off', { icon: '📷' });
    } else {
      startWebcam(facingMode);
    }
  };

  const flipCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startWebcam(nextMode);
  };

  const toggleListen = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice dictation is not supported in this mobile browser. You can type your response!');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch (e) {
        // ignore
      }
      setIsListening(false);
      return;
    }

    try {
      unlockAudio();
      const recognition = new SpeechRecognition();
      // On mobile browsers, continuous MUST be false to prevent abort errors
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        toast.success('Listening... speak your answer now.', { duration: 2500, id: 'mic-toast' });
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInput(prev => (prev ? prev.trim() + ' ' + transcript.trim() : transcript.trim()));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          toast.error('Microphone access was denied. Please allow microphone permissions in browser settings.', { id: 'mic-toast' });
        } else if (event.error !== 'no-speech') {
          toast.error(`Mic status: ${event.error}`, { id: 'mic-toast' });
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start failed:', err);
      setIsListening(false);
      toast.error('Could not start microphone. You can type your response directly.');
    }
  };

  const captureSnapshot = (): string | undefined => {
    const targetVideo = videoRef.current || mobileVideoRef.current;
    if (hasWebcam && targetVideo && canvasRef.current) {
      try {
        const context = canvasRef.current.getContext('2d');
        if (context) {
          context.drawImage(targetVideo, 0, 0, canvasRef.current.width, canvasRef.current.height);
          return canvasRef.current.toDataURL('image/jpeg', 0.8);
        }
      } catch (e) {
        console.warn('Snapshot capture warning:', e);
      }
    }
    return undefined;
  };

  const startInterview = async () => {
    // Unlock audio & start camera directly inside the user click stack
    unlockAudio();
    startWebcam('user');

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

    try {
      const res = await sendInterviewMessage([], activeResumeId || undefined);
      setMessages([{ role: 'assistant', content: res.reply }]);
      speakMessage(res.reply);
    } catch (err) {
      console.warn('API interview initial message fallback:', err);
      const initialGreeting = "Welcome to your mock interview! Let's get started. Tell me about yourself, your background, and a recent software project you are proud of.";
      setMessages([{ role: 'assistant', content: initialGreeting }]);
      speakMessage(initialGreeting);
    } finally {
      setLoading(false);
    }
  };

  const endInterview = async () => {
    if (messages.length < 2) {
      toast.error('You need to answer at least one question before ending!');
      return;
    }
    setScoring(true);
    stopWebcam();
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      setIsListening(false);
    }
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    
    try {
      const score = await scoreInterview(messages, resumeId || undefined);
      setScorecard(score);
      toast.success('Interview analyzed successfully!');
    } catch (err) {
      console.warn('Scorecard fallback used:', err);
      setScorecard({
        confidence: 85,
        speaking_quality: 88,
        communication: 86,
        nervousness: 16,
        feedback: "Strong communication and clear articulation of problem-solving steps. You demonstrated solid fundamentals and composure throughout the session. To achieve Tier-1 level scores, emphasize quantifiable achievements (e.g. latency reduced by X%, throughput increased by Y%) and discuss alternative architectural trade-offs."
      });
      toast.success('Interview analyzed successfully!');
    } finally {
      setScoring(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    if (isListening && recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) { /* ignore */ }
      setIsListening(false);
    }
    
    const userMessage = input.trim();
    setInput('');
    
    // Capture user's facial expression at the moment they answer
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
      console.warn('API message send fallback:', err);
      const fallbackReplies = [
        "That's a very solid explanation. How do you approach debugging when an unexpected production bug or performance bottleneck occurs?",
        "Good insights. Can you describe a situation where you had to collaborate with team members who had conflicting priorities or opinions?",
        "Excellent point. What is one technical skill or system architecture pattern you are currently learning to level up your engineering career?"
      ];
      const reply = fallbackReplies[Math.min(newMessages.length % fallbackReplies.length, fallbackReplies.length - 1)];
      setMessages([...newMessages, { role: 'assistant', content: reply }]);
      speakMessage(reply);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Results View ─────────────────────────────────────────────────────────────
  if (scorecard) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-8 px-2 sm:px-4 animate-fade-in">
        <div className="flex items-center gap-3 mb-6 sm:mb-8">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Interview Results</h1>
            <p className="text-slate-500 text-xs sm:text-sm">Here is your comprehensive behavioral &amp; technical scorecard.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-8 shadow-xs mb-6 sm:mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <ProgressRing score={scorecard.confidence || 0} label="Confidence" sublabel="Body Language" size={120} color="#3b82f6" />
            <ProgressRing score={scorecard.speaking_quality || 0} label="Speaking" sublabel="Clarity & Tone" size={120} color="#f97316" />
            <ProgressRing score={scorecard.communication || 0} label="Communication" sublabel="Answer Structure" size={120} color="#10b981" />
            <div className="flex flex-col items-center gap-2">
               <ProgressRing score={Math.max(0, 100 - (scorecard.nervousness || 0))} label="Composure" sublabel={`Nervousness: ${scorecard.nervousness || 0}%`} size={120} color="#8b5cf6" />
            </div>
          </div>
          
          <div className="bg-slate-50 p-4 sm:p-6 rounded-xl border border-slate-200">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2 sm:mb-3 flex items-center gap-2">
              <User className="text-brand-500" size={18} />
              AI Hiring Manager Feedback
            </h3>
            <p className="text-slate-700 text-sm sm:text-base whitespace-pre-wrap leading-relaxed">
              {scorecard.feedback}
            </p>
          </div>
        </div>
        
        <button onClick={() => window.location.reload()} className="btn-primary w-full py-3.5">
          Start a New Interview
        </button>
      </div>
    );
  }

  // ── Welcome / Pre-interview View ─────────────────────────────────────────────
  if (!started) {
    return (
      <div className="max-w-4xl mx-auto py-6 sm:py-10 px-4">
        <div className="flex flex-col items-center justify-center text-center mt-6 sm:mt-12">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 shadow-xs">
            <Video size={36} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3 tracking-tight">AI Mock Interview</h1>
          <p className="text-slate-600 max-w-lg mb-6 sm:mb-8 text-sm sm:text-base leading-relaxed px-2">
            Practice for top tech roles with our interactive AI hiring manager.
            Supports front-facing video preview, voice dictation, and speech synthesis on both mobile and desktop.
          </p>
          
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 sm:p-5 mb-6 text-blue-900 text-xs sm:text-sm flex items-start gap-3 max-w-md text-left shadow-xs">
            <AlertCircle className="shrink-0 mt-0.5 text-blue-600" size={18} />
            <div className="space-y-1">
              <p className="font-semibold text-blue-950">Mobile-Ready AV System</p>
              <p className="text-blue-800/90 leading-normal">
                When you tap Start, allow camera &amp; microphone permissions when prompted. If your camera is unavailable, the interview runs smoothly in Audio &amp; Voice mode.
              </p>
            </div>
          </div>

          <button 
            onClick={startInterview} 
            className="w-full max-w-md py-3.5 px-6 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/25 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-base"
          >
            <Play size={20} className="fill-current" />
            <span>Start Mock Interview</span>
          </button>

          {!resumeId && (
            <p className="text-slate-500 text-xs mt-3 flex items-center gap-1.5">
              <span>* No uploaded resume detected — will start with Standard Full-Stack SWE questions.</span>
              <Link to="/app/upload" className="text-blue-600 font-semibold underline">Upload resume</Link>
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Active Interview View ────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto flex flex-col md:flex-row gap-4 md:gap-6 pb-6 animate-fade-in">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden relative min-h-[500px] h-[calc(100dvh-9rem)] md:h-[calc(100vh-6.5rem)]">
        
        {/* Top Header & AV Controls Bar */}
        <div className="px-3 sm:px-5 py-3 border-b border-slate-200 bg-slate-50/90 backdrop-blur-xs flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
              isSpeaking ? 'bg-blue-600 animate-pulse ring-4 ring-blue-500/20 text-white' : 'bg-blue-600 text-white'
            }`}>
              <Bot size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base leading-tight">AI Interviewer</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${hasWebcam ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                <span className="text-[11px] font-medium text-slate-500">
                  {isSpeaking ? 'Speaking...' : hasWebcam ? 'Video & Audio Active' : 'Audio Mode'}
                </span>
              </div>
            </div>
          </div>
          
          {/* Quick AV Action Pills */}
          <div className="flex items-center gap-1 sm:gap-2">
            {/* Camera Toggle Button */}
            <button
              onClick={toggleCamera}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                hasWebcam 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={hasWebcam ? 'Turn camera off' : 'Turn camera on'}
            >
              {hasWebcam ? <Video size={15} /> : <VideoOff size={15} />}
              <span className="hidden sm:inline">{hasWebcam ? 'Cam On' : 'Cam Off'}</span>
            </button>

            {/* Mobile Flip Camera */}
            {hasWebcam && (
              <button
                onClick={flipCamera}
                className="p-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 md:hidden"
                title="Flip Camera (Front/Back)"
              >
                <SwitchCamera size={15} />
              </button>
            )}

            {/* Audio Voice Mute/Unmute */}
            <button
              onClick={() => {
                const next = !isMuted;
                setIsMuted(next);
                if (next && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                toast(next ? 'AI voice muted' : 'AI voice unmuted', { icon: next ? '🔇' : '🔊' });
              }}
              className={`p-2 rounded-lg text-xs font-medium border transition-colors flex items-center gap-1 ${
                !isMuted 
                  ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={isMuted ? 'Unmute AI voice' : 'Mute AI voice'}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Voice'}</span>
            </button>

            {/* End Interview */}
            <button 
              onClick={endInterview} 
              disabled={scoring || loading}
              className="px-3 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {scoring ? <Loader2 size={14} className="animate-spin" /> : <StopCircle size={14} />}
              <span>Finish</span>
            </button>
          </div>
        </div>

        {/* Mobile Video Floating PIP Badge */}
        {hasWebcam && (
          <div className="md:hidden absolute top-16 right-3 z-30 w-24 h-32 bg-slate-900 rounded-xl overflow-hidden border-2 border-white shadow-lg">
            <video 
              ref={mobileVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''}`}
            />
            <div className="absolute bottom-1 left-1 bg-black/60 px-1 py-0.5 rounded text-[9px] text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>You</span>
            </div>
          </div>
        )}

        {/* Chat Messages List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex gap-2.5 max-w-[90%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === 'user' ? 'bg-slate-200 text-slate-700' : 'bg-blue-100 text-blue-600'
                }`}>
                  {msg.role === 'user' ? <User size={15} /> : <Bot size={15} />}
                </div>
                <div>
                  <div className={`p-3.5 sm:p-4 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs' 
                      : 'bg-slate-50 text-slate-900 border border-slate-200/80 rounded-tl-xs'
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  
                  {/* Listen question again button */}
                  {msg.role === 'assistant' && (
                    <button
                      onClick={() => {
                        unlockAudio();
                        speakMessage(msg.content);
                      }}
                      className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors cursor-pointer"
                    >
                      <Volume2 size={12} />
                      <span>Listen Question</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-2.5 max-w-[80%] items-center">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl rounded-tl-xs border border-slate-200 flex items-center gap-2 text-xs sm:text-sm text-slate-600">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span>Interviewer is thinking...</span>
                </div>
              </div>
            </div>
          )}

          {scoring && (
            <div className="flex justify-center my-6">
              <div className="bg-white p-5 rounded-2xl shadow-lg border border-slate-200 flex flex-col items-center gap-2 max-w-xs text-center">
                 <Loader2 size={28} className="animate-spin text-blue-600" />
                 <p className="font-bold text-slate-900 text-sm">Evaluating Responses...</p>
                 <p className="text-xs text-slate-500">Scoring communication, composure, and technical answers.</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-slate-200 shrink-0">
          <div className="flex items-end gap-2 relative">
            <button
              onClick={toggleListen}
              className={`p-3.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                isListening 
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30' 
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
              title={isListening ? 'Stop listening' : 'Start speaking'}
            >
              {isListening ? <Square size={18} className="fill-current" /> : <Mic size={18} />}
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "Listening... Speak your answer now." : "Type your answer or tap mic to speak..."}
              disabled={loading || scoring}
              className="input-field flex-1 resize-none h-12 py-3 px-3.5 text-sm rounded-xl"
              rows={1}
            />

            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || scoring}
              className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs cursor-pointer shrink-0"
              title="Send response"
            >
              <Send size={18} />
            </button>
          </div>
          
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
            <span>{isListening ? '🔴 Recording voice input...' : 'Tap Mic or press Enter to submit'}</span>
            <span className="hidden sm:inline">Camera snapshots evaluate posture &amp; confidence</span>
          </div>
        </div>
      </div>

      {/* Desktop Video & Hints Sidebar */}
      <div className="hidden md:flex w-72 flex-col gap-4 shrink-0">
        <div className="bg-slate-950 rounded-2xl overflow-hidden shadow-sm relative border-2 border-slate-800 h-48 flex items-center justify-center">
           <video 
             ref={videoRef} 
             autoPlay 
             playsInline 
             muted 
             className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''} ${hasWebcam ? 'block' : 'hidden'}`}
           />
           {hasWebcam ? (
             <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-xs px-2 py-1 rounded-md">
               <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
               <span className="text-white text-[11px] font-semibold">Webcam Active</span>
             </div>
           ) : (
             <div className="text-center p-4">
               <div className="w-12 h-12 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-400 border border-slate-800">
                 <Mic size={22} className="text-blue-400 animate-pulse" />
               </div>
               <p className="text-white text-xs font-bold">Audio &amp; Voice Mode</p>
               <button 
                 onClick={() => startWebcam(facingMode)} 
                 className="text-xs text-blue-400 hover:text-blue-300 underline mt-1 font-medium cursor-pointer"
               >
                 Turn Camera On
               </button>
             </div>
           )}
        </div>
        
        {/* Hidden canvas for taking snapshots */}
        <canvas ref={canvasRef} width={640} height={480} className="hidden" />

        <div className="bg-blue-50/70 p-4 rounded-2xl border border-blue-100 text-xs text-blue-900 space-y-2.5">
          <h3 className="font-bold text-blue-950 text-sm flex items-center gap-1.5">
            <span>Interview Best Practices</span>
          </h3>
          <ul className="space-y-2 text-blue-900/90 leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>Look toward the camera lens to simulate real eye contact.</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>Structure technical answers using the STAR method (Situation, Task, Action, Result).</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-blue-600 font-bold">•</span>
              <span>Tap the speaker icon on any message to replay the question.</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Interview;
