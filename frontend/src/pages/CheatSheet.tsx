import React, { useState, useRef, useEffect } from 'react';
import { FileText, Loader2, Download, ChevronDown, ChevronUp, Lightbulb, Code, Users, Briefcase, Star, BookOpen, AlertCircle } from 'lucide-react';
import { getCheatSheet, getAnalysisHistory } from '../services/api';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useNavigate } from 'react-router-dom';

const typeConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  technical:   { label: 'Technical',   color: 'bg-blue-50 border-blue-200 text-blue-700',   icon: Code },
  behavioural: { label: 'Behavioural', color: 'bg-purple-50 border-purple-200 text-purple-700', icon: Users },
  project:     { label: 'Project',     color: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: Briefcase },
  situational: { label: 'Situational', color: 'bg-amber-50 border-amber-200 text-amber-700', icon: Star },
  intro:       { label: 'Introduction', color: 'bg-rose-50 border-rose-200 text-rose-700',  icon: BookOpen },
};

const CheatSheet: React.FC = () => {
  const navigate = useNavigate();
  const [resumeId, setResumeId] = useState<string | null>(localStorage.getItem('current_resume_id'));
  const [loading, setLoading] = useState(false);
  const [cheatSheet, setCheatSheet] = useState<any>(null);
  const [expanded, setExpanded] = useState<number | null>(0);
  const [downloading, setDownloading] = useState(false);
  const pdfRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resumeId) {
      getAnalysisHistory().then(res => {
        if (res.history && res.history.length > 0) {
          const id = res.history[0].resume_id;
          setResumeId(id);
          localStorage.setItem('current_resume_id', id);
        }
      }).catch(() => {});
    }
  }, [resumeId]);

  const handleGenerate = async () => {
    const activeId = resumeId || localStorage.getItem('current_resume_id');
    if (!activeId) { toast.error('Upload a resume first!'); return; }
    setLoading(true);
    const loadingToast = toast.loading('AI is crafting your personalized cheat sheet...');
    try {
      const res = await getCheatSheet(activeId);
      setCheatSheet(res.cheat_sheet);
      setExpanded(0);
      toast.dismiss(loadingToast);
      toast.success('Cheat sheet ready!');
    } catch (err: any) {
      toast.dismiss(loadingToast);
      toast.error(err.message || 'Failed to generate cheat sheet');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!pdfRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(pdfRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = pdfHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
      while (heightLeft > 0) {
        position -= pdf.internal.pageSize.getHeight();
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pdf.internal.pageSize.getHeight();
      }
      pdf.save('Interview_Cheat_Sheet.pdf');
      toast.success('PDF downloaded!');
    } catch (err) {
      toast.error('Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  if (!resumeId) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle size={48} className="text-amber-400 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Resume Found</h2>
        <p className="text-slate-500 mb-6">Upload or build a resume first to generate your cheat sheet.</p>
        <button onClick={() => navigate('/app/upload')} className="btn-primary">Upload Resume</button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <FileText className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Interview Cheat Sheet</h1>
            <p className="text-slate-500 text-sm">AI-generated Q&A tailored to your resume</p>
          </div>
        </div>
        <div className="flex gap-3">
          {cheatSheet && (
            <button onClick={handleDownload} disabled={downloading} className="btn-secondary flex items-center gap-2 text-sm">
              {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              Download PDF
            </button>
          )}
          <button onClick={handleGenerate} disabled={loading} className="btn-primary flex items-center gap-2 text-sm">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
            {cheatSheet ? 'Regenerate' : 'Generate Cheat Sheet'}
          </button>
        </div>
      </div>

      {!cheatSheet && !loading && (
        <div className="glass-card p-16 text-center">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mx-auto mb-6">
            <FileText className="text-indigo-400" size={36} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-3">Your Personalized Interview Prep</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            AI will read your resume and generate 12 highly personalized interview questions with detailed model answers — tailored to your exact skills, projects, and experience.
          </p>
          <button onClick={handleGenerate} className="btn-primary flex items-center gap-2 mx-auto">
            <FileText size={18} />
            Generate My Cheat Sheet
          </button>
        </div>
      )}

      {loading && (
        <div className="glass-card p-16 text-center">
          <Loader2 size={48} className="animate-spin text-indigo-400 mx-auto mb-4" />
          <p className="text-slate-700 font-semibold text-lg">AI is building your cheat sheet...</p>
          <p className="text-slate-400 text-sm mt-2">Analyzing your resume and crafting personalized answers</p>
        </div>
      )}

      {cheatSheet && (
        <>
          {/* Key strengths strip */}
          <div className="glass-card p-5 mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm font-bold text-slate-700">Key Strengths:</span>
            {(cheatSheet.key_strengths || []).map((s: string, i: number) => (
              <span key={i} className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-sm font-semibold">{s}</span>
            ))}
          </div>

          {/* Q&A Cards — on-screen interactive */}
          <div className="space-y-4 mb-8">
            {(cheatSheet.questions || []).map((q: any, i: number) => {
              const cfg = typeConfig[q.type] || typeConfig.technical;
              const Icon = cfg.icon;
              const isOpen = expanded === i;
              return (
                <div key={i} className={`glass-card overflow-hidden border transition-all ${isOpen ? 'shadow-md' : ''}`}>
                  <button
                    className="w-full flex items-center gap-4 p-5 text-left hover:bg-slate-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : i)}
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                      {i + 1}
                    </div>
                    <span className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border flex-shrink-0 ${cfg.color}`}>
                      <Icon size={11} /> {cfg.label}
                    </span>
                    <p className="flex-1 text-sm font-semibold text-slate-800 text-left">{q.question}</p>
                    {isOpen ? <ChevronUp size={18} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={18} className="text-slate-400 flex-shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-slate-100">
                      <div className="mt-4">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Model Answer</p>
                        <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 rounded-xl p-4 border border-slate-100">{q.ideal_answer}</p>
                      </div>
                      {q.tip && (
                        <div className="flex items-start gap-2 mt-3 text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
                          <Lightbulb size={14} className="mt-0.5 flex-shrink-0" />
                          <p className="text-xs font-medium">{q.tip}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Hidden PDF render */}
          <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div ref={pdfRef} style={{ width: '794px', background: '#fff', padding: '48px', fontFamily: 'Arial, sans-serif', color: '#1e293b' }}>
              <div style={{ borderBottom: '3px solid #6366f1', paddingBottom: '16px', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#4338ca', margin: 0 }}>Interview Cheat Sheet</h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>{cheatSheet.candidate_name} · {cheatSheet.target_role}</p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                  {(cheatSheet.key_strengths || []).map((s: string, i: number) => (
                    <span key={i} style={{ background: '#ede9fe', color: '#6d28d9', padding: '2px 10px', borderRadius: '99px', fontSize: '11px', fontWeight: 'bold' }}>{s}</span>
                  ))}
                </div>
              </div>
              {(cheatSheet.questions || []).map((q: any, i: number) => (
                <div key={i} style={{ marginBottom: '20px', borderLeft: '4px solid #6366f1', paddingLeft: '16px' }}>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 4px' }}>{i + 1}. {q.type?.toUpperCase()}</p>
                  <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#1e293b', margin: '0 0 8px' }}>{q.question}</p>
                  <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.6', background: '#f8fafc', padding: '10px', borderRadius: '6px', margin: '0 0 6px' }}>{q.ideal_answer}</p>
                  {q.tip && <p style={{ fontSize: '11px', color: '#b45309', background: '#fef3c7', padding: '6px 10px', borderRadius: '4px', margin: 0 }}>💡 {q.tip}</p>}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CheatSheet;
