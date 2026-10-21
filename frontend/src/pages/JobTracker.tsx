import React, { useState, useEffect } from 'react';
import { Plus, Loader2, Trash2, ExternalLink, Briefcase, X } from 'lucide-react';
import { getJobTracker, addTrackerJob, updateTrackerJob, deleteTrackerJob } from '../services/api';
import toast from 'react-hot-toast';

type Status = 'saved' | 'applied' | 'interviewing' | 'offer' | 'rejected';

const COLUMNS: { key: Status; label: string; color: string; bgColor: string; border: string }[] = [
  { key: 'saved',        label: '⭐ Saved',        color: 'text-slate-700',   bgColor: 'bg-slate-50',   border: 'border-slate-200' },
  { key: 'applied',      label: '📤 Applied',      color: 'text-blue-700',    bgColor: 'bg-blue-50',    border: 'border-blue-200' },
  { key: 'interviewing', label: '🎤 Interviewing',  color: 'text-purple-700',  bgColor: 'bg-purple-50',  border: 'border-purple-200' },
  { key: 'offer',        label: '🎉 Offer',         color: 'text-emerald-700', bgColor: 'bg-emerald-50', border: 'border-emerald-200' },
  { key: 'rejected',     label: '❌ Rejected',     color: 'text-rose-700',    bgColor: 'bg-rose-50',    border: 'border-rose-200' },
];

interface Job { id: string; title: string; company: string; url?: string; notes?: string; status: Status; created_at: string; }

const AddJobModal: React.FC<{ onClose: () => void; onAdd: (job: any) => void }> = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ title: '', company: '', url: '', notes: '', status: 'saved' as Status });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.company) { toast.error('Title and Company are required'); return; }
    setLoading(true);
    try {
      const res = await addTrackerJob(form);
      onAdd(res.job);
      toast.success('Job added to tracker!');
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to add job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-up">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Add Job to Tracker</h2>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job Title *</label>
            <input className="input-field w-full" placeholder="e.g. Frontend Engineer" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Company *</label>
            <input className="input-field w-full" placeholder="e.g. Google" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Job URL</label>
            <input className="input-field w-full" placeholder="https://..." value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
            <select className="input-field w-full" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as Status })}>
              {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Notes</label>
            <textarea className="input-field w-full resize-none" rows={2} placeholder="Any notes about this application..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Add Job
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const JobCard: React.FC<{ job: Job; onStatusChange: (id: string, status: Status) => void; onDelete: (id: string) => void }> = ({ job, onStatusChange, onDelete }) => (
  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between gap-2 mb-2">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-900 text-sm truncate">{job.title}</p>
        <p className="text-xs text-slate-500 mt-0.5 truncate">{job.company}</p>
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {job.url && (
          <a href={job.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors">
            <ExternalLink size={13} />
          </a>
        )}
        <button onClick={() => onDelete(job.id)} className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
    </div>
    {job.notes && <p className="text-xs text-slate-400 italic mb-3 line-clamp-2">{job.notes}</p>}
    <select
      value={job.status}
      onChange={e => onStatusChange(job.id, e.target.value as Status)}
      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-slate-50 font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/30"
    >
      {COLUMNS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
    </select>
  </div>
);

const JobTracker: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getJobTracker();
        setJobs(res?.jobs || []);
      } catch {
        setJobs([]);
        toast.error('Failed to load tracker');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleStatusChange = async (id: string, status: Status) => {
    setJobs(prev => prev.map(j => j.id === id ? { ...j, status } : j));
    try {
      await updateTrackerJob(id, { status });
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string) => {
    setJobs(prev => prev.filter(j => j.id !== id));
    try {
      await deleteTrackerJob(id);
      toast.success('Job removed');
    } catch {
      toast.error('Failed to delete job');
    }
  };

  const handleAdd = (job: Job) => {
    setJobs(prev => [job, ...prev]);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 size={32} className="animate-spin text-blue-400" />
    </div>
  );

  return (
    <div className="py-8 animate-fade-in">
      {showModal && <AddJobModal onClose={() => setShowModal(false)} onAdd={handleAdd} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
            <Briefcase className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Job Application Tracker</h1>
            <p className="text-slate-500 text-xs sm:text-sm">{jobs.length} job{jobs.length !== 1 ? 's' : ''} being tracked</p>
          </div>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center justify-center gap-2 text-sm w-full sm:w-auto cursor-pointer">
          <Plus size={16} /> Add Job
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6 sm:mb-8">
        {COLUMNS.map(col => {
          const count = jobs.filter(j => j.status === col.key).length;
          return (
            <div key={col.key} className={`glass-card p-3 sm:p-4 text-center border ${col.border}`}>
              <p className={`text-xl sm:text-2xl font-bold ${col.color}`}>{count}</p>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium truncate">{col.label}</p>
            </div>
          );
        })}
      </div>

      {/* Kanban board */}
      {jobs.length === 0 ? (
        <div className="glass-card p-16 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Briefcase className="text-blue-400" size={28} />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">No Jobs Tracked Yet</h2>
          <p className="text-slate-500 mb-6 text-sm">Start adding the jobs you are applying to and track your progress from saved to offer!</p>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 mx-auto">
            <Plus size={16} /> Add Your First Job
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {COLUMNS.map(col => {
            const colJobs = jobs.filter(j => j.status === col.key);
            return (
              <div key={col.key} className={`rounded-2xl border ${col.border} ${col.bgColor} p-4 min-h-[300px]`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-sm font-bold ${col.color}`}>{col.label}</h3>
                  <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center ${col.bgColor} border ${col.border} ${col.color}`}>{colJobs.length}</span>
                </div>
                <div className="space-y-3">
                  {colJobs.map(job => (
                    <JobCard key={job.id} job={job} onStatusChange={handleStatusChange} onDelete={handleDelete} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobTracker;
