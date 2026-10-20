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
import { Loader2 } from 'lucide-react';

// Protected layout with sidebar
const AppLayout: React.FC = () => {
  const { loading } = useAuth();

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 size={32} className="text-brand-400 animate-spin" />
    </div>
  );
  
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 md:px-8 py-6">
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
