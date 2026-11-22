import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HelpCircle, X, Bot, Mic, FileQuestion, MessageSquare,
  ArrowRight, Search, ChevronRight, Sparkles
} from 'lucide-react';

export const FloatingHelpWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [quickQuery, setQuickQuery] = useState('');
  const navigate = useNavigate();
  const widgetRef = useRef<HTMLDivElement>(null);

  // Close widget when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickQuery.trim()) return;
    setIsOpen(false);
    navigate(`/app/help?tab=faqs&q=${encodeURIComponent(quickQuery.trim())}`);
    setQuickQuery('');
  };

  const navigateToTab = (tab: string, extraParam?: string) => {
    setIsOpen(false);
    let url = `/app/help?tab=${tab}`;
    if (extraParam) {
      url += `&${extraParam}`;
    }
    navigate(url);
  };

  return (
    <div ref={widgetRef} className="fixed bottom-5 right-5 z-40 select-none">
      {/* ── Expanded Quick Help Popover ────────────────────────────── */}
      {isOpen && (
        <div className="mb-3 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm rounded-3xl bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-2xl p-5 space-y-4 animate-scale-in">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
                <HelpCircle size={18} />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Need Help &amp; Support?</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>24/7 Placement Guide Active</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              aria-label="Close help popover"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={quickQuery}
              onChange={(e) => setQuickQuery(e.target.value)}
              placeholder="Search FAQs, cutoffs, permissions..."
              className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            {quickQuery.trim() && (
              <button
                type="submit"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800 cursor-pointer"
              >
                <ArrowRight size={14} />
              </button>
            )}
          </form>

          {/* Quick Action Shortcuts */}
          <div className="space-y-1.5">
            <button
              onClick={() => navigateToTab('ai_assistant')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-700">Ask AI Support Assistant</div>
                  <div className="text-[10px] text-slate-500">Instant answers for ATS &amp; interviews</div>
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigateToTab('diagnostics')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
                  <Mic size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-cyan-700">Test Microphone &amp; Camera</div>
                  <div className="text-[10px] text-slate-500">Verify audio &amp; video permissions</div>
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-400 group-hover:text-cyan-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigateToTab('faqs')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <FileQuestion size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-indigo-700">Browse FAQs &amp; Cutoffs</div>
                  <div className="text-[10px] text-slate-500">Tier 1/2/3 rules &amp; ATS guidelines</div>
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-400 group-hover:text-indigo-700 group-hover:translate-x-0.5 transition-transform" />
            </button>

            <button
              onClick={() => navigateToTab('ticket')}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/80 transition-colors group cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <MessageSquare size={15} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">Submit Support Ticket</div>
                  <div className="text-[10px] text-slate-500">Contact placement coordinators</div>
                </div>
              </div>
              <ChevronRight size={15} className="text-slate-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Full Help Center Button */}
          <button
            onClick={() => navigateToTab('faqs')}
            className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>Open Full Help Center</span>
            <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── Persistent Floating Help Button ───────────────────────── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xl shadow-blue-600/30 transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-white/20 group"
        aria-label="Toggle Help and Support"
      >
        <div className="relative">
          <HelpCircle size={18} className="transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
        </div>
        <span>Help</span>
        <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 font-extrabold uppercase">
          <Sparkles size={10} />
          <span>24/7</span>
        </span>
      </button>
    </div>
  );
};

export default FloatingHelpWidget;
