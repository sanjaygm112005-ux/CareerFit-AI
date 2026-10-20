import React, { useState } from 'react';
import {
  Link as LinkIcon, Loader2, Sparkles, CheckCircle2,
  ClipboardCopy, ChevronDown, ChevronUp, Zap,
  Star, Target, Briefcase, Award, ArrowRight
} from 'lucide-react';
import { reviewLinkedInProfile } from '../services/api';
import type { LinkedInScorecard } from '../services/api';
import toast from 'react-hot-toast';

// ─── Sub-Components ────────────────────────────────────────────────────────────

const GradeRing: React.FC<{ score: number; grade: string }> = ({ score, grade }) => {
  const gradeColor = grade === 'A' ? '#10b981' : grade === 'B' ? '#3b82f6' : grade === 'C' ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  return (
    <div className="relative flex-shrink-0" style={{ width: 140, height: 140 }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" stroke="#e2e8f0" strokeWidth="12" fill="none" />
        <circle
          cx="70" cy="70" r="54"
          stroke={gradeColor} strokeWidth="12" fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 70 70)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-black" style={{ color: gradeColor }}>{grade}</span>
        <span className="text-sm font-bold text-slate-600">{score}/100</span>
      </div>
    </div>
  );
};

const SectionScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => {
  const color = score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-blue-500' : score >= 40 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium text-slate-600">{label}</span>
        <span className="font-bold text-slate-800">{score}/100</span>
      </div>
      <div className="h-2 bg-slate-200/80 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
};

