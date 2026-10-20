// src/components/ProgressRing.tsx
import React from 'react';

interface Props {
  score: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  hideLabel?: boolean;
}

function getColor(score: number): string {
  if (score >= 80) return '#34d399';   // emerald
  if (score >= 60) return '#60a5fa';   // blue
  if (score >= 40) return '#fbbf24';   // amber
  return '#fb7185';                     // rose
}

function getGrade(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Needs Work';
  return 'Poor';
}

const ProgressRing: React.FC<Props> = ({
  score,
  size = 140,
  strokeWidth = 10,
  label,
  sublabel,
  color,
  hideLabel = false,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;
  const strokeColor = color || getColor(score);
  const cx = size / 2;
  const cy = size / 2;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" style={{ overflow: 'visible' }}>
          {/* Background track */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              filter: `drop-shadow(0 0 8px ${strokeColor}60)`,
              transition: 'stroke-dashoffset 1.2s ease-in-out',
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-slate-900">{score}</span>
          {!hideLabel && <span className="text-xs text-slate-500 font-medium">/100</span>}
        </div>
      </div>
      {label && !hideLabel && (
        <div className="text-center">
          <div className="text-sm font-semibold text-slate-800">{label}</div>
          {sublabel && <div className="text-xs text-slate-500 mt-0.5">{sublabel || getGrade(score)}</div>}
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
