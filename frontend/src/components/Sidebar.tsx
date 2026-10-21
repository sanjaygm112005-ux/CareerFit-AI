// src/components/Sidebar.tsx
import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, FileText, Target,
  Briefcase, History, Settings, LogOut, Zap, Bot, Brain, Mic, PenTool, Compass, Link as LinkIcon, Layers, Globe, Code, GraduationCap, TrendingUp, ClipboardList, BookOpen, ShieldCheck, Activity, X
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
      { to: '/app/linkedin-review', icon: LinkIcon, label: 'LinkedIn Review' },
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

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.clear();
    try {
      await authService.logout();
    } catch {}
    if (onClose) onClose();
    navigate('/');
  };

  const renderNavLinks = (isMobile = false) => (
    <nav className="flex-1 flex flex-col gap-6">
      {linkGroups.map((group, idx) => (
        <div key={idx}>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">
            {group.title}
          </p>
          <div className="flex flex-col gap-1">
            {group.links.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={isMobile ? onClose : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    isActive 
                      ? 'bg-blue-50 text-blue-700 shadow-xs border border-blue-100/80 font-bold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                    <span className="truncate">{label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* ── Desktop Persistent Sidebar ───────────────────────────── */}
      <aside className="hidden md:flex flex-col w-64 min-h-screen bg-white border-r border-slate-200 px-4 py-6 shrink-0 sticky top-0 h-screen overflow-y-auto z-20">
        {/* Brand Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 px-2 mb-8 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-extrabold text-slate-900 text-lg tracking-tight">
            CareerFit <span className="text-blue-600">AI</span>
          </span>
        </NavLink>

        {/* Links */}
        {renderNavLinks(false)}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors mt-6 pt-3 border-t border-slate-100 cursor-pointer"
        >
          <LogOut size={16} />
          <span>Log Out</span>
        </button>
      </aside>

      {/* ── Mobile Slide-Over Drawer & Backdrop ──────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 md:hidden animate-fade-in transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl flex flex-col p-5 overflow-y-auto md:hidden transform transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
        }`}
      >
        {/* Mobile Drawer Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <NavLink to="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap size={16} />
            </div>
            <span className="font-extrabold text-slate-900 text-base tracking-tight">
              CareerFit <span className="text-blue-600">AI</span>
            </span>
          </NavLink>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer active:scale-95"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Feature Links (Tapping any closes the drawer) */}
        {renderNavLinks(true)}

        {/* Mobile Drawer Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors mt-6 pt-4 border-t border-slate-100 cursor-pointer"
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
