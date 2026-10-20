import React, { useState, useEffect } from 'react';
// Removed api import
import { Brain, Target, BarChart2, CheckCircle, Zap } from 'lucide-react';

const MLEvaluation: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Direct fetch to backend since api.ts might not have this mapped yet
      const response = await fetch('/api/ml/evaluation');
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || 'Failed to fetch metrics');
      setMetrics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8">Loading ML Metrics...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  if (!metrics) return null;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Brain className="text-brand-600" size={32} />
        <h1 className="text-3xl font-extrabold text-slate-900">Machine Learning Evaluation</h1>
      </div>
      
      <p className="text-slate-600 mb-8 max-w-2xl">
        This page displays the actual real-time evaluation metrics of the Support Vector Machine (SVM) model trained on the synthetic resume dataset to classify career categories.
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Target className="text-blue-500 mb-2" size={24} />
          <div className="text-3xl font-black text-slate-900">{metrics.metrics.accuracy}%</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Accuracy</div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <CheckCircle className="text-emerald-500 mb-2" size={24} />
          <div className="text-3xl font-black text-slate-900">{metrics.metrics.precision}%</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Precision</div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <Zap className="text-amber-500 mb-2" size={24} />
          <div className="text-3xl font-black text-slate-900">{metrics.metrics.recall}%</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">Recall</div>
        </div>
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
          <BarChart2 className="text-violet-500 mb-2" size={24} />
          <div className="text-3xl font-black text-slate-900">{metrics.metrics.f1_score}%</div>
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">F1 Score</div>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900 mb-4">Confusion Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b">
              <tr>
                <th className="p-3 text-xs uppercase tracking-wider">True \ Predicted</th>
                {metrics.confusion_matrix.labels.map((label: string, i: number) => (
                  <th key={i} className="p-3 text-xs">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.confusion_matrix.matrix.map((row: number[], i: number) => (
                <tr key={i} className="border-b last:border-0 hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-700">{metrics.confusion_matrix.labels[i]}</td>
                  {row.map((val: number, j: number) => (
                    <td key={j} className={`p-3 font-mono ${i === j && val > 0 ? 'bg-emerald-50 text-emerald-700 font-bold' : val > 0 ? 'bg-red-50 text-red-600' : 'text-slate-400'}`}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MLEvaluation;
