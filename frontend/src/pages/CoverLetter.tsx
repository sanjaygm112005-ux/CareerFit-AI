import React, { useState, useEffect } from 'react';
import { FileText, Copy, Loader2, Sparkles } from 'lucide-react';
import { generateCoverLetter, getAnalysisHistory } from '../services/api';
import toast from 'react-hot-toast';

const CoverLetter: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resumeId, setResumeId] = useState<string | null>(null);

  useEffect(() => {
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
      setResumeId(targetId);
    };
    init();
  }, []);

  const handleGenerate = async () => {
    if (!resumeId) {
      toast.error('Please upload a resume first.');
      return;
    }
    if (!companyName.trim()) {
      toast.error('Please enter a target company name.');
      return;
    }
    if (!jobDescription.trim()) {
      toast.error('Please enter the job description.');
      return;
    }

    setLoading(true);
    setCoverLetter(null);
    try {
      const res = await generateCoverLetter(resumeId, jobDescription, companyName);
      setCoverLetter(res.cover_letter);
      toast.success('Cover letter generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate cover letter.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      toast.success('Copied to clipboard!');
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center">
          <FileText className="text-brand-500" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Cover Letter Generator</h1>
          <p className="text-slate-500">Instantly write a tailored cover letter using your uploaded resume.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Inputs */}
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Target Details</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Company</label>
                <input
                  type="text"
                  placeholder="e.g. Google, Stripe, Local Startup Inc."
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job Description</label>
                <textarea
                  placeholder="Paste the full job description here..."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="input-field min-h-[200px] resize-y"
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !resumeId}
                className="w-full btn-primary flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                Generate Cover Letter
              </button>

              {!resumeId && (
                <p className="text-rose-500 text-sm mt-2">
                  ⚠️ No resume found. Please go to Upload to add your resume first.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Result */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-full min-h-[500px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Generated Letter</h2>
            {coverLetter && (
              <div className="flex gap-2">
                <button onClick={handleCopy} className="btn-ghost !py-1.5 !px-3 flex items-center gap-1.5 text-sm">
                  <Copy size={14} /> Copy
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-6 overflow-y-auto">
            {loading ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                <Loader2 size={32} className="animate-spin text-brand-400" />
                <p className="animate-pulse">Writing your cover letter...</p>
              </div>
            ) : coverLetter ? (
              <div className="whitespace-pre-wrap text-slate-800 leading-relaxed font-serif text-sm">
                {coverLetter}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                <FileText size={48} className="opacity-20 mb-4" />
                <p>Your generated cover letter will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoverLetter;
