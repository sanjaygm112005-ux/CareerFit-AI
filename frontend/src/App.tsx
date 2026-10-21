// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './hooks/useAuth';
import Sidebar from './components/Sidebar';
import Landing from './pages/Landing';
import Upload from './pages/Upload';
import Results from './pages/Results';
import Demo from './pages/Demo';
import History from './pages/History';
import AppDashboard from './pages/AppDashboard';
import Chat from './pages/Chat';
import AptitudeTest from './pages/AptitudeTest';
import Interview from './pages/Interview';
import CoverLetter from './pages/CoverLetter';
import SkillsGap from './pages/SkillsGap';
import LinkedInReview from './pages/LinkedInReview';
import GithubReview from './pages/GithubReview';
import Flashcards from './pages/Flashcards';
import Portfolio from './pages/Portfolio';
import PlacementEligibility from './pages/PlacementEligibility';
import Builder from './pages/Builder';
import CheatSheet from './pages/CheatSheet';
import CareerRoadmap from './pages/CareerRoadmap';
import JobTracker from './pages/JobTracker';
import Admin from './pages/Admin';
import MLEvaluation from './pages/MLEvaluation';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import { Loader2, Menu, Zap } from 'lucide-react';

// Protected layout with sidebar
const AppLayout: React.FC = () => {
  const { loading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="text-brand-400 animate-spin" />
    </div>
  );
  
  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 overflow-x-hidden">
      {/* Mobile Topbar with Left Upper Corner Sidebar Button */}
      <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 -ml-1 text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-all duration-200 active:scale-95 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            aria-label="Open sidebar menu"
          >
            <Menu size={22} className="stroke-[2.5]" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-xs">
              <Zap size={14} />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">
              CareerFit <span className="text-blue-600">AI</span>
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileSidebarOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100/70 border border-blue-200/60 rounded-lg transition-colors cursor-pointer"
        >
          <span>Features</span>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
        </button>
      </header>

      {/* Sidebar with mobile drawer support */}
      <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-full overflow-x-hidden px-3 sm:px-6 md:px-8 py-4 md:py-6">
        <Outlet />
      </main>
    </div>
  );
};

// Public route (redirect to app if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { loading } = useAuth();
  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="text-brand-400 animate-spin" />
    </div>
  );
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#0f172a',
            border: '1px solid rgba(148,163,184,0.3)',
            borderRadius: '12px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#ffffff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#ffffff' } },
        }}
      />
      <Routes>
        {/* Public */}
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

        {/* Protected app layout */}
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AppDashboard />} />
          <Route path="builder" element={<Builder />} />
          <Route path="upload" element={<Upload />} />
          <Route path="results/:analysisId" element={<Results />} />
          <Route path="demo" element={<Demo />} />
          <Route path="history" element={<History />} />
          <Route path="chat" element={<Chat />} />
          <Route path="test" element={<AptitudeTest />} />
          <Route path="interview" element={<Interview />} />
          <Route path="cover-letter" element={<CoverLetter />} />
          <Route path="gap-analysis" element={<SkillsGap />} />
          <Route path="placement-engine" element={<PlacementEligibility />} />
          <Route path="linkedin-review" element={<LinkedInReview />} />
          <Route path="github-review" element={<GithubReview />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="cheat-sheet" element={<CheatSheet />} />
          <Route path="career-roadmap" element={<CareerRoadmap />} />
          <Route path="job-tracker" element={<JobTracker />} />
          <Route path="admin" element={<Admin />} />
          <Route path="ml-evaluation" element={<MLEvaluation />} />
          <Route path="results" element={<Results />} />
          <Route path="analysis" element={<Results />} />
          <Route path="keywords" element={<Results />} />
          <Route path="grammar" element={<Results />} />
          <Route path="job-match" element={<Results />} />
          <Route path="profile" element={<Settings />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
