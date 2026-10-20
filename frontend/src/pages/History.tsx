// src/pages/History.tsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Trash2, Eye, Loader2, Clock } from 'lucide-react';
import { getAnalysisHistory, deleteResume } from '../services/api';
import type { HistoryItem } from '../services/api';
import toast from 'react-hot-toast';

const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    getAnalysisHistory()
      .then(r => { setHistory(r.history); setLoading(false); })
      .catch(() => { toast.error('Failed to load history'); setLoading(false); });
  }, []);

  const handleDelete = async (resumeId: string) => {
    if (!confirm('Delete this resume and all its analysis data?')) return;
    try {
      await deleteResume(resumeId);
      setHistory(h => h.filter(i => i.resume_id !== resumeId));
      toast.success('Deleted.');
    } catch {
      toast.error('Failed to delete.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={28} className="text-brand-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Analysis History</h1>
      <p className="text-slate-600 text-sm mb-6">All your previously analyzed resumes.</p>

      {history.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Clock size={40} className="mx-auto mb-3 text-slate-600" />
          <p className="text-slate-700 font-semibold">No analyses yet</p>
          <p className="text-slate-500 text-sm mt-1">Upload a resume to get started.</p>
          <button onClick={() => navigate('/app/upload')} className="btn-primary mt-5">
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map(item => (
            <div 
              key={item.resume_id} 
              onClick={() => {
                localStorage.setItem('current_resume_id', item.resume_id);
                navigate(`/app/results/${item.analysis?.id || item.resume_id}`, { state: { resumeId: item.resume_id } });
              }}
              className="glass-card-hover p-5 flex items-center gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
                <FileText size={18} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 truncate">{item.file_name}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Uploaded {new Date(item.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              {item.analysis && (
                <div className="hidden md:flex items-center gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-slate-900">{item.analysis.overall_score}</div>
                    <div className="text-xs text-slate-500">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-900">{item.analysis.ats_score}</div>
                    <div className="text-xs text-slate-500">ATS</div>
                  </div>
                  <div className="text-center">
                    <div className="font-bold text-slate-900">{item.analysis.grammar_score}</div>
                    <div className="text-xs text-slate-500">Grammar</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                {item.analysis && (
                  <button
                    onClick={() => navigate(`/app/results/${item.analysis!.id}`, { state: { resumeId: item.resume_id } })}
                    className="btn-ghost p-2 rounded-xl"
                    title="View Analysis"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button
                  onClick={() => handleDelete(item.resume_id)}
                  className="btn-ghost p-2 rounded-xl hover:text-rose-400 hover:bg-rose-500/10"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
