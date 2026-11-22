import React, { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  HelpCircle, Search, Sparkles, MessageSquare, Mic, Video, CheckCircle2,
  AlertTriangle, Send, RefreshCw, Copy, ExternalLink, ShieldCheck,
  ChevronDown, ChevronUp, Bot, FileText, GraduationCap, Activity,
  Cpu, Check, Volume2, LifeBuoy, ArrowRight, X
} from 'lucide-react';
import toast from 'react-hot-toast';
import {
  getHelpFAQs,
  askHelpAI,
  submitSupportTicket,
  getHelpDiagnostics
} from '../services/api';
import type { HelpFAQ, HelpAiResponse } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const CATEGORIES = [
  { id: 'all', label: 'All Topics' },
  { id: 'resume_ats', label: 'Resume & ATS' },
  { id: 'placement_engine', label: 'Placement Engine' },
  { id: 'mock_interview', label: 'Mock Interview' },
  { id: 'ml_architecture', label: 'ML & Architecture' },
  { id: 'account_platform', label: 'Account & Sync' }
];

const QUICK_PROMPTS = [
  "How is the ATS score calculated?",
  "Why is my microphone blocked during Mock Interview?",
  "What are the CGPA cutoffs for Tier-1 companies?",
  "How does the ML Domain Classifier work?",
  "How can I download my resume as LaTeX/PDF?"
];

