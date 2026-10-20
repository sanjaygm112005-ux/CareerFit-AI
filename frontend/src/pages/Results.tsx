// src/pages/Results.tsx
// Full analysis dashboard — renders after resume is analyzed
import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import {
  Target, Key, CheckSquare, Briefcase, Building2, ArrowLeft,
  ChevronUp, ChevronDown, Download, Loader2, Info, Sparkles, Video, FileText, Compass, Wand2, Search,
  TrendingUp, XCircle, CheckCircle2, AlertTriangle, ExternalLink
} from 'lucide-react';
import ProgressRing from '../components/ProgressRing';
import ScoreBar from '../components/ScoreBar';
import { getResumeAnalysis, analyzeJobMatch, getCompanyRecommendations, rewriteResume, getLiveJobs, getAnalysisHistory } from '../services/api';
import type { ResumeAnalysis, CompanyRecommendation, LiveJob } from '../services/api';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactMarkdown from 'react-markdown';

type Tab = 'overview' | 'ats' | 'keywords' | 'grammar' | 'suggestions' | 'skills' | 'jobmatch' | 'companies' | 'livejobs';

interface Props {
  demoMode?: boolean;
  demoAnalysis?: ResumeAnalysis;
}

const SKILL_COLORS: Record<string, string> = {
  programming_language: 'chip-info',
  framework: 'chip-success',
  database: 'chip-warning',
  tool: 'bg-slate-800/60 text-slate-700 border-slate-300',
  soft_skill: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  other: 'bg-slate-800/60 text-slate-700 border-slate-300',
};

