import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlacementEligibility, getAnalysisHistory } from '../services/api';
import type { PlacementEligibilityResult } from '../services/api';
import { Loader2, GraduationCap, Building2, Rocket, Briefcase, CheckCircle2, AlertTriangle, AlertCircle, Upload, Sparkles } from 'lucide-react';
import ProgressRing from '../components/ProgressRing';

const DEMO_PLACEMENT_DATA: PlacementEligibilityResult = {
  overall_readiness_score: 84,
  tiers: [
    {
      tier: "Tier 1: Product Giants & FAANG",
      match_percentage: 78,
      status: "Competitive Match",
      strong_points: [
        "Strong foundation in data structures & algorithms",
        "Full-stack architecture experience with TypeScript, React, and Python",
        "Demonstrated ability with distributed APIs and cloud deployments"
      ],
      missing_requirements: [
        "Add competitive programming or LeetCode milestone rankings",
        "Demonstrate deep system design metrics (e.g. caching with Redis, load balancers)"
      ]
    },
    {
      tier: "Tier 2: Unicorns & Mid-Tier Tech",
      match_percentage: 92,
      status: "Highly Eligible",
      strong_points: [
        "Proven proficiency with React, Node.js, and modern CSS systems",
        "Quick production-level development velocity",
        "Good understanding of end-to-end testing and CI/CD pipelines"
      ],
      missing_requirements: [
        "Highlight container orchestration (Kubernetes or AWS ECS)"
      ]
    },
    {
      tier: "Tier 3: Service MNCs & IT Consultancies",
      match_percentage: 98,
      status: "Immediate Clearance",
      strong_points: [
        "Exceeds core requirements for technical aptitude and aptitude screenings",
        "Well-structured resume with verified education and projects",
        "Immediate placement readiness for enterprise consulting roles"
      ],
      missing_requirements: []
    }
  ]
};

const TierCard: React.FC<{ 
  tierData: PlacementEligibilityResult['tiers'][0]; 
  icon: React.ReactNode;
  colorScheme: 'emerald' | 'blue' | 'amber';
}> = ({ tierData, icon, colorScheme }) => {
  const colors = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', ring: '#10b981' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', ring: '#3b82f6' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', ring: '#f59e0b' },
  };
  const theme = colors[colorScheme];

  return (
    <div className={`bg-white border ${theme.border} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full`}>
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${theme.bg} flex items-center justify-center`}>
            {icon}
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg">{tierData.tier}</h3>
            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold uppercase mt-1 ${theme.bg} ${theme.text}`}>
              {tierData.status}
            </span>
          </div>
        </div>
        <ProgressRing score={tierData.match_percentage} size={64} strokeWidth={6} color={theme.ring} hideLabel />
      </div>

      <div className="flex-1 space-y-5">
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-500" /> Strong Points
          </h4>
          <ul className="space-y-1.5">
            {tierData.strong_points.map((point, idx) => (
              <li key={idx} className="text-sm text-slate-700 leading-snug">{point}</li>
            ))}
          </ul>
        </div>

        {tierData.missing_requirements.length > 0 && (
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
              <AlertTriangle size={14} className="text-rose-500" /> Missing Requirements
            </h4>
            <ul className="space-y-2">
              {tierData.missing_requirements.map((req, idx) => (
                <li key={idx} className="text-sm text-slate-600 bg-slate-50 border border-slate-100 p-2.5 rounded-lg flex items-start gap-2">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

const PlacementEligibility: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PlacementEligibilityResult | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        let resumeId = localStorage.getItem('current_resume_id');
        if (!resumeId) {
          try {
            const { history } = await getAnalysisHistory();
            if (history && history.length > 0) {
              resumeId = history[0].resume_id;
              localStorage.setItem('current_resume_id', resumeId);
            }
          } catch {
            // ignore
          }
        }

        if (resumeId) {
          const res = await getPlacementEligibility(resumeId);
          setData(res);
          setIsDemo(false);
        } else {
          setData(DEMO_PLACEMENT_DATA);
          setIsDemo(true);
        }
      } catch (err: any) {
        console.warn('Could not fetch custom placement eligibility, using benchmark preview:', err);
        setData(DEMO_PLACEMENT_DATA);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 size={32} className="text-blue-600 animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Evaluating placement readiness across Tier 1, 2, and 3...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <AlertCircle size={48} className="text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-700">Placement Engine</h2>
        <p className="text-slate-500 mt-2 mb-4">Upload a resume to analyze your placement eligibility across tech companies.</p>
        <button onClick={() => navigate('/app/upload')} className="btn-primary">
          Upload Resume
        </button>
      </div>
    );
  }

  const scoreColor = data.overall_readiness_score >= 80 ? 'text-emerald-500' : data.overall_readiness_score >= 50 ? 'text-blue-500' : 'text-amber-500';

  return (
    <div className="max-w-6xl mx-auto py-8 animate-fade-in">
      {/* Demo Banner */}
      {isDemo && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-blue-600 shrink-0" />
            <p className="text-xs text-blue-900 font-medium">
              <strong>Benchmark Preview:</strong> Displaying placement metrics. Upload your resume to evaluate your candidate profile!
            </p>
          </div>
          <button
            onClick={() => navigate('/app/upload')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Upload size={13} /> Upload Resume
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <GraduationCap className="text-white" size={26} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Placement Engine</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">See exactly where you stand for campus recruitment across different company tiers.</p>
          </div>
        </div>
        
        <div className="bg-white px-5 py-3 sm:px-6 sm:py-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between sm:justify-start gap-5">
          <div>
            <p className="text-xs sm:text-sm font-bold text-slate-400 uppercase">Overall Readiness</p>
            <p className={`text-2xl sm:text-3xl font-black ${scoreColor}`}>{data.overall_readiness_score}/100</p>
          </div>
          <ProgressRing score={data.overall_readiness_score} size={58} strokeWidth={6} hideLabel color={data.overall_readiness_score >= 80 ? '#10b981' : data.overall_readiness_score >= 50 ? '#3b82f6' : '#f59e0b'} />
        </div>
      </div>

      {/* Tier Cards Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {data.tiers.map((tier, idx) => {
          let icon = <Briefcase className="text-emerald-600" size={24} />;
          let colorScheme: 'emerald' | 'blue' | 'amber' = 'emerald';
          
          if (tier.tier.toLowerCase().includes('tier 1') || tier.tier.toLowerCase().includes('product')) {
            icon = <Rocket className="text-amber-600" size={24} />;
            colorScheme = 'amber';
          } else if (tier.tier.toLowerCase().includes('tier 2') || tier.tier.toLowerCase().includes('unicorn')) {
            icon = <Building2 className="text-blue-600" size={24} />;
            colorScheme = 'blue';
          }

          return (
            <TierCard 
              key={idx} 
              tierData={tier} 
              icon={icon} 
              colorScheme={colorScheme} 
            />
          );
        })}
      </div>
    </div>
  );
};

export default PlacementEligibility;
