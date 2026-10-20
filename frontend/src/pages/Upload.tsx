// src/pages/Upload.tsx
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Upload as UploadIcon, FileText, X, CheckCircle2,
  AlertCircle, Loader2, ChevronRight, Sparkles
} from 'lucide-react';
import { uploadResume, analyzeResume } from '../services/api';
import toast from 'react-hot-toast';

const STAGES = [
  'Extracting resume content…',
  'Detecting skills and experience…',
  'Checking ATS compatibility…',
  'Analyzing keywords…',
  'Checking grammar and language…',
  'Generating improvement suggestions…',
  'Finding suitable companies…',
  'Finalizing your report…',
];

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);

  const onDrop = useCallback((accepted: File[], rejected: unknown[]) => {
    if ((rejected as File[]).length) {
      toast.error('Invalid file. Please upload a PDF or DOCX file under 20 MB.');
      return;
    }
    setFile(accepted[0]);
    setUploadStatus('idle');
    setResumeId(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus('uploading');
    try {
      const res = await uploadResume(file);
      setResumeId(res.resume_id);
      localStorage.setItem('current_resume_id', res.resume_id);
      setUploadStatus('done');
      toast.success('Resume uploaded successfully!');
    } catch (err: unknown) {
      setUploadStatus('error');
      toast.error((err as Error).message || 'Upload failed. Please try again.');
    }
  };

  const handleAnalyze = async () => {
    if (!resumeId) return;
    setAnalyzing(true);
    setStage(0);

    // Animate through stages
    const interval = setInterval(() => {
      setStage(s => {
        if (s < STAGES.length - 1) return s + 1;
        clearInterval(interval);
        return s;
      });
    }, 1800);

    try {
      const res = await analyzeResume(resumeId);
      clearInterval(interval);
      localStorage.setItem('current_resume_id', resumeId);
      if (res.analysis_id) {
        localStorage.setItem('current_analysis_id', res.analysis_id);
      }
      toast.success('Analysis complete!');
      navigate(`/app/results/${res.analysis_id}`, { state: { analysis: res.analysis, resumeId } });
    } catch (err: unknown) {
      clearInterval(interval);
      setAnalyzing(false);
      toast.error((err as Error).message || 'Analysis failed. Please try again.');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (analyzing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-fade-in">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center animate-pulse-slow">
            <Sparkles size={36} className="text-white" />
          </div>
          <div className="absolute inset-0 rounded-full bg-brand-500/20 animate-ping" />
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">AI is Analyzing Your Resume</h2>
          <p className="text-slate-600 text-sm mb-8">This takes about 30–60 seconds</p>

          <div className="glass-card px-8 py-6 max-w-sm mx-auto">
            <div className="flex items-center gap-3">
              <Loader2 size={18} className="text-brand-400 animate-spin shrink-0" />
              <span className="text-sm text-slate-700 text-left transition-all duration-500">
                {STAGES[stage]}
              </span>
            </div>
            <div className="mt-4 h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full transition-all duration-700"
                style={{ width: `${((stage + 1) / STAGES.length) * 100}%` }}
              />
            </div>
            <div className="text-right text-xs text-slate-500 mt-1">
              {Math.round(((stage + 1) / STAGES.length) * 100)}%
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Upload Your Resume</h1>
        <p className="text-slate-600">Upload your PDF or DOCX file to get started with AI analysis.</p>
      </div>

      {/* Dropzone */}
      {!file && (
        <div
          {...getRootProps()}
          id="resume-dropzone"
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
              : 'border-slate-300 hover:border-brand-500/50 hover:bg-slate-800/30'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200 ${
              isDragActive ? 'bg-brand-500/20' : 'bg-slate-800'
            }`}>
              <UploadIcon size={28} className={isDragActive ? 'text-brand-400' : 'text-slate-600'} />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-800 mb-1">
                {isDragActive ? 'Drop your resume here' : 'Drag & drop your resume'}
              </p>
              <p className="text-sm text-slate-600">or click to browse files</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="px-2 py-0.5 rounded bg-slate-800 font-mono">PDF</span>
              <span className="px-2 py-0.5 rounded bg-slate-800 font-mono">DOCX</span>
              <span>· Max 20 MB</span>
            </div>
          </div>
        </div>
      )}

      {/* File Preview */}
      {file && (
        <div className="glass-card p-6 animate-slide-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-brand-500/20 flex items-center justify-center shrink-0">
              <FileText size={22} className="text-brand-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 truncate">{file.name}</p>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-600">
                <span>{formatSize(file.size)}</span>
                <span>·</span>
                <span>{file.type.includes('pdf') ? 'PDF' : 'DOCX'}</span>
                {uploadStatus === 'done' && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 size={14} />
                      Uploaded
                    </span>
                  </>
                )}
                {uploadStatus === 'error' && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-rose-400">
                      <AlertCircle size={14} />
                      Upload failed
                    </span>
                  </>
                )}
              </div>
            </div>
            <button
              onClick={() => { setFile(null); setUploadStatus('idle'); setResumeId(null); }}
              className="btn-ghost p-2 rounded-lg"
            >
              <X size={16} />
            </button>
          </div>

          {/* Upload progress */}
          {uploadStatus === 'uploading' && (
            <div className="mt-4">
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-brand-500 to-accent-500 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
              <p className="text-xs text-slate-600 mt-1">Uploading…</p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {uploadStatus !== 'done' ? (
              <button
                id="upload-btn"
                onClick={handleUpload}
                disabled={uploadStatus === 'uploading'}
                className="btn-primary flex items-center gap-2"
              >
                {uploadStatus === 'uploading' ? (
                  <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                ) : (
                  <><UploadIcon size={16} /> Upload Resume</>
                )}
              </button>
            ) : (
              <button
                id="analyze-btn"
                onClick={handleAnalyze}
                className="btn-primary flex items-center gap-2"
              >
                <Sparkles size={16} />
                Analyze Resume
                <ChevronRight size={16} />
              </button>
            )}
            <button
              onClick={() => { setFile(null); setUploadStatus('idle'); }}
              className="btn-secondary"
            >
              Change File
            </button>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 glass-card p-6">
        <h3 className="font-semibold text-slate-800 mb-3">Tips for best results</h3>
        <ul className="space-y-2 text-sm text-slate-600">
          {[
            'Use a text-based PDF (not a scanned image)',
            'Include all sections: Contact, Summary, Experience, Education, Skills',
            'Make sure your resume is in English for best AI analysis',
            'Avoid tables and columns for better ATS compatibility',
          ].map(tip => (
            <li key={tip} className="flex items-start gap-2">
              <CheckCircle2 size={14} className="text-emerald-400 mt-0.5 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default UploadPage;