export const Help: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active Main Tab
  const [activeTab, setActiveTab] = useState<'faqs' | 'ai_assistant' | 'diagnostics' | 'ticket' | 'guide'>('faqs');

  // Handle URL search params on load or change
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['faqs', 'ai_assistant', 'diagnostics', 'ticket', 'guide'].includes(tabParam)) {
      setActiveTab(tabParam as 'faqs' | 'ai_assistant' | 'diagnostics' | 'ticket' | 'guide');
    }
    const qParam = searchParams.get('q');
    if (qParam) {
      setSearchQuery(qParam);
    }
    const catParam = searchParams.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    }
  }, [searchParams]);

  const handleTabChange = (tab: 'faqs' | 'ai_assistant' | 'diagnostics' | 'ticket' | 'guide') => {
    setActiveTab(tab);
    setSearchParams(prev => {
      prev.set('tab', tab);
      return prev;
    });
  };

  // FAQs State
  const [faqs, setFaqs] = useState<HelpFAQ[]>([]);
  const [filteredFaqs, setFilteredFaqs] = useState<HelpFAQ[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqsLoading, setFaqsLoading] = useState<boolean>(true);

  // AI Assistant State
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<HelpAiResponse | null>(null);

  // Support Ticket State
  const [ticketName, setTicketName] = useState<string>('');
  const [ticketEmail, setTicketEmail] = useState<string>('');
  const [ticketCategory, setTicketCategory] = useState<string>('placement');
  const [ticketPriority, setTicketPriority] = useState<string>('normal');
  const [ticketSubject, setTicketSubject] = useState<string>('');
  const [ticketMessage, setTicketMessage] = useState<string>('');
  const [ticketSubmitting, setTicketSubmitting] = useState<boolean>(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  // Device Diagnostics State
  const [checkingDiagnostics, setCheckingDiagnostics] = useState<boolean>(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'operational' | 'error'>('checking');
  const [micStatus, setMicStatus] = useState<'unknown' | 'testing' | 'granted' | 'denied'>('unknown');
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [cameraStatus, setCameraStatus] = useState<'unknown' | 'testing' | 'granted' | 'denied'>('unknown');
  const [speechRecSupported, setSpeechRecSupported] = useState<boolean>(false);
  const [speechSynSupported, setSpeechSynSupported] = useState<boolean>(false);
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Load FAQs and initial profile
  useEffect(() => {
    loadFaqs();
    checkBrowserFeatures();
    if (user?.email) {
      setTicketEmail(user.email);
    }
    // Cleanup media streams on unmount
    return () => {
      stopCameraTest();
    };
  }, [user]);

  // Filter FAQs when query or category changes
  useEffect(() => {
    let result = faqs;
    if (selectedCategory !== 'all') {
      result = result.filter(f => f.category.toLowerCase() === selectedCategory.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(f =>
        f.question.toLowerCase().includes(q) ||
        f.answer.toLowerCase().includes(q) ||
        (f.tags && f.tags.some(t => t.toLowerCase().includes(q)))
      );
    }
    setFilteredFaqs(result);
  }, [searchQuery, selectedCategory, faqs]);

  const loadFaqs = async () => {
    setFaqsLoading(true);
    try {
      const data = await getHelpFAQs();
      setFaqs(data.faqs || []);
      setFilteredFaqs(data.faqs || []);
    } catch {
      toast.error('Unable to fetch remote FAQs, using offline knowledge base.');
    } finally {
      setFaqsLoading(false);
    }
  };

  const checkBrowserFeatures = async () => {
    setCheckingDiagnostics(true);
    // Check Speech APIs
    const hasSpeechRec = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
    const hasSpeechSyn = 'speechSynthesis' in window;
    setSpeechRecSupported(hasSpeechRec);
    setSpeechSynSupported(hasSpeechSyn);

    // Check Backend
    try {
      const diag = await getHelpDiagnostics();
      if (diag.api_status === 'operational') {
        setBackendStatus('operational');
      } else {
        setBackendStatus('error');
      }
    } catch {
      setBackendStatus('error');
    } finally {
      setCheckingDiagnostics(false);
    }
  };

  const testMicrophone = async () => {
    setMicStatus('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStatus('granted');
      toast.success('Microphone permission granted! Audio stream is active.');

      // Setup audio analyzer for live visualizer
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let frames = 0;
      const interval = setInterval(() => {
        if (!analyserRef.current) {
          clearInterval(interval);
          return;
        }
        analyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = Math.min(100, Math.round((sum / dataArray.length) * 1.5));
        setAudioLevel(average);
        frames++;
        if (frames > 40) {
          clearInterval(interval);
          stream.getTracks().forEach(t => t.stop());
          audioCtx.close();
          setAudioLevel(0);
        }
      }, 100);

    } catch (err) {
      setMicStatus('denied');
      toast.error('Microphone access blocked. Please allow mic permissions in browser settings.');
    }
  };

  const testCamera = async () => {
    setCameraStatus('testing');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      setCameraStatus('granted');
      toast.success('Camera stream verified successfully!');
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
      }
    } catch (err) {
      setCameraStatus('denied');
      toast.error('Camera access denied or device not found.');
    }
  };

  const stopCameraTest = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraStatus('unknown');
  };

  const handleAskAI = async (promptText?: string) => {
    const q = promptText || aiQuestion;
    if (!q.trim()) return;
    setAiQuestion(q);
    setAiLoading(true);
    try {
      const res = await askHelpAI(q);
      setAiResponse(res);
    } catch {
      toast.error('AI assistant is busy. Please try again or check FAQs.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketEmail.trim() || !ticketSubject.trim() || !ticketMessage.trim()) {
      toast.error('Please fill in all required ticket fields.');
      return;
    }
    setTicketSubmitting(true);
    try {
      const res = await submitSupportTicket({
        name: ticketName.trim() || 'Student',
        email: ticketEmail.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        subject: ticketSubject.trim(),
        message: ticketMessage.trim()
      });
      setSubmittedTicketId(res.ticket_id);
      toast.success(`Support Ticket #${res.ticket_id} submitted successfully!`);
      // Reset form
      setTicketSubject('');
      setTicketMessage('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit ticket';
      toast.error(msg);
    } finally {
      setTicketSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* ── Top Header Hero ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 p-6 md:p-10 text-white shadow-xl shadow-blue-900/10">
        <div className="absolute -right-12 -top-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-cyan-400/20 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold text-white tracking-wide border border-white/20">
            <LifeBuoy size={14} className="animate-spin-slow" />
            <span>Official Help & Support Center</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            How can we assist your placement journey today?
          </h1>
          <p className="text-blue-100 text-sm sm:text-base leading-relaxed">
            Get instant solutions for resume ATS optimization, campus recruiter eligibility rules, mock interview camera/mic setup, and technical troubleshooting.
          </p>

          {/* Instant Search Bar */}
          <div className="relative pt-2">
            <div className="relative flex items-center">
              <Search size={20} className="absolute left-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search FAQs, camera/mic permissions, ATS calculation, cutoffs..."
                className="w-full pl-12 pr-10 py-3.5 bg-white text-slate-900 rounded-2xl shadow-lg focus:outline-hidden focus:ring-4 focus:ring-cyan-300 text-sm font-medium placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-xl font-black text-white">99.8%</div>
            <div className="text-xs text-blue-100">System Uptime</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-xl font-black text-white">Gemini 1.5</div>
            <div className="text-xs text-blue-100">AI Assistant Ready</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-xl font-black text-white">3 Tiers</div>
            <div className="text-xs text-blue-100">Recruiter Auditing</div>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <div className="text-xl font-black text-white">&lt; 24h</div>
            <div className="text-xs text-blue-100">Ticket Resolution</div>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Tabs ──────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        <button
          onClick={() => handleTabChange('faqs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'faqs'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <HelpCircle size={17} />
          <span>Knowledge Base & FAQs</span>
        </button>

        <button
          onClick={() => handleTabChange('ai_assistant')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ai_assistant'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Bot size={17} />
          <span>Ask AI Assistant</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-amber-950">AI</span>
        </button>

        <button
          onClick={() => handleTabChange('diagnostics')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'diagnostics'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Activity size={17} />
          <span>Device & Mic Diagnostics</span>
        </button>

        <button
          onClick={() => handleTabChange('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'guide'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <GraduationCap size={17} />
          <span>Placement Checklist</span>
        </button>

        <button
          onClick={() => handleTabChange('ticket')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'ticket'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <MessageSquare size={17} />
          <span>Submit Support Ticket</span>
        </button>
      </div>

      {/* ── TAB 1: FAQs & Knowledge Base ──────────────────────────── */}
      {activeTab === 'faqs' && (
        <div className="space-y-6">
          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* FAQs Accordion List */}
          {faqsLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
              <RefreshCw size={24} className="text-blue-600 animate-spin mb-3" />
              <p className="text-sm font-semibold text-slate-600">Loading knowledge base...</p>
            </div>
          ) : filteredFaqs.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-2xl border border-slate-200 space-y-3">
              <AlertTriangle size={36} className="text-amber-500 mx-auto" />
              <h3 className="font-bold text-slate-800">No matching questions found</h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                Try adjusting your search terms or ask our AI Support Assistant for an immediate answer.
              </p>
              <button
                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                className="mt-2 text-xs font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFaqs.map((faq) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <div
                    key={faq.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all hover:border-blue-200"
                  >
                    <button
                      onClick={() => setExpandedFaq(isExpanded ? null : faq.id)}
                      className="w-full flex items-center justify-between p-4 sm:p-5 text-left cursor-pointer hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                          <HelpCircle size={18} />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-blue-600 mb-1">
                            {faq.category_label}
                          </div>
                          <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                            {faq.question}
                          </h3>
                        </div>
                      </div>
                      <div className="text-slate-400 pl-2 shrink-0">
                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 bg-slate-50/50 space-y-4 animate-fade-in">
                        <p className="text-sm text-slate-700 leading-relaxed font-normal">
                          {faq.answer}
                        </p>

                        {/* Tags & Action Link */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {faq.tags?.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white border border-slate-200 text-slate-600"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(faq.answer)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                              title="Copy Answer"
                            >
                              <Copy size={13} />
                              <span>Copy</span>
                            </button>

                            {faq.action_link && (
                              <Link
                                to={faq.action_link}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                              >
                                <span>{faq.action_label || 'Launch Feature'}</span>
                                <ExternalLink size={13} />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: AI Support Assistant ───────────────────────────── */}
      {activeTab === 'ai_assistant' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                  <Bot size={22} />
                </div>
                <div>
                  <h2 className="font-extrabold text-slate-900 text-lg">CareerFit AI Support Agent</h2>
                  <p className="text-xs text-slate-500">Ask any question regarding our algorithms, ATS checks, or placement rules</p>
                </div>
              </div>

              {/* Input Form */}
              <div className="space-y-3">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    placeholder="e.g., Why is my ATS score 65? How do I clear Tier 1 placement cutoffs?"
                    className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Powered by Gemini 1.5 Flash</span>
                  <button
                    onClick={() => handleAskAI()}
                    disabled={aiLoading || !aiQuestion.trim()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
                  >
                    {aiLoading ? (
                      <>
                        <RefreshCw size={16} className="animate-spin" />
                        <span>Generating Answer...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        <span>Ask AI Assistant</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* AI Answer Display */}
              {aiResponse && (
                <div className="mt-6 p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 to-indigo-50/50 border border-blue-100 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 uppercase tracking-wider">
                      <CheckCircle2 size={15} className="text-blue-600" />
                      AI Solution
                    </span>
                    <button
                      onClick={() => copyToClipboard(aiResponse.answer)}
                      className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-white/80 transition-colors cursor-pointer"
                      title="Copy Answer"
                    >
                      <Copy size={15} />
                    </button>
                  </div>

                  <div className="text-sm text-slate-800 leading-relaxed font-normal whitespace-pre-line">
                    {aiResponse.answer}
                  </div>

                  {/* Suggested Actions */}
                  {aiResponse.suggested_actions && aiResponse.suggested_actions.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <div className="text-xs font-bold text-slate-700">Recommended Next Steps:</div>
                      <div className="flex flex-wrap gap-2">
                        {aiResponse.suggested_actions.map((act, i) => (
                          <span
                            key={i}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-blue-200 text-blue-800 shadow-2xs"
                          >
                            ✓ {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Related Links */}
                  {aiResponse.related_links && aiResponse.related_links.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-2">
                      {aiResponse.related_links.map((link, i) => (
                        <Link
                          key={i}
                          to={link.path}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-2xs"
                        >
                          <span>{link.title}</span>
                          <ArrowRight size={13} />
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Prompts Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles size={16} className="text-amber-500" />
                <span>Frequently Asked Questions</span>
              </h3>
              <p className="text-xs text-slate-500">Click any prompt to get an immediate AI breakdown:</p>

              <div className="space-y-2">
                {QUICK_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAskAI(prompt)}
                    className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-blue-50/80 hover:text-blue-700 text-slate-700 text-xs font-medium border border-slate-200/80 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <span>{prompt}</span>
                    <ArrowRight size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: Device & System Diagnostics ───────────────────── */}
      {activeTab === 'diagnostics' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Microphone Diagnostic Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Mic size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Microphone Diagnostic</h3>
                    <p className="text-xs text-slate-500">Required for Mock Interview voice answers</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  micStatus === 'granted'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : micStatus === 'denied'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {micStatus === 'granted' ? 'Allowed' : micStatus === 'denied' ? 'Blocked' : 'Unchecked'}
                </span>
              </div>

              <p className="text-sm text-slate-600">
                Click below to grant microphone access and visualize your live input speech level.
              </p>

              {/* Live Audio Meter */}
              {audioLevel > 0 && (
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>Input Volume</span>
                    <span>{audioLevel}%</span>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={testMicrophone}
                disabled={micStatus === 'testing'}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Volume2 size={16} />
                <span>{micStatus === 'testing' ? 'Listening...' : 'Test Microphone Level'}</span>
              </button>
            </div>

            {/* Camera Diagnostic Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <Video size={22} />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Camera Diagnostic</h3>
                    <p className="text-xs text-slate-500">Live Selfie PIP preview in Mock Interview</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  cameraStatus === 'granted'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : cameraStatus === 'denied'
                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {cameraStatus === 'granted' ? 'Stream OK' : cameraStatus === 'denied' ? 'Blocked' : 'Unchecked'}
                </span>
              </div>

              <p className="text-sm text-slate-600">
                Check camera hardware and framing for confident posture during simulated interviews.
              </p>

              {cameraStatus === 'granted' && (
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 aspect-video max-h-40 border border-slate-200">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform scale-x-[-1]"
                  />
                  <button
                    onClick={stopCameraTest}
                    className="absolute top-2 right-2 p-1 bg-black/60 hover:bg-black text-white rounded-lg text-xs"
                  >
                    Stop
                  </button>
                </div>
              )}

              <button
                onClick={cameraStatus === 'granted' ? stopCameraTest : testCamera}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Video size={16} />
                <span>{cameraStatus === 'granted' ? 'Stop Camera Test' : 'Test Camera Stream'}</span>
              </button>
            </div>
          </div>

          {/* Cloud & Browser Capabilities Matrix */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <ShieldCheck size={20} className="text-blue-600" />
                <span>Platform Telemetry & Hardware Matrix</span>
              </h3>
              <button
                onClick={checkBrowserFeatures}
                disabled={checkingDiagnostics}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <RefreshCw size={13} className={checkingDiagnostics ? 'animate-spin' : ''} />
                <span>Re-check Telemetry</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Backend API</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${backendStatus === 'operational' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                  <span className="font-bold text-slate-800 text-sm">FastAPI Engine</span>
                </div>
                <div className="text-[11px] text-slate-500">Status: {backendStatus}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Database</div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-slate-800 text-sm">Neon PostgreSQL</span>
                </div>
                <div className="text-[11px] text-slate-500">Connection Pooling Active</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Speech Recognition</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${speechRecSupported ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                  <span className="font-bold text-slate-800 text-sm">Web Speech API</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {speechRecSupported ? 'Supported natively' : 'Text mode fallback'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="text-xs text-slate-500 font-semibold">Voice AI Audio</div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${speechSynSupported ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="font-bold text-slate-800 text-sm">Speech Synthesis</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {speechSynSupported ? 'Voice dictation ready' : 'Not supported'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: Placement Season Checklist ─────────────────────── */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Campus Placement Readiness Roadmap</h2>
              <p className="text-sm text-slate-500">Complete these critical checkpoints to maximize your campus shortlist rate</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Step 1 */}
              <div className="p-5 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-sm flex items-center justify-center">
                  1
                </div>
                <h3 className="font-bold text-slate-900 text-base">ATS 85+ Resume</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Upload your resume or build one with our AI Resume Builder. Address all detected keyword gaps and export as clean LaTeX-markdown.
                </p>
                <Link
                  to="/app/builder"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:underline pt-1"
                >
                  <span>Build Resume</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Step 2 */}
              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center">
                  2
                </div>
                <h3 className="font-bold text-slate-900 text-base">Tier 1 Eligibility Audit</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Run the Placement Eligibility Engine. Verify that your CGPA meets the cutoffs for Google, Amazon, and Microsoft, and clear any missing skill prerequisites.
                </p>
                <Link
                  to="/app/placement-engine"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:underline pt-1"
                >
                  <span>Check Eligibility</span>
                  <ArrowRight size={13} />
                </Link>
              </div>

              {/* Step 3 */}
              <div className="p-5 rounded-2xl bg-cyan-50/60 border border-cyan-100 space-y-3">
                <div className="w-8 h-8 rounded-xl bg-cyan-600 text-white font-black text-sm flex items-center justify-center">
                  3
                </div>
                <h3 className="font-bold text-slate-900 text-base">Mock Interview Simulation</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Conduct at least 3 practice interviews. Practice technical DSA, system design, and STAR behavioral answers with real-time feedback.
                </p>
                <Link
                  to="/app/interview"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-700 hover:underline pt-1"
                >
                  <span>Start Interview</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </div>

            {/* Quick Feature Directory */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 mb-3">Quick Navigation to Platform Modules:</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Link to="/app/test" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Cpu size={15} className="text-blue-600" />
                  <span>Aptitude Test</span>
                </Link>
                <Link to="/app/flashcards" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <FileText size={15} className="text-indigo-600" />
                  <span>Flashcards Trainer</span>
                </Link>
                <Link to="/app/career-roadmap" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <GraduationCap size={15} className="text-cyan-600" />
                  <span>Career Roadmap</span>
                </Link>
                <Link to="/app/job-tracker" className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
                  <Activity size={15} className="text-emerald-600" />
                  <span>Job Tracker Kanban</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: Submit Support Ticket ──────────────────────────── */}
      {activeTab === 'ticket' && (
        <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <MessageSquare size={22} className="text-blue-600" />
              <span>Submit a Support Inquiry</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Have a question about your placement drive, ATS scoring, or encountered a platform bug? Let us know!
            </p>
          </div>

          {submittedTicketId && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2 animate-fade-in">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Check size={18} className="text-emerald-600" />
                <span>Ticket #{submittedTicketId} Logged Successfully!</span>
              </div>
              <p className="text-xs text-emerald-700 leading-relaxed">
                Our campus placement coordinators and engineering team have received your request. We will follow up via email at <span className="font-semibold">{ticketEmail}</span> within 24 hours.
              </p>
            </div>
          )}

          <form onSubmit={handleTicketSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Full Name</label>
                <input
                  type="text"
                  value={ticketName}
                  onChange={(e) => setTicketName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                <input
                  type="email"
                  required
                  value={ticketEmail}
                  onChange={(e) => setTicketEmail(e.target.value)}
                  placeholder="student@college.edu"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={ticketCategory}
                  onChange={(e) => setTicketCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="placement">Placement Eligibility & Cutoffs</option>
                  <option value="ats_score">Resume & ATS Scoring</option>
                  <option value="interview">Mock Interview / Camera / Mic</option>
                  <option value="bug">Bug Report / Technical Glitch</option>
                  <option value="account">Account & Neon Cloud Sync</option>
                  <option value="feature">Feature Request</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Priority Level</label>
                <select
                  value={ticketPriority}
                  onChange={(e) => setTicketPriority(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="normal">Normal Priority</option>
                  <option value="high">High (Upcoming Placement Drive)</option>
                  <option value="urgent">Urgent (Interview in &lt; 24h)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Subject <span className="text-rose-500">*</span></label>
              <input
                type="text"
                required
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Brief summary of your question or issue"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Detailed Message <span className="text-rose-500">*</span></label>
              <textarea
                required
                rows={4}
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe what you were doing, error messages observed, or the guidance you need..."
                className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={ticketSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {ticketSubmitting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Submitting Ticket...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Ticket</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Help;
