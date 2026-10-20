import React, { useState } from 'react';
import {
  Loader2, Sparkles, Code, GitCommit, FileText, Zap, ArrowRight, BookOpen
} from 'lucide-react';
import { reviewGithubProfile } from '../services/api';
import type { GithubScorecard } from '../services/api';
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

const SectionCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  score: number;
  feedback: string;
  action: string;
  extra?: React.ReactNode;
}> = ({ icon, title, score, feedback, action, extra }) => {
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

      {action && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-xs font-bold text-slate-400 uppercase mb-2">How to improve</p>
          <p className="text-sm text-slate-800 font-medium">{action}</p>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────

const GithubReview: React.FC = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [scorecard, setScorecard] = useState<GithubScorecard | null>(null);

  const handleReview = async () => {
    if (!username.trim()) {
      toast.error('Please enter a GitHub username.');
      return;
    }

    setLoading(true);
    try {
      const res = await reviewGithubProfile(username);
      setScorecard(res.scorecard);
      toast.success('GitHub Profile analyzed successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze GitHub profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-900 rounded-xl flex items-center justify-center shadow-lg">
          <Code className="text-white" size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">GitHub Roaster</h1>
          <p className="text-slate-500 text-sm">Get AI-powered feedback on your GitHub profile to attract top tech recruiters.</p>
        </div>
      </div>

      {!scorecard ? (
        <div className="space-y-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Your GitHub Username</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">github.com/</span>
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleReview()}
                  placeholder="username"
                  className="input-field w-full pl-[104px]"
                />
              </div>
              <button
                onClick={handleReview}
                disabled={loading}
                className="btn-primary sm:w-auto w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black"
              >
                {loading ? (
                  <><Loader2 size={18} className="animate-spin" /> Fetching...</>
                ) : (
                  <><Sparkles size={18} /> Analyze</>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-3">
              We'll fetch your public profile, bio, and top repositories to evaluate your open-source presence.
            </p>
          </div>

          {/* How it works */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: '🐙', title: 'Enter Username', desc: 'No auth required. Just provide your public handle.' },
              { icon: '🤖', title: 'AI Code Review', desc: 'AI acts as a Hiring Manager reviewing your repos.' },
              { icon: '📈', title: 'Get Hired', desc: 'Actionable tips to make your profile stand out.' },
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
          <div className="bg-gradient-to-br from-white via-indigo-50/40 to-slate-50 border border-indigo-100 rounded-2xl p-8 text-slate-900 shadow-xl shadow-indigo-500/5">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <GradeRing score={scorecard.overall_score} grade={scorecard.grade} />
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-1 text-slate-900">
                  {scorecard.overall_score >= 80 ? '🔥 10x Developer Profile!' : scorecard.overall_score >= 60 ? '👍 Solid open-source presence.' : '⚠️ Needs polish.'}
                </h2>
                <p className="text-slate-600 text-sm mb-5">
                  Your GitHub has been reviewed. See below for how engineering managers perceive your repositories and README.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
                  <SectionScoreBar label="Profile README" score={scorecard.readme?.score ?? 0} />
                  <SectionScoreBar label="Repositories" score={scorecard.repositories?.score ?? 0} />
                  <SectionScoreBar label="Languages/Tech" score={scorecard.languages?.score ?? 0} />
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
              icon={<BookOpen size={18} className="text-blue-500" />}
              title="Profile README"
              score={scorecard.readme?.score ?? 0}
              feedback={scorecard.readme?.feedback ?? ''}
              action={scorecard.readme?.action ?? ''}
              extra={scorecard.readme?.score < 50 && (
                <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                  Tip: Create a repository with your exact username to add a README to your profile.
                </div>
              )}
            />
            <SectionCard
              icon={<GitCommit size={18} className="text-purple-500" />}
              title="Repositories"
              score={scorecard.repositories?.score ?? 0}
              feedback={scorecard.repositories?.feedback ?? ''}
              action={scorecard.repositories?.action ?? ''}
            />
          </div>
          
          <SectionCard
            icon={<FileText size={18} className="text-emerald-500" />}
            title="Languages & Tech Stack"
            score={scorecard.languages?.score ?? 0}
            feedback={scorecard.languages?.feedback ?? ''}
            action=""
            extra={
              scorecard.languages?.missing_skills?.length > 0 ? (
                <div className="mt-4">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-2">Recommended Tech to Explore</p>
                  <div className="flex flex-wrap gap-2">
                    {scorecard.languages.missing_skills.map(kw => (
                      <span key={kw} className="px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-semibold rounded-full">+ {kw}</span>
                    ))}
                  </div>
                </div>
              ) : undefined
            }
          />

          {/* Restart */}
          <button
            onClick={() => { setScorecard(null); setUsername(''); }}
            className="w-full py-3 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all"
          >
            ← Analyze a Different Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default GithubReview;
