// src/components/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Target,
  Briefcase, History, Settings, LogOut, Zap, Bot, Brain, Mic, PenTool, Compass, Link, Layers, Globe, Code, GraduationCap, TrendingUp, ClipboardList, BookOpen, ShieldCheck, Activity
} from 'lucide-react';
import { authService } from '../services/auth';

const linkGroups = [
  {
    title: 'Main Hub',
    links: [
      { to: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/app/builder', icon: PenTool, label: 'AI Resume Builder' },
      { to: '/app/upload', icon: FileText, label: 'Upload Existing Resume' },
    ]
  },
  {
    title: 'Core Analysis',
    links: [
      { to: '/app/analysis', icon: Target, label: 'ATS Score & Results' },
      { to: '/app/placement-engine', icon: GraduationCap, label: 'Placement Engine' },
      { to: '/app/job-match', icon: Briefcase, label: 'Job Match' },
      { to: '/app/gap-analysis', icon: Compass, label: 'Gap Analysis' },
    ]
  },
  {
    title: 'Interview Prep',
    links: [
      { to: '/app/test', icon: Brain, label: 'Aptitude Test' },
      { to: '/app/flashcards', icon: Layers, label: 'Flashcards' },
      { to: '/app/cheat-sheet', icon: BookOpen, label: 'Interview Cheat Sheet' },
      { to: '/app/interview', icon: Mic, label: 'Mock Interview' },
      { to: '/app/chat', icon: Bot, label: 'AI Chat Coach' },
    ]
  },
  {
    title: 'Profiles & Export',
    links: [
      { to: '/app/portfolio', icon: Globe, label: 'Web Portfolio' },
      { to: '/app/linkedin-review', icon: Link, label: 'LinkedIn Review' },
      { to: '/app/github-review', icon: Code, label: 'GitHub Review' },
      { to: '/app/cover-letter', icon: PenTool, label: 'Cover Letter' },
    ]
  },
  {
    title: 'Account',
    links: [
      { to: '/app/career-roadmap', icon: TrendingUp, label: 'Career Roadmap' },
      { to: '/app/job-tracker', icon: ClipboardList, label: 'Job Tracker' },
      { to: '/app/history', icon: History, label: 'History' },
      { to: '/app/settings', icon: Settings, label: 'Settings' },
    ]
  },
  {
    title: 'Placement Admin',
    links: [
      { to: '/app/admin', icon: ShieldCheck, label: 'Manage Companies' },
      { to: '/app/ml-evaluation', icon: Activity, label: 'ML Evaluation' },
    ]
  }
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.clear();
    try {
      await authService.logout();
    } catch {}
    navigate('/');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-slate-200 px-4 py-6 shrink-0 overflow-y-auto">
      {/* Logo */}
      <NavLink to="/" className="flex items-center gap-2 px-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
          <Zap size={16} className="text-white" />
        </div>
        <span className="font-extrabold text-slate-900 text-lg tracking-tight">CareerFit <span className="text-blue-600">AI</span></span>
      </NavLink>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-6">
        {linkGroups.map((group, idx) => (
          <div key={idx}>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">
              {group.title}
            </p>
            <div className="flex flex-col gap-0.5">
              {group.links.map(({ to, icon: Icon, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-blue-50 text-blue-700 shadow-sm' 
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                      {label}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="sidebar-link text-sm mt-4 hover:text-rose-400 hover:bg-rose-500/10"
      >
        <LogOut size={16} />
        Log Out
      </button>
    </aside>
  );
};

export default Sidebar;
