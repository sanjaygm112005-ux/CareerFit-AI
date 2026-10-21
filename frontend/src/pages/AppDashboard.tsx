import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Target, Upload, ArrowRight, FileText, Video, Loader2
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import AnalyticsCharts from '../components/AnalyticsCharts';
import { getAnalysisHistory } from '../services/api';
import { Compass } from 'lucide-react';

const AppDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const name = user?.user_metadata?.name || user?.email?.split('@')[0] || 'there';
  
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await getAnalysisHistory();
        setHistory(res.history || []);
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoadingHistory(false);
      }
    };
    fetchHistory();
  }, []);

  const cards = [
    {
      title: 'Upload Resume',
      desc: 'Get instant AI feedback on your resume.',
      icon: Upload,
      color: 'from-brand-500/20 to-brand-600/10 border-brand-500/20',
      iconColor: 'text-brand-400',
      action: () => navigate('/app/upload'),
      cta: 'Start Analysis',
    },
    {
      title: 'Mock Interview',
      desc: 'Practice with our AI hiring manager.',
      icon: Video,
      color: 'from-accent-500/20 to-accent-600/10 border-accent-500/20',
      iconColor: 'text-accent-400',
      action: () => navigate('/app/interview'),
      cta: 'Start Interview',
    },
    {
      title: 'Cover Letter',
      desc: 'Generate a personalized cover letter.',
      icon: FileText,
      color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20',
      iconColor: 'text-emerald-400',
      action: () => navigate('/app/cover-letter'),
      cta: 'Create Letter',
    },
    {
      title: 'Gap Analysis',
      desc: 'Discover skills you are missing for your target role.',
      icon: Compass,
      color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
      iconColor: 'text-blue-400',
      action: () => navigate('/app/gap-analysis'),
      cta: 'Analyze Gap',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto py-3 sm:py-8 animate-fade-in">
      {/* Greeting */}
      <div className="mb-6 sm:mb-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            Welcome back, <span className="text-gradient">{name}</span> 👋
          </h1>
          <p className="text-sm sm:text-base text-slate-600">Here is your career progression overview.</p>
        </div>
        <button onClick={() => navigate('/app/upload')} className="btn-primary py-2.5 sm:py-3 px-5 sm:px-6 flex items-center justify-center gap-2 shadow-lg shadow-brand-500/20 hover:scale-105 transition-transform w-full sm:w-auto cursor-pointer">
          <Upload size={18} />
          <span>New Resume</span>
        </button>
      </div>

      {/* Action cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-8 sm:mb-12">
        {cards.map(c => (
          <div
            key={c.title}
            className={`glass-card-hover p-6 bg-gradient-to-br border cursor-pointer ${c.color}`}
            onClick={c.action}
          >
            <div className={`w-11 h-11 rounded-xl bg-black/20 flex items-center justify-center mb-4 ${c.iconColor}`}>
              <c.icon size={22} />
            </div>
            <h3 className="font-bold text-slate-900 mb-1">{c.title}</h3>
            <p className="text-sm text-slate-600 mb-4">{c.desc}</p>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-brand-400 hover:text-brand-300">
              {c.cta} <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column: Analytics */}
        <div className="lg:col-span-2">
          <AnalyticsCharts />
        </div>

        {/* Right Column: Recent Resumes */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col h-full min-h-[400px]">
          <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-900">Recent Resumes</h3>
            <button onClick={() => navigate('/app/history')} className="text-brand-500 text-sm font-semibold hover:underline">
              View All
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingHistory ? (
              <div className="flex items-center justify-center h-full text-brand-400">
                <Loader2 size={24} className="animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center py-10">
                <FileText size={32} className="mb-2 opacity-50" />
                <p className="text-sm">No resumes uploaded yet.</p>
              </div>
            ) : (
              history.slice(0, 5).map((item, i) => (
                <div 
                  key={i}
                  onClick={() => {
                    localStorage.setItem('current_resume_id', item.resume_id);
                    navigate(`/app/results/${item.analysis?.id || item.resume_id}`, { state: { resumeId: item.resume_id } });
                  }}
                  className="p-4 rounded-xl border border-slate-100 bg-white hover:border-brand-200 hover:shadow-md cursor-pointer transition-all group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-lg bg-brand-50 text-brand-500 flex items-center justify-center shrink-0">
                        <FileText size={16} />
                      </div>
                      <p className="font-semibold text-slate-900 truncate pr-2 text-sm">
                        {item.file_name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-xs text-slate-500 pl-11">
                    <div className="flex items-center gap-1">
                      <Target size={14} className="text-emerald-500" />
                      <span className="font-medium text-slate-700">
                        {item.analysis?.overall_score || 0}/100
                      </span>
                    </div>
                    <span>{new Date(item.uploaded_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppDashboard;
