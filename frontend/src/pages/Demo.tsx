// src/pages/Demo.tsx
import React from 'react';
import { Sparkles } from 'lucide-react';
import Results from './Results';
import { DEMO_ANALYSIS } from '../data/demoData';

const Demo: React.FC = () => {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-3">
        <Sparkles size={18} className="text-amber-400 shrink-0" />
        <p className="text-sm text-amber-300">
          <strong>Demo Mode</strong> — This is sample data for illustration purposes only.
          Upload your own resume to get a real AI-powered analysis.
        </p>
      </div>
      <Results demoMode={true} demoAnalysis={DEMO_ANALYSIS} />
    </div>
  );
};

export default Demo;
