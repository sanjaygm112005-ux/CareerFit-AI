// src/components/ScoreBar.tsx
import React from 'react';

interface Props {
  label: string;
  score: number;
  maxScore?: number;
}

function getColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-brand-500';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-rose-500';
}

const ScoreBar: React.FC<Props> = ({ label, score, maxScore = 100 }) => {
  const pct = Math.round((score / maxScore) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="w-32 text-sm text-slate-600 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${getColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-sm font-semibold text-slate-800">{score}</span>
    </div>
  );
};

export default ScoreBar;
