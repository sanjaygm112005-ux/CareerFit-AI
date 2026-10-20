import React, { useState, useEffect } from 'react';
import { TrendingUp, Loader2, CheckCircle2, BookOpen, Award, Zap, AlertCircle, ChevronRight } from 'lucide-react';
import { getCareerRoadmap, getAnalysisHistory } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const yearColors = {
  year_1: { bg: 'from-blue-500 to-blue-600', light: 'bg-blue-50 border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  year_3: { bg: 'from-purple-500 to-purple-600', light: 'bg-purple-50 border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  year_5: { bg: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
};

const RoadmapCard: React.FC<{ year?: string; label: string; data: any; colors: any }> = ({ label, data, colors }) => (
  <div className={`relative glass-card overflow-hidden`}>
    <div className={`bg-gradient-to-r ${colors.bg} p-5 text-white`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</span>
        <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded-full">{data.salary_range}</span>
      </div>
      <h3 className="text-xl font-bold">{data.title}</h3>
      <p className="text-sm opacity-80 mt-1">{data.focus}</p>
    </div>
    <div className="p-5 space-y-4">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><CheckCircle2 size={11} /> Milestones</p>
        <ul className="space-y-1.5">
          {(data.milestones || []).map((m: string, i: number) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
              <ChevronRight size={14} className={`${colors.text} mt-0.5 flex-shrink-0`} />
              {m}
            </li>
          ))}
        </ul>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><BookOpen size={11} /> Skills to Learn</p>
        <div className="flex flex-wrap gap-1.5">
          {(data.skills_to_learn || []).map((s: string, i: number) => (
            <span key={i} className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${colors.badge}`}>{s}</span>
          ))}
        </div>
      </div>
      {data.certifications?.length > 0 && (
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Award size={11} /> Certifications</p>
          <div className="flex flex-wrap gap-1.5">
            {(data.certifications || []).map((c: string, i: number) => (
              <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 font-medium">{c}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const CareerRoadmap: React.FC = () => {
  const navigate = useNavigate();
  const [resumeId, setResumeId] = useState<string | null>(localStorage.getItem('current_resume_id'));
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(!resumeId);
  const [roadmap, setRoadmap] = useState<any>(null);

  useEffect(() => {
    if (!resumeId) {
      getAnalysisHistory().then(res => {
        if (res.history && res.history.length > 0) {
          const id = res.history[0].resume_id;
          setResumeId(id);
          localStorage.setItem('current_resume_id', id);
        }
      }).catch(() => {}).finally(() => setChecking(false));
    }
  }, [resumeId]);

  const handleGenerate = async () => {
    const activeId = resumeId || localStorage.getItem('current_resume_id');
    if (!activeId) { toast.error('Upload a resume first!'); return; }
    setLoading(true);
    const loadingToast = toast.loading('AI is mapping your career journey...');
    try {
      const res = await getCareerRoadmap(activeId);
      setRoadmap(res.roadmap);
      toast.dismiss(loadingToast);
      toast.success('Career roadmap ready!');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to generate roadmap');
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  if (!resumeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Resume Found</h2>
        <p className="text-slate-500 mb-6">Upload or build a resume first to generate your career roadmap.</p>
        <button onClick={() => navigate('/app/upload')} className="btn-primary">Upload Resume</button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <TrendingUp className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Career Path Advisor</h1>
            <p className="text-slate-500 text-sm">AI-powered 1/3/5-year career roadmap</p>
          </div>
        </div>
        <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2 text-sm bg-emerald-600 hover:bg-emerald-700">
          {loading ? <Loader2 size={16} className="animate-spin" /> : <TrendingUp size={16} />}
          {roadmap ? 'Regenerate' : 'Generate My Roadmap'}
        </button>
      </div>

      {!roadmap && !loading && (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
            <TrendingUp className="text-emerald-400" size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Map Your Future</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            AI analyzes your resume and creates a detailed 1, 3, and 5-year career roadmap — with job titles, skills to learn, certifications to pursue, and expected salary ranges.
          </p>
          <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 mx-auto bg-emerald-600 hover:bg-emerald-700">
            <TrendingUp size={18} /> Generate My Roadmap
          </button>
        </div>
      )}

      {loading && (
        <div className="glass-card p-16 text-center">
          <Loader2 size={48} className="animate-spin text-emerald-400 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold text-lg">Mapping your career trajectory...</p>
          <p className="text-slate-400 text-sm mt-2">Analyzing your skills and experience to plan your future</p>
        </div>
      )}

      {roadmap && (
        <div className="space-y-8 animate-fade-in">
          {/* Profile summary strip */}
          <div className="glass-card p-6">
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <span className="px-3 py-1.5 rounded-full bg-slate-100 border text-sm font-bold text-slate-700">{roadmap.current_level}</span>
              <span className="px-3 py-1.5 rounded-full bg-slate-100 border text-sm font-bold text-slate-700">{roadmap.current_role}</span>
              <span className="px-3 py-1.5 rounded-full bg-slate-100 border text-sm font-bold text-slate-700">{roadmap.industry}</span>
            </div>
            <p className="text-slate-600 leading-relaxed">{roadmap.summary}</p>
          </div>

          {/* Timeline steps visual */}
          <div className="flex items-center gap-0 mb-2">
            {[{ label: 'NOW', color: 'bg-slate-400' }, { label: '1 Year', color: 'bg-blue-500' }, { label: '3 Years', color: 'bg-purple-500' }, { label: '5 Years', color: 'bg-emerald-500' }].map((step, i) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${step.color} ring-4 ring-white shadow`}></div>
                  <span className="text-xs font-bold text-slate-500 mt-1">{step.label}</span>
                </div>
                {i < 3 && <div className="flex-1 h-0.5 bg-gradient-to-r from-slate-300 to-slate-300 mx-1"></div>}
              </React.Fragment>
            ))}
          </div>

          {/* Year cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <RoadmapCard year="year_1" label="Year 1 Goal" data={roadmap.year_1} colors={yearColors.year_1} />
            <RoadmapCard year="year_3" label="Year 3 Goal" data={roadmap.year_3} colors={yearColors.year_3} />
            <RoadmapCard year="year_5" label="Year 5 Goal" data={roadmap.year_5} colors={yearColors.year_5} />
          </div>

          {/* Immediate action items */}
          <div className="glass-card p-6">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Zap size={18} className="text-amber-400" /> Start Today — Immediate Action Items
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              {(roadmap.action_items || []).map((item: string, i: number) => (
                <div key={i} className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="w-7 h-7 rounded-full bg-amber-400 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</div>
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CareerRoadmap;