const Results: React.FC<Props> = ({ demoMode = false, demoAnalysis }) => {
  const location = useLocation();
  const { analysisId } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('overview');
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(
    demoAnalysis || (location.state as { analysis?: ResumeAnalysis })?.analysis || null
  );
  const [resumeId] = useState<string>(
    (location.state as { resumeId?: string })?.resumeId ||
    localStorage.getItem('current_resume_id') ||
    ''
  );
  const [loading, setLoading] = useState(!analysis);
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);
  const [jdText, setJdText] = useState('');
  const [jobMatchResult, setJobMatchResult] = useState<{ match_score: number; matching_items: string[]; missing_items: string[]; recommendations: string[] } | null>(null);
  const [jdLoading, setJdLoading] = useState(false);
  const [companies, setCompanies] = useState<CompanyRecommendation[]>([]);
  const [companiesLoaded, setCompaniesLoaded] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [optimizedMarkdown, setOptimizedMarkdown] = useState<string | null>(null);
  
  const [liveJobs, setLiveJobs] = useState<LiveJob[]>([]);
  const [liveJobsLoaded, setLiveJobsLoaded] = useState(false);
  const [liveJobsLoading, setLiveJobsLoading] = useState(false);

  const [activeResumeId, setActiveResumeId] = useState<string | null>(resumeId);

  useEffect(() => {
    const init = async () => {
      let targetId = analysisId || resumeId || localStorage.getItem('current_resume_id');
      
      if (!targetId && !demoMode) {
        try {
          const { history } = await getAnalysisHistory();
          if (history && history.length > 0) {
            targetId = history[0].resume_id;
            if (targetId) {
              localStorage.setItem('current_resume_id', targetId);
            }
          }
        } catch (e) {
          // ignore
        }
      }

      setActiveResumeId(targetId);

      if (!analysis && targetId) {
        try {
          const r = await getResumeAnalysis(targetId);
          setAnalysis(r.analysis);
        } catch (err) {
          console.warn('Failed to load analysis:', err);
        }
      }
      setLoading(false);
    };
    
    init();
  }, [resumeId, analysis, demoMode]);

  useEffect(() => {
    const path = location.pathname;
    if (path.includes('job-match')) {
      setTab('jobmatch');
    } else if (path.includes('keywords')) {
      setTab('keywords');
    } else if (path.includes('grammar')) {
      setTab('grammar');
    } else if (path.includes('ats')) {
      setTab('ats');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (tab === 'companies' && activeResumeId && !companiesLoaded) {
      loadCompanies();
    } else if (tab === 'livejobs' && activeResumeId && !liveJobsLoaded) {
      loadLiveJobs();
    }
  }, [tab, activeResumeId, companiesLoaded, liveJobsLoaded]);

  const handleJobMatch = async () => {
    if (!jdText.trim() || !activeResumeId) return;
    setJdLoading(true);
    try {
      const res = await analyzeJobMatch(activeResumeId, jdText);
      setJobMatchResult(res.result);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setJdLoading(false);
    }
  };

  const loadCompanies = async () => {
    if (companiesLoaded || !activeResumeId) return;
    try {
      const res = await getCompanyRecommendations(activeResumeId);
      setCompanies(res.recommendations);
      setCompaniesLoaded(true);
    } catch {
      toast.error('Failed to load company recommendations.');
    }
  };

  const loadLiveJobs = async () => {
    if (liveJobsLoaded || !activeResumeId) return;
    setLiveJobsLoading(true);
    try {
      const res = await getLiveJobs(activeResumeId);
      setLiveJobs(res.jobs);
      setLiveJobsLoaded(true);
    } catch {
      toast.error('Failed to load live jobs.');
    } finally {
      setLiveJobsLoading(false);
    }
  };

  const handleRewrite = async () => {
    if (!activeResumeId) return;
    setRewriting(true);
    const loadingToast = toast.loading('AI is rewriting and formatting your resume...');
    try {
      const res = await rewriteResume(activeResumeId);
      setOptimizedMarkdown(res.rewritten_resume);
      
      // Wait for React to render the hidden preview div
      setTimeout(async () => {
        try {
          const el = document.getElementById('optimizer-preview-content');
          if (!el) throw new Error("Preview element not found");
          
          const canvas = await html2canvas(el, { scale: 2, useCORS: true });
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
          pdf.save('Optimized_Resume.pdf');
          toast.success('Optimized resume downloaded as PDF!', { id: loadingToast });
        } catch (e: any) {
          toast.error(e.message || 'Failed to generate PDF', { id: loadingToast });
        } finally {
          setRewriting(false);
          setOptimizedMarkdown(null);
        }
      }, 800);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Failed to rewrite resume.', { id: loadingToast });
      setRewriting(false);
    }
  };

  const handleDownloadReport = () => {
    if (!analysis) return;
    try {
      const doc = new jsPDF();
      let y = 20;
      
      doc.setFontSize(22);
      doc.text('Resume Analysis Report', 20, y);
      y += 10;
      
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, y);
      y += 15;
      
      doc.setTextColor(0);
      doc.setFontSize(16);
      doc.text('Scores Overview', 20, y);
      y += 10;
      
      doc.setFontSize(12);
      doc.text(`Overall Score: ${analysis.overall_score}/100`, 20, y);
      y += 7;
      doc.text(`ATS Score: ${analysis.ats_score}/100`, 20, y);
      y += 7;
      doc.text(`Content Score: ${analysis.content_score}/100`, 20, y);
      y += 7;
      doc.text(`Formatting Score: ${analysis.formatting_score}/100`, 20, y);
      y += 7;
      doc.text(`Grammar Score: ${analysis.grammar_score}/100`, 20, y);
      y += 15;
      
      doc.setFontSize(16);
      doc.text('Key Strengths', 20, y);
      y += 10;
      doc.setFontSize(11);
      analysis.strengths.slice(0, 5).forEach(s => {
        doc.text(`• ${s.title}: ${s.description.substring(0, 80)}...`, 20, y);
        y += 7;
      });
      y += 8;

      doc.setFontSize(16);
      doc.text('Areas for Improvement (Weaknesses)', 20, y);
      y += 10;
      doc.setFontSize(11);
      analysis.weaknesses.slice(0, 5).forEach(w => {
        doc.text(`• ${w.title}: ${w.description.substring(0, 80)}...`, 20, y);
        y += 7;
      });
      y += 8;
      
      // Add new page for suggestions if needed
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      
      doc.setFontSize(16);
      doc.text('Top Suggestions', 20, y);
      y += 10;
      doc.setFontSize(11);
      analysis.suggestions.slice(0, 5).forEach(s => {
        const text = doc.splitTextToSize(`[${s.priority.toUpperCase()}] ${s.problem} -> ${s.suggested_improvement}`, 170);
        doc.text(text, 20, y);
        y += (text.length * 5) + 5;
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
      });
      
      doc.save('resume-analysis-report.pdf');
      toast.success('Report downloaded successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to generate PDF.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="text-brand-400 animate-spin" />
    </div>
  );

  if (!analysis) return (
    <div className="text-center py-24 text-slate-600">
      <XCircle size={48} className="mx-auto mb-4 text-slate-600" />
      <p className="text-lg font-semibold text-slate-700 mb-2">No analysis found</p>
      <button onClick={() => navigate('/app/upload')} className="btn-primary mt-4">Upload Resume</button>
    </div>
  );

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'overview', label: 'Overview', icon: Target },
    { key: 'ats', label: 'ATS', icon: CheckSquare },
    { key: 'keywords', label: 'Keywords', icon: Key },
    { key: 'grammar', label: 'Grammar', icon: CheckSquare },
    { key: 'suggestions', label: 'Suggestions', icon: TrendingUp },
    { key: 'skills', label: 'Skills', icon: Sparkles },
    { key: 'jobmatch', label: 'Job Match', icon: Briefcase },
    { key: 'companies', label: 'Companies', icon: Building2 },
    { key: 'livejobs', label: 'Live Jobs', icon: Search },
  ];

  const priorityColor = (p: string) =>
    p === 'high' ? 'chip-error' : p === 'medium' ? 'chip-warning' : 'chip-info';

  return (
    <div className="max-w-6xl mx-auto py-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="btn-ghost p-2 rounded-xl">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {demoMode && <span className="text-xs tag-skill chip-warning mr-3">DEMO</span>}
              Resume Analysis Results
            </h1>
            <p className="text-slate-600 text-sm">AI-powered insights to help you get hired faster</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!demoMode && (
            <>
              <button 
                onClick={() => {
                  localStorage.removeItem('current_resume_id');
                  localStorage.removeItem('current_analysis_id');
                  navigate('/app/upload');
                }} 
                className="btn-secondary flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
              >
                <FileText size={16} />
                Upload New
              </button>
              <button onClick={() => navigate('/app/interview', { state: { resumeId } })} className="btn-secondary flex items-center gap-2 text-sm">
                <Video size={16} />
                Mock Interview
              </button>
              <button onClick={() => navigate('/app/cover-letter', { state: { resumeId } })} className="btn-secondary flex items-center gap-2 text-sm">
                <FileText size={16} />
                Cover Letter
              </button>
              <button onClick={() => navigate('/app/gap-analysis', { state: { resumeId } })} className="btn-secondary flex items-center gap-2 text-sm">
                <Compass size={16} />
                Gap Analysis
              </button>
            </>
          )}
          <button 
            onClick={handleRewrite} 
            disabled={rewriting || demoMode} 
            className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition-shadow bg-purple-600 hover:bg-purple-700"
          >
            {rewriting ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}
            Auto-Optimize
          </button>
          <button onClick={handleDownloadReport} className="btn-primary flex items-center gap-2 text-sm shadow-sm hover:shadow-md transition-shadow">
            <Download size={16} />
            Download Report
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex overflow-x-auto gap-1 bg-white border border-slate-200 rounded-2xl p-1.5 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => { 
              setTab(t.key); 
              if (t.key === 'companies') loadCompanies(); 
              if (t.key === 'livejobs') loadLiveJobs(); 
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
              tab === t.key
                ? 'bg-brand-500 text-white shadow'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview Tab ─────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Score cards */}
          <div className="glass-card p-8">
            <h2 className="section-header mb-6">Overall Resume Score</h2>
            <div className="flex flex-wrap items-center justify-around gap-8">
              <ProgressRing score={analysis.overall_score} size={160} strokeWidth={12} label="Overall" sublabel={analysis.overall_score >= 80 ? 'Excellent' : analysis.overall_score >= 60 ? 'Good' : 'Needs Work'} />
              <ProgressRing score={analysis.ats_score} size={120} strokeWidth={10} label="ATS Score" />
              <ProgressRing score={analysis.content_score} size={120} strokeWidth={10} label="Content" />
              <ProgressRing score={analysis.skills_score} size={120} strokeWidth={10} label="Skills" />
              <ProgressRing score={analysis.formatting_score} size={120} strokeWidth={10} label="Formatting" />
              <ProgressRing score={analysis.grammar_score} size={120} strokeWidth={10} label="Grammar" />
            </div>
          </div>

          {/* Score bars */}
          <div className="glass-card p-6">
            <h2 className="section-header mb-4">Score Breakdown</h2>
            <div className="flex flex-col gap-4">
              <ScoreBar label="ATS Score" score={analysis.ats_score} />
              <ScoreBar label="Content" score={analysis.content_score} />
              <ScoreBar label="Skills" score={analysis.skills_score} />
              <ScoreBar label="Formatting" score={analysis.formatting_score} />
              <ScoreBar label="Grammar" score={analysis.grammar_score} />
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass-card p-6">
              <h2 className="section-header flex items-center gap-2 mb-4">
                <CheckCircle2 size={18} className="text-emerald-400" /> Strengths
              </h2>
              <div className="space-y-3">
                {analysis.strengths.map(s => (
                  <div key={s.title} className="flex gap-3">
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{s.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="glass-card p-6">
              <h2 className="section-header flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-amber-400" /> Weaknesses
              </h2>
              <div className="space-y-3">
                {analysis.weaknesses.map(w => (
                  <div key={w.title} className="flex gap-3">
                    <AlertTriangle size={16} className="text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{w.title}</p>
                      <p className="text-xs text-slate-600 mt-0.5">{w.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section detection */}
          <div className="glass-card p-6">
            <h2 className="section-header mb-4">Resume Sections Detected</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Contact Info', detected: analysis.contact_info_detected },
                { label: 'Education', detected: analysis.education_detected },
                { label: 'Experience', detected: analysis.experience_detected },
                { label: 'Skills', detected: analysis.skills_section_detected },
              ].map(s => (
                <div key={s.label} className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium ${s.detected ? 'chip-success' : 'chip-error'}`}>
                  {s.detected ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── ATS Tab ──────────────────────────────────────────────────────────── */}
      {tab === 'ats' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-6">
            <div className="flex items-center gap-4 mb-6">
              <ProgressRing score={analysis.ats_score} size={100} strokeWidth={8} />
              <div>
                <h2 className="text-2xl font-bold text-slate-900">ATS Score: {analysis.ats_score}/100</h2>
                <p className="text-slate-600 text-sm">How well your resume passes Applicant Tracking Systems</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={16} /> ATS Strengths
                </h3>
                <div className="space-y-2">
                  {analysis.ats_analysis.strengths.map(s => (
                    <div key={s} className="flex items-center gap-2 text-sm text-slate-700">
                      <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                      {s}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-amber-400 mb-3 flex items-center gap-2">
                  <AlertTriangle size={16} /> ATS Problems
                </h3>
                <div className="space-y-3">
                  {analysis.ats_analysis.problems.map(p => (
                    <div key={p.issue} className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3">
                      <p className="text-sm font-medium text-amber-300 flex items-center gap-2">
                        <AlertTriangle size={13} /> {p.issue}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">{p.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Experience Analysis */}
          {analysis.experience_analysis.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="section-header mb-4">Experience Bullet Analysis</h2>
              <div className="space-y-4">
                {analysis.experience_analysis.map((ea, i) => (
                  <div key={i} className="rounded-xl border border-slate-300 overflow-hidden">
                    <div className="bg-rose-500/5 border-b border-slate-300 p-4">
                      <p className="text-xs text-rose-400 font-semibold uppercase tracking-wide mb-1">Original</p>
                      <p className="text-sm text-slate-700 italic">"{ea.original}"</p>
                    </div>
                    <div className="bg-emerald-500/5 p-4">
                      <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-1">Improved Suggestion</p>
                      <p className="text-sm text-slate-700">"{ea.suggestion}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Project Analysis */}
          {analysis.project_analysis.length > 0 && (
            <div className="glass-card p-6">
              <h2 className="section-header mb-4">Project Description Analysis</h2>
              <div className="space-y-4">
                {analysis.project_analysis.map((pa, i) => (
                  <div key={i} className="rounded-xl border border-slate-300 overflow-hidden">
                    <div className="px-4 pt-3 pb-1">
                      <span className="text-xs font-semibold text-brand-400">{pa.title}</span>
                    </div>
                    <div className="bg-rose-500/5 border-y border-slate-300 px-4 py-3">
                      <p className="text-xs text-rose-400 font-semibold mb-1">Current</p>
                      <p className="text-sm text-slate-700 italic">"{pa.current_description}"</p>
                    </div>
                    <div className="bg-emerald-500/5 px-4 py-3">
                      <p className="text-xs text-emerald-400 font-semibold mb-1">Suggested</p>
                      <p className="text-sm text-slate-700">"{pa.suggestion}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Keywords Tab ─────────────────────────────────────────────────────── */}
      {tab === 'keywords' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="section-header">Keyword Analysis</h2>
              <div className="chip-info tag-skill px-4 py-1.5 text-sm">
                {analysis.matching_keywords.length} / {analysis.matching_keywords.length + analysis.missing_keywords.length} matched
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <CheckCircle2 size={14} /> Matching Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.matching_keywords.map(k => (
                    <span key={k} className="tag-skill chip-success px-3 py-1">{k}</span>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2">
                  <XCircle size={14} /> Missing Keywords
                </h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.missing_keywords.map(k => (
                    <span key={k} className="tag-skill chip-error px-3 py-1">{k}</span>
                  ))}
                </div>
              </div>
            </div>

            {analysis.recommended_keywords.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h3 className="text-sm font-semibold text-brand-400 mb-3">Recommended Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {analysis.recommended_keywords.map(k => (
                    <span key={k} className="tag-skill chip-info px-3 py-1">{k}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-3 flex items-center gap-1.5">
                  <Info size={12} />
                  Only add a keyword if you genuinely have experience with it.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Grammar Tab ──────────────────────────────────────────────────────── */}
      {tab === 'grammar' && (
        <div className="space-y-4 animate-fade-in">
          <div className="glass-card p-6 mb-2">
            <div className="flex items-center gap-4">
              <ProgressRing score={analysis.grammar_score} size={80} strokeWidth={7} />
              <div>
                <h2 className="text-xl font-bold text-slate-900">Grammar Score: {analysis.grammar_score}/100</h2>
                <p className="text-sm text-slate-600">{analysis.grammar_issues.length} issue(s) found</p>
              </div>
            </div>
          </div>

          {analysis.grammar_issues.length === 0 ? (
            <div className="glass-card p-8 text-center">
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-3" />
              <p className="text-slate-800 font-semibold">No grammar issues found!</p>
              <p className="text-slate-600 text-sm mt-1">Your resume language looks clean and professional.</p>
            </div>
          ) : (
            analysis.grammar_issues.map((g, i) => (
              <div key={i} className="glass-card p-5 rounded-2xl">
                <div className="flex flex-col gap-3">
                  <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-3">
                    <p className="text-xs text-rose-400 font-semibold uppercase tracking-wide mb-1">Original</p>
                    <p className="text-sm text-slate-700 italic">"{g.original}"</p>
                  </div>
                  <div className="flex gap-2 items-start text-sm text-slate-600">
                    <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
                    <span><strong className="text-slate-800">Problem:</strong> {g.problem}</span>
                  </div>
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3">
                    <p className="text-xs text-emerald-400 font-semibold uppercase tracking-wide mb-1">Suggestion</p>
                    <p className="text-sm text-slate-700">"{g.suggestion}"</p>
                  </div>
                  <p className="text-xs text-slate-500 flex items-start gap-1.5">
                    <Info size={11} className="mt-0.5 shrink-0" />
                    {g.explanation}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Suggestions Tab ──────────────────────────────────────────────────── */}
      {tab === 'suggestions' && (
        <div className="space-y-4 animate-fade-in">
          {(['high', 'medium', 'low'] as const).map(priority => {
            const items = analysis.suggestions.filter(s => s.priority === priority);
            if (!items.length) return null;
            return (
              <div key={priority} className="glass-card p-6">
                <h2 className={`font-bold text-base mb-4 flex items-center gap-2 capitalize ${
                  priority === 'high' ? 'text-rose-400' : priority === 'medium' ? 'text-amber-400' : 'text-brand-400'
                }`}>
                  <span className={`tag-skill ${priorityColor(priority)} text-xs uppercase`}>{priority} priority</span>
                  {items.length} suggestion{items.length > 1 ? 's' : ''}
                </h2>
                <div className="space-y-3">
                  {items.map((s, i) => {
                    const isOpen = expandedSuggestion === parseInt(`${priority[0]}${i}`);
                    const id = parseInt(`${priority.charCodeAt(0)}${i}`);
                    return (
                      <div
                        key={i}
                        className="border border-slate-300/60 rounded-xl overflow-hidden cursor-pointer"
                        onClick={() => setExpandedSuggestion(isOpen ? null : id)}
                      >
                        <div className="flex items-center justify-between px-4 py-3 hover:bg-slate-800/30">
                          <p className="text-sm font-medium text-slate-800">{s.problem}</p>
                          {isOpen ? <ChevronUp size={16} className="text-slate-500 shrink-0" /> : <ChevronDown size={16} className="text-slate-500 shrink-0" />}
                        </div>
                        {isOpen && (
                          <div className="px-4 pb-4 space-y-3 border-t border-slate-200">
                            <div className="pt-3">
                              <p className="text-xs text-slate-600 font-semibold uppercase tracking-wide mb-1">Why It Matters</p>
                              <p className="text-sm text-slate-700">{s.why_it_matters}</p>
                            </div>
                            <div className="bg-brand-500/5 border border-brand-500/20 rounded-xl p-3">
                              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wide mb-1">Suggested Improvement</p>
                              <p className="text-sm text-slate-700">{s.suggested_improvement}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Skills Tab ───────────────────────────────────────────────────────── */}
      {tab === 'skills' && (
        <div className="space-y-6 animate-fade-in">
          {[
            { cat: 'programming_language', label: '⚡ Programming Languages' },
            { cat: 'framework', label: '🚀 Frameworks & Libraries' },
            { cat: 'database', label: '🗄️ Databases' },
            { cat: 'tool', label: '🔧 Tools & Platforms' },
            { cat: 'soft_skill', label: '🤝 Soft Skills' },
            { cat: 'other', label: '📦 Other' },
          ].map(({ cat, label }) => {
            const skills = analysis.skills.filter(s => s.category === cat);
            if (!skills.length) return null;
            return (
              <div key={cat} className="glass-card p-6">
                <h2 className="font-semibold text-slate-800 mb-4">{label}</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map(s => (
                    <span key={s.name} className={`tag-skill ${SKILL_COLORS[s.category] || 'chip-info'} px-3 py-1.5 flex items-center gap-1.5`}>
                      {s.name}
                      <span className="text-[10px] opacity-60">{s.relevance}</span>
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Job Match Tab ────────────────────────────────────────────────────── */}
      {tab === 'jobmatch' && (
        <div className="space-y-6 animate-fade-in">
          <div className="glass-card p-6">
            <h2 className="section-header mb-2">Job Description Matching</h2>
            <p className="section-sub">Paste a job description to see how well your resume matches.</p>
            <textarea
              id="job-description-input"
              className="input-field min-h-[160px] resize-none mb-4"
              placeholder="Paste the full job description here…"
              value={jdText}
              onChange={e => setJdText(e.target.value)}
            />
            <button
              id="analyze-job-match-btn"
              onClick={handleJobMatch}
              disabled={jdLoading || !jdText.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {jdLoading ? <Loader2 size={16} className="animate-spin" /> : <Briefcase size={16} />}
              {jdLoading ? 'Analyzing…' : 'Analyze Job Match'}
            </button>
          </div>

          {jobMatchResult && (
            <div className="space-y-4 animate-fade-in">
              <div className="glass-card p-6 flex items-center gap-6">
                <ProgressRing score={jobMatchResult.match_score} size={100} strokeWidth={8} label="Match Score" />
                <div>
                  <p className="text-2xl font-bold text-slate-900">{jobMatchResult.match_score}% Match</p>
                  <p className="text-slate-600 text-sm">Based on skills, experience, and keywords</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2"><CheckCircle2 size={14} /> You Match</h3>
                  <ul className="space-y-2">
                    {jobMatchResult.matching_items.map(m => (
                      <li key={m} className="flex items-center gap-2 text-sm text-slate-700">
                        <CheckCircle2 size={12} className="text-emerald-400 shrink-0" /> {m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="glass-card p-5">
                  <h3 className="text-sm font-semibold text-rose-400 mb-3 flex items-center gap-2"><XCircle size={14} /> Missing / Weak Areas</h3>
                  <ul className="space-y-2">
                    {jobMatchResult.missing_items.map(m => (
                      <li key={m} className="flex items-center gap-2 text-sm text-slate-700">
                        <AlertTriangle size={12} className="text-amber-400 shrink-0" /> {m}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {jobMatchResult.recommendations.length > 0 && (
                <div className="glass-card p-5">
                  <h3 className="font-semibold text-brand-400 mb-3">Recommendations</h3>
                  <ul className="space-y-2">
                    {jobMatchResult.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-brand-400 font-bold shrink-0">{i + 1}.</span> {r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Companies Tab ────────────────────────────────────────────────────── */}
      {tab === 'companies' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="section-header">Companies You May Be Eligible For</h2>
              <p className="text-slate-600 text-sm">
                Based on your resume, skills, and experience. These are potential matches, not official eligibility.
              </p>
            </div>
          </div>

          {!companiesLoaded && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-brand-400 animate-spin" />
            </div>
          )}

          {companiesLoaded && companies.length === 0 && (
            <div className="glass-card p-8 text-center text-slate-600">
              <Building2 size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-slate-700">No recommendations yet</p>
              <p className="text-sm mt-1">Try refreshing or improving your resume first.</p>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {companies.map((c, i) => (
              <div key={i} className="glass-card-hover p-5 border border-slate-300/50">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-slate-900">{c.company_name}</h3>
                    <p className="text-sm text-brand-400">{c.role}</p>
                  </div>
                  <div className={`text-lg font-bold ${
                    c.eligibility_percentage >= 80 ? 'text-emerald-400' :
                    c.eligibility_percentage >= 60 ? 'text-brand-400' : 'text-amber-400'
                  }`}>
                    {c.eligibility_percentage}%
                  </div>
                </div>

                <div className="h-1.5 bg-slate-800 rounded-full mb-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500"
                    style={{ width: `${c.eligibility_percentage}%` }}
                  />
                </div>

                <p className="text-xs text-slate-600 mb-3">{c.why_match}</p>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {c.matching_skills.map(s => (
                    <span key={s} className="tag-skill chip-success text-xs">{s}</span>
                  ))}
                </div>

                {c.missing_requirements.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {c.missing_requirements.map(s => (
                      <span key={s} className="tag-skill chip-warning text-xs">⚠ {s}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3 text-xs text-slate-500 pt-3 border-t border-slate-200">
                  <span>📍 {c.location}</span>
                  <span>•</span>
                  <span>💼 {c.work_type}</span>
                  <span>•</span>
                  <span>🎯 {c.experience_required}</span>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-200">
                  <p className="text-[11px] text-slate-500 italic">
                    * Potential match based on resume data. Not an official eligibility assessment.
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Live Jobs Tab ────────────────────────────────────────────────────── */}
      {tab === 'livejobs' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="section-header">Live Job Board Match</h2>
              <p className="text-slate-600 text-sm">
                Real-time open positions matching your skills (Simulated feed).
              </p>
            </div>
          </div>

          {liveJobsLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={24} className="text-brand-400 animate-spin" />
            </div>
          )}

          {liveJobsLoaded && liveJobs.length === 0 && (
            <div className="glass-card p-8 text-center text-slate-600">
              <Search size={40} className="mx-auto mb-3 text-slate-600" />
              <p className="font-semibold text-slate-700">No jobs found right now</p>
            </div>
          )}

          <div className="grid gap-4">
            {liveJobs.map((j, i) => (
              <div key={i} className="glass-card flex flex-col md:flex-row items-center justify-between p-5 border border-slate-300/50">
                <div className="flex-1">
                  <h3 className="font-bold text-lg text-slate-900">{j.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-slate-600 mb-2 mt-1">
                    <span className="font-medium text-brand-600">{j.company}</span>
                    <span>•</span>
                    <span>{j.location}</span>
                    <span>•</span>
                    <span>{j.salary_range}</span>
                  </div>
                  <p className="text-sm text-slate-700">{j.match_reason}</p>
                  <p className="text-xs text-slate-400 mt-2">Posted {j.posted_time}</p>
                </div>
                <div className="mt-4 md:mt-0 md:ml-6 flex-shrink-0">
                  <a
                    href={`https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(j.title + ' ' + j.company)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#0a66c2] hover:bg-[#004182] text-white font-bold text-xs shadow-md shadow-blue-500/10 transition-all hover:-translate-y-0.5"
                  >
                    <span>Apply on LinkedIn</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hidden LaTeX-Style Renderer for PDF Generation */}
      {rewriting && optimizedMarkdown && (
        <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
          <div className="bg-white p-8 flex justify-center w-[800px]">
            <style>{`
              #optimizer-preview-content {
                font-family: 'Times New Roman', Times, serif;
                color: #000;
                width: 100%;
                max-width: 800px;
                padding: 40px;
                background: white;
              }
              #optimizer-preview-content h1 {
                text-align: center;
                font-size: 24pt;
                margin-bottom: 4px;
                font-weight: normal;
              }
              #optimizer-preview-content h1 + p {
                text-align: center;
                margin-top: 0;
                margin-bottom: 16px;
                font-size: 11pt;
              }
              #optimizer-preview-content h2 {
                border-bottom: 1px solid #000;
                font-size: 14pt;
                margin-top: 16px;
                margin-bottom: 8px;
                padding-bottom: 2px;
                font-weight: bold;
              }
              #optimizer-preview-content h3 {
                font-size: 12pt;
                font-weight: bold;
                margin-top: 8px;
                margin-bottom: 4px;
              }
              #optimizer-preview-content p {
                margin-top: 4px;
                margin-bottom: 4px;
                line-height: 1.4;
                font-size: 11pt;
              }
              #optimizer-preview-content ul {
                margin-top: 4px;
                margin-bottom: 8px;
                padding-left: 20px;
                list-style-type: disc;
              }
              #optimizer-preview-content li {
                margin-top: 2px;
                margin-bottom: 2px;
                font-size: 11pt;
                line-height: 1.4;
              }
              #optimizer-preview-content strong {
                font-weight: bold;
              }
            `}</style>
            <div id="optimizer-preview-content">
              <ReactMarkdown>{optimizedMarkdown}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
