import React, { useEffect, useState } from 'react';
import { FileText, Sparkles, CheckCircle2, Award, Briefcase, GraduationCap, Target, Layers } from 'lucide-react';

const FloatingResumeDoc: React.FC = () => {
  const [scanStep, setScanStep] = useState(0);

  // Cycle scan stages to light up detected indicators
  useEffect(() => {
    const interval = setInterval(() => {
      setScanStep((prev) => (prev + 1) % 4);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-sm select-none pointer-events-none transition-transform duration-700 animate-float">
      
      {/* 1. Floating 3D Resume Document Card */}
      <div className="relative bg-white/85 backdrop-blur-xl border border-blue-100/90 rounded-2xl p-6 shadow-2xl shadow-blue-900/5 overflow-hidden">
        
        {/* Soft Animated Vertical Laser Scan Line */}
        <div 
          className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,0.8)] z-20 transition-all duration-1000 ease-in-out"
          style={{
            top: scanStep === 0 ? '18%' : scanStep === 1 ? '42%' : scanStep === 2 ? '68%' : '88%',
          }}
        />

        {/* Document Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
              <FileText size={16} />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">CANDIDATE PROFILE</div>
              <div className="text-sm font-extrabold text-slate-800">Alex Morgan</div>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
            RESUME.PDF
          </span>
        </div>

        {/* Section: Skills */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Layers size={13} className="text-blue-500" /> Core Skills
            </span>
            <span className={`text-[10px] font-semibold flex items-center gap-1 transition-opacity duration-300 ${scanStep >= 0 ? 'text-emerald-600 opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 size={11} /> Skills detected
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {['React', 'TypeScript', 'Node.js', 'Python', 'FastAPI', 'System Design'].map((skill) => (
              <span key={skill} className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-100 text-[10px] font-medium text-slate-600">
                {skill}
              </span>
            ))}
          </div>
        </div>

        {/* Section: Experience */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <Briefcase size={13} className="text-indigo-500" /> Experience
            </span>
            <span className={`text-[10px] font-semibold flex items-center gap-1 transition-opacity duration-300 ${scanStep >= 1 ? 'text-emerald-600 opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 size={11} /> Experience detected
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-slate-100 rounded-full w-4/5" />
            <div className="h-2 bg-slate-100 rounded-full w-11/12" />
          </div>
        </div>

        {/* Section: Education & Projects */}
        <div className="mb-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
            <span className="flex items-center gap-1.5">
              <GraduationCap size={13} className="text-cyan-500" /> Education & Projects
            </span>
            <span className={`text-[10px] font-semibold flex items-center gap-1 transition-opacity duration-300 ${scanStep >= 2 ? 'text-emerald-600 opacity-100' : 'opacity-0'}`}>
              <CheckCircle2 size={11} /> Education detected
            </span>
          </div>
          <div className="space-y-1">
            <div className="h-2 bg-slate-100 rounded-full w-3/4" />
            <div className="h-2 bg-slate-100 rounded-full w-2/3" />
          </div>
        </div>

        {/* Live ATS Scan Footer Pill */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
          <span className="text-slate-500 font-medium flex items-center gap-1">
            <Sparkles size={12} className="text-cyan-500" />
            Keywords matched
          </span>
          <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            98.4% ATS Score
          </span>
        </div>
      </div>

      {/* Floating Mini Tech Tags Around Document */}
      <div className="absolute -top-3 -right-3 bg-white/90 backdrop-blur-md border border-blue-100 rounded-xl px-3 py-1.5 shadow-lg shadow-blue-500/5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <Target size={13} className="text-blue-600" />
        <span>Tier 1 Eligible</span>
      </div>

      <div className="absolute -bottom-3 -left-3 bg-white/90 backdrop-blur-md border border-cyan-100 rounded-xl px-3 py-1.5 shadow-lg shadow-cyan-500/5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
        <Award size={13} className="text-cyan-600" />
        <span>Placement Ready</span>
      </div>
    </div>
  );
};

export default FloatingResumeDoc;
