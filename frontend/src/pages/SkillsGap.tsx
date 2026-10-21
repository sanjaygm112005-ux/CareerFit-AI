import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Compass, Sparkles, Loader2, CheckCircle2, XCircle, BookOpen, ExternalLink } from 'lucide-react';
import { getSkillsGapAnalysis, getAnalysisHistory } from '../services/api';
import toast from 'react-hot-toast';

const SkillsGap: React.FC = () => {
  const location = useLocation();
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>((location.state as any)?.resumeId || null);
  const [analysis, setAnalysis] = useState<any | null>(null);

  useEffect(() => {
    if (resumeId) return;
    const init = async () => {
      let targetId = localStorage.getItem('current_resume_id');
      if (!targetId) {
        try {
          const { history } = await getAnalysisHistory();
          if (history && history.length > 0) {
            targetId = history[0].resume_id;
            localStorage.setItem('current_resume_id', targetId);
          }
        } catch (err) {
          console.error('Failed to fetch history:', err);
        }
      }
      if (targetId) setResumeId(targetId);
    };
    init();
  }, [resumeId]);

  const handleGenerate = async () => {
    if (!resumeId) {
      toast.error('Please upload a resume first.');
      return;
    }
    if (!targetRole.trim()) {
      toast.error('Please enter a target role.');
      return;
    }

    setLoading(true);
    setAnalysis(null);
    try {
      const res = await getSkillsGapAnalysis(resumeId, targetRole);
      setAnalysis(res.analysis);
      toast.success('Skills Gap Analysis complete!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to analyze skills gap.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
          <Compass className="text-brand-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Skills Gap Analysis</h1>
          <p className="text-slate-500">Discover what you need to learn to land your dream role.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm mb-8">
        <label className="block text-sm font-semibold text-slate-700 mb-2">What role are you aiming for?</label>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <input
            type="text"
            placeholder="e.g. Senior Frontend Developer, Data Scientist, Product Manager"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="input-field flex-1 text-base sm:text-lg"
          />
          <button
            onClick={handleGenerate}
            disabled={loading || !resumeId}
            className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 cursor-pointer py-3"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>Analyze Gap</span>
          </button>
        </div>
        {!resumeId && (
          <p className="text-rose-500 text-sm mt-2">
            ⚠️ No resume found. Please go to Upload to add your resume first.
          </p>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border border-slate-200 rounded-2xl">
          <Loader2 size={40} className="animate-spin text-brand-400 mb-4" />
          <p className="text-slate-500">Analyzing your resume against {targetRole || 'the target role'}...</p>
        </div>
      )}

      {analysis && !loading && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* What you have */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-emerald-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="text-emerald-500" />
                Current Relevant Skills
              </h3>
              <ul className="space-y-3">
                {analysis.current_relevant_skills?.map((skill: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-emerald-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                    <span>{skill}</span>
                  </li>
                ))}
                {(!analysis.current_relevant_skills || analysis.current_relevant_skills.length === 0) && (
                  <p className="text-emerald-700/60 italic">No directly relevant skills found for this role.</p>
                )}
              </ul>
            </div>

            {/* What you need */}
            <div className="bg-rose-50 border border-rose-100 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-rose-900 mb-4 flex items-center gap-2">
                <XCircle className="text-rose-500" />
                Missing Skills
              </h3>
              <ul className="space-y-3">
                {analysis.missing_skills?.map((skill: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-rose-800">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span>{skill}</span>
                  </li>
                ))}
                {(!analysis.missing_skills || analysis.missing_skills.length === 0) && (
                  <p className="text-rose-700/60 italic">You have all the core skills needed for this role!</p>
                )}
              </ul>
            </div>
          </div>

          {/* Action Plan */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="text-brand-500" />
              Your Action Plan
            </h3>
            <div className="space-y-4">
              {analysis.action_plan?.map((step: string, idx: number) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </div>
                  <div className="pt-1 text-slate-700 leading-relaxed">
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Courses */}
          {analysis.recommended_courses && analysis.recommended_courses.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <BookOpen className="text-indigo-500" />
                Recommended Courses
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.recommended_courses.map((course: any, idx: number) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
                    <h4 className="font-bold text-slate-900 leading-tight mb-1">{course.title}</h4>
                    <p className="text-xs font-semibold text-indigo-600 mb-3">{course.platform}</p>
                    <p className="text-sm text-slate-600 mb-4 flex-grow">{course.reason}</p>
                    <a 
                      href={course.url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="inline-flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors mt-auto"
                    >
                      <ExternalLink size={14} /> View Course
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsGap;