const CopyButton: React.FC<{ text: string }> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <ClipboardCopy size={14} />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
};

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  score: number;
  feedback: string;
  rewritten?: string;
  rewriteLabel?: string;
  extra?: React.ReactNode;
}> = ({ icon, title, score, feedback, rewritten, rewriteLabel = 'AI Rewrite', extra }) => {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = score >= 80 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : score >= 60 ? 'text-blue-600 bg-blue-50 border-blue-200' : score >= 40 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-red-600 bg-red-50 border-red-200';

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
            {icon}
          </div>
          <h3 className="font-bold text-slate-900 text-base">{title}</h3>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-bold border ${scoreColor}`}>{score}/100</span>
      </div>

      <p className="text-sm text-slate-600 leading-relaxed mb-4">{feedback}</p>

      {extra}

      {rewritten && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 text-sm font-semibold text-blue-700 hover:from-blue-100 hover:to-indigo-100 transition-all"
          >
            <span className="flex items-center gap-2"><Sparkles size={14} />{rewriteLabel}</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div className="mt-3 p-4 bg-gradient-to-br from-slate-50 to-blue-50 border border-blue-100 rounded-xl animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">✨ AI Optimized Version</span>
                <CopyButton text={rewritten} />
              </div>
              <p className="text-sm text-slate-800 leading-relaxed font-medium">{rewritten}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const LinkedInReview: React.FC = () => {
  const [profileText, setProfileText] = useState('');
  const [loading, setLoading] = useState(false);
  const [scorecard, setScorecard] = useState<LinkedInScorecard | null>(null);

  const handleReview = async () => {
    if (!profileText.trim() || profileText.trim().length < 50) {
      toast.error('Please paste more profile text (at least 50 characters: headline, about, experience, skills).');
      return;
    }

    setLoading(true);
    try {
      const res = await reviewLinkedInProfile(profileText);
      setScorecard(res.scorecard);
      toast.success('Profile analyzed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
          <LinkIcon className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">LinkedIn Profile Optimizer</h1>
          <p className="text-slate-500 text-sm">Get AI-powered feedback and rewrites to make your profile stand out to recruiters.</p>
        </div>
      </div>

      {!scorecard ? (
        <div className="space-y-5">
          {/* Direct Text Paste Input */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="mb-4">
              <label className="block text-base font-bold text-slate-900 mb-1">
                Paste Your LinkedIn Profile Text
              </label>
              <p className="text-xs text-slate-500">
                Open your LinkedIn profile in a browser → Press <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono">Ctrl+A</kbd> to select all → <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-xs font-mono">Ctrl+C</kbd> to copy → paste below.
              </p>
            </div>

            <textarea
              value={profileText}
              onChange={e => setProfileText(e.target.value)}
              className="input-field min-h-[280px] resize-y w-full font-mono text-sm leading-relaxed p-4 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Paste your LinkedIn profile text here (Headline, About/Summary, Experience bullet points, and Skills)..."
            />

            <div className="flex items-center justify-between mt-3 text-xs text-slate-400">
              <span>Includes Headline, About, Work History &amp; Skills</span>
              <span>{profileText.length} characters</span>
            </div>

            <button
              onClick={handleReview}
              disabled={loading}
              className="btn-primary mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Analyzing Profile...</>
              ) : (
                <><Sparkles size={18} /> Analyze &amp; Optimize Profile</>
              )}
            </button>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '📋', title: 'Paste Profile Text', desc: 'Copy your public text from LinkedIn.' },
              { icon: '🤖', title: 'AI Recruiter Review', desc: 'AI evaluates Headline, About, & Experience.' },
              { icon: '✨', title: 'Copy AI Rewrites', desc: 'Paste recruiter-ready bullets back to LinkedIn.' },
            ].map(item => (
              <div key={item.title} className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-sm">
                <div className="text-2xl mb-2">{item.icon}</div>
                <p className="font-bold text-slate-800 text-sm mb-1">{item.title}</p>
                <p className="text-xs text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {/* Hero Score Card (Light Theme) */}
          <div className="bg-gradient-to-br from-white via-blue-50/40 to-slate-50 border border-blue-100 rounded-2xl p-8 text-slate-900 shadow-xl shadow-blue-500/5">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <GradeRing score={scorecard.overall_score} grade={scorecard.grade} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1 text-slate-900">
                  {scorecard.overall_score >= 80 ? '🌟 Stellar Profile!' : scorecard.overall_score >= 60 ? '✅ Solid, but improvable.' : '⚠️ Optimization Required.'}
                </h2>
                <p className="text-slate-600 text-sm mb-5">Your profile has been analyzed across 4 key sections. Apply the AI rewrites below to boost your recruiter visibility.</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <SectionScoreBar label="Headline" score={scorecard.headline?.score ?? 0} />
                  <SectionScoreBar label="About" score={scorecard.about?.score ?? 0} />
                  <SectionScoreBar label="Experience" score={scorecard.experience?.score ?? 0} />
                  <SectionScoreBar label="Skills" score={scorecard.skills?.score ?? 0} />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Wins */}
          {scorecard.quick_wins?.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 shadow-sm">
              <h3 className="font-bold text-amber-800 mb-4 flex items-center gap-2 text-lg">
                <Zap size={20} className="text-amber-500" /> Quick Wins — Do These First
              </h3>
              <div className="space-y-3">
                {scorecard.quick_wins.map((win, idx) => (
                  <div key={idx} className="flex items-start gap-4 bg-white rounded-xl p-4 border border-amber-100">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white text-sm font-black flex items-center justify-center shrink-0">{win.priority}</div>
                    <div>
                      <p className="font-bold text-slate-800 text-sm flex items-center gap-2">
                        <ArrowRight size={14} className="text-amber-500" />{win.action}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{win.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section Cards */}
          <div className="grid md:grid-cols-2 gap-5">
            <SectionCard
              icon={<Target size={18} className="text-blue-500" />}
              title="Headline"
              score={scorecard.headline?.score ?? 0}
              feedback={scorecard.headline?.feedback ?? ''}
              rewritten={scorecard.headline?.rewritten}
              rewriteLabel="✨ See AI-Optimized Headline"
            />
            <SectionCard
              icon={<Star size={18} className="text-purple-500" />}
              title="About / Summary"
              score={scorecard.about?.score ?? 0}
              feedback={scorecard.about?.feedback ?? ''}
              rewritten={scorecard.about?.rewritten}
              rewriteLabel="✨ See AI-Rewritten About"
            />
            <SectionCard
              icon={<Briefcase size={18} className="text-indigo-500" />}
              title="Experience"
              score={scorecard.experience?.score ?? 0}
              feedback={scorecard.experience?.feedback ?? ''}
              rewritten={scorecard.experience?.rewritten}
              rewriteLabel="✨ See XYZ-Format Rewrite"
            />
            <SectionCard
              icon={<Award size={18} className="text-emerald-500" />}
              title="Skills"
              score={scorecard.skills?.score ?? 0}
              feedback={scorecard.skills?.feedback ?? ''}
              extra={
                scorecard.skills?.missing_keywords?.length > 0 ? (
                  <div className="mb-4">
                    <p className="text-xs font-bold text-red-600 uppercase mb-2">🚨 High-Value Missing Keywords</p>
                    <div className="flex flex-wrap gap-2">
                      {scorecard.skills.missing_keywords.map(kw => (
                        <span key={kw} className="px-2.5 py-1 bg-red-50 border border-red-100 text-red-700 text-xs font-semibold rounded-full">+ {kw}</span>
                      ))}
                    </div>
                  </div>
                ) : undefined
              }
            />
          </div>

          {/* Restart */}
          <button
            onClick={() => { setScorecard(null); setProfileText(''); }}
            className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            ← Analyze a Different Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default LinkedInReview;
