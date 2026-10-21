import React, { useState, useEffect } from 'react';
import {
  Building2, Plus, Database, ShieldCheck, Trash2, Sparkles, RefreshCw, X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  industry: string;
}

interface Requirement {
  id: string;
  company_id: string;
  job_role: string;
  minimum_cgpa: number;
  companies?: { name: string } | null;
  required_skills: string[];
}

export const Admin: React.FC = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [requirements, setRequirements] = useState<Requirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'companies' | 'requirements'>('companies');

  // Company Form state
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState('');
  const [addingCompany, setAddingCompany] = useState(false);

  // Requirement Form state
  const [showReqModal, setShowReqModal] = useState(false);
  const [reqCompanyId, setReqCompanyId] = useState('');
  const [reqRole, setReqRole] = useState('');
  const [reqCgpa, setReqCgpa] = useState('7.5');
  const [reqSkills, setReqSkills] = useState('');
  const [addingReq, setAddingReq] = useState(false);

  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [compRes, reqRes] = await Promise.all([
        fetch('/api/admin/companies'),
        fetch('/api/admin/requirements'),
      ]);
      if (compRes.ok) {
        const compData = await compRes.json();
        setCompanies(compData || []);
      }
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setRequirements(reqData || []);
      }
    } catch (error: any) {
      console.error('Fetch admin data error:', error);
      toast.error('Failed to load companies: ' + (error.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompanyName.trim()) return;
    setAddingCompany(true);
    try {
      const res = await fetch('/api/admin/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName.trim(),
          industry: newCompanyIndustry.trim() || 'Technology'
        })
      });
      if (!res.ok) throw new Error('Failed to create company');
      const data = await res.json();
      toast.success('Company added successfully');
      setNewCompanyName('');
      setNewCompanyIndustry('');
      if (data && data[0]) {
        setCompanies([...companies, data[0]]);
      } else {
        fetchData();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error adding company');
    } finally {
      setAddingCompany(false);
    }
  };

  const handleDeleteCompany = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This will remove associated eligibility criteria.`)) return;
    try {
      const res = await fetch(`/api/admin/companies/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete company');
      setCompanies(companies.filter(c => c.id !== id));
      setRequirements(requirements.filter(r => r.company_id !== id));
      toast.success(`Deleted ${name}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete');
    }
  };

  const handleAddRequirement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqCompanyId || !reqRole.trim()) {
      toast.error('Please select a company and enter a job role');
      return;
    }
    setAddingReq(true);
    try {
      const skillsArray = reqSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await fetch('/api/admin/requirements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: reqCompanyId,
          job_role: reqRole.trim(),
          minimum_cgpa: parseFloat(reqCgpa) || 7.0,
          required_skills: skillsArray
        })
      });

      if (!res.ok) throw new Error('Failed to create requirement');
      toast.success('Eligibility requirement added!');
      setShowReqModal(false);
      setReqRole('');
      setReqSkills('');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add requirement');
    } finally {
      setAddingReq(false);
    }
  };

  const handleDeleteRequirement = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/requirements/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete requirement');
      setRequirements(requirements.filter(r => r.id !== id));
      toast.success('Requirement deleted');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete requirement');
    }
  };

  const handleSeedCompanies = async () => {
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/seed', { method: 'POST' });
      const data = await res.json();
      toast.success(data.message || 'Companies and rules seeded!');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Failed to seed companies');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Placement Cell Admin Portal</h1>
            <p className="text-sm text-slate-500 font-medium">
              Configure registered recruiters, job profiles, and cutoff criteria for students.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSeedCompanies}
            disabled={seeding}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm rounded-xl transition-all border border-indigo-200"
          >
            <Sparkles size={16} />
            {seeding ? 'Seeding...' : 'Seed Sample Companies'}
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
            title="Refresh Data"
          >
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar py-1">
        <button
          onClick={() => setActiveTab('companies')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'companies'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 size={16} />
          Registered Companies ({companies.length})
        </button>
        <button
          onClick={() => setActiveTab('requirements')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 whitespace-nowrap cursor-pointer ${
            activeTab === 'requirements'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Database size={16} />
          Eligibility Criteria ({requirements.length})
        </button>
      </div>

      {/* TAB 1: COMPANIES */}
      {activeTab === 'companies' && (
        <div className="space-y-6">
          {/* Add Company Form */}
          <form onSubmit={handleAddCompany} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Plus size={16} className="text-blue-600" />
              Register New Recruiter / Firm
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  placeholder="e.g. Cisco Systems"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Industry / Domain
                </label>
                <input
                  type="text"
                  value={newCompanyIndustry}
                  onChange={e => setNewCompanyIndustry(e.target.value)}
                  placeholder="e.g. Networking & Cloud"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={addingCompany || !newCompanyName.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  <Plus size={16} />
                  {addingCompany ? 'Adding...' : 'Add Recruiter'}
                </button>
              </div>
            </div>
          </form>

          {/* Companies Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {companies.map(c => (
              <div
                key={c.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition-all shadow-sm flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 font-black text-sm">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">{c.industry || 'General Tech'}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteCompany(c.id, c.name)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Delete Company"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}

            {companies.length === 0 && !loading && (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 text-base">No registered companies yet</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Click "Seed Sample Companies" above to load Tier-1 recruiters.</p>
                <button
                  onClick={handleSeedCompanies}
                  className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-sm"
                >
                  Seed Demo Companies
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ELIGIBILITY REQUIREMENTS */}
      {activeTab === 'requirements' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">Configured Role Requirements</h2>
            <button
              onClick={() => {
                if (companies.length === 0) {
                  toast.error('Please add or seed a company first!');
                  return;
                }
                setReqCompanyId(companies[0]?.id || '');
                setShowReqModal(true);
              }}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
            >
              <Plus size={16} />
              Add Requirement
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {requirements.map(req => {
              const compName = req.companies?.name || companies.find(c => c.id === req.company_id)?.name || 'Recruiter';
              return (
                <div
                  key={req.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <span className="text-xs font-black text-blue-600 uppercase tracking-wider">{compName}</span>
                        <h3 className="text-base font-bold text-slate-900">{req.job_role}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg text-xs font-bold">
                          Min CGPA: {req.minimum_cgpa}
                        </span>
                        <button
                          onClick={() => handleDeleteRequirement(req.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5 mt-3">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Required Skills:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {req.required_skills && req.required_skills.length > 0 ? (
                          req.required_skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-semibold text-xs rounded-md border border-slate-200"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">No specific skills listed</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {requirements.length === 0 && !loading && (
              <div className="col-span-full p-12 text-center bg-white rounded-2xl border border-slate-200">
                <Database size={40} className="mx-auto text-slate-300 mb-3" />
                <p className="font-bold text-slate-700 text-base">No requirements configured</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Click "Seed Sample Companies" or "Add Requirement" to set cutoff thresholds.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD REQUIREMENT */}
      {showReqModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-blue-600" />
                New Eligibility Cutoff
              </h3>
              <button
                onClick={() => setShowReqModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddRequirement} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Select Recruiter *
                </label>
                <select
                  required
                  value={reqCompanyId}
                  onChange={e => setReqCompanyId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.industry || 'General'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Job Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={reqRole}
                  onChange={e => setReqRole(e.target.value)}
                  placeholder="e.g. Associate Cloud Engineer"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Minimum Cutoff CGPA (0 - 10) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="10"
                  required
                  value={reqCgpa}
                  onChange={e => setReqCgpa(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-1 block">
                  Required Skills (Comma separated)
                </label>
                <input
                  type="text"
                  value={reqSkills}
                  onChange={e => setReqSkills(e.target.value)}
                  placeholder="e.g. Python, Docker, React, SQL"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingReq}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50"
                >
                  {addingReq ? 'Saving...' : 'Save Requirement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;
