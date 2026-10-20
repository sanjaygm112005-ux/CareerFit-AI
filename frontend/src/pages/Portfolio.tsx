import React, { useState, useEffect } from 'react';
import { Loader2, Globe, Code, Link as LinkIcon, Mail, ExternalLink, Sparkles, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generatePortfolio, getAnalysisHistory } from '../services/api';
import type { PortfolioData } from '../services/api';
import toast from 'react-hot-toast';

const DEMO_PORTFOLIO: PortfolioData = {
  name: "Alex Morgan",
  tagline: "Full-Stack Software Engineer & Distributed Systems Builder",
  about: "Passionate engineer dedicated to building scalable web services, real-time architectures, and intuitive modern interfaces. Experienced in modern TypeScript, React, Python FastAPI, and cloud-native solutions.",
  email: "alex.morgan.dev@gmail.com",
  github: "https://github.com",
  linkedin: "https://linkedin.com",
  skills: ["React", "TypeScript", "Python", "FastAPI", "PostgreSQL", "Docker", "Tailwind CSS", "AWS"],
  projects: [
    {
      title: "AI Resume & Placement Intelligence Platform",
      description: "Full-stack application analyzing candidate resumes, testing placement eligibility across Tier 1-3 tech firms, and providing AI mock interview evaluations.",
      technologies: ["React", "TypeScript", "FastAPI", "Gemini AI", "Tailwind CSS"]
    },
    {
      title: "Cloud Infrastructure Monitor",
      description: "Distributed telemetry system monitoring container health, network latency, and memory footprints in real-time with sub-millisecond alerting.",
      technologies: ["Go", "Docker", "Prometheus", "Grafana", "Redis"]
    }
  ],
  experience: [
    {
      role: "Senior Software Engineer",
      company: "TechCorp Labs",
      duration: "2023 – Present",
      description: "Engineered high-throughput RESTful APIs, optimized database indexes reducing p99 latency by 45%, and mentored junior engineers."
    },
    {
      role: "Full Stack Developer",
      company: "Nexus Innovations",
      duration: "2021 – 2023",
      description: "Architected responsive web applications in React and Node.js serving over 250,000 active monthly users."
    }
  ]
};

const Portfolio: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      try {
        let id = localStorage.getItem('current_resume_id');
        if (!id) {
          try {
            const { history } = await getAnalysisHistory();
            if (history && history.length > 0) {
              id = history[0].resume_id;
              localStorage.setItem('current_resume_id', id);
            }
          } catch {
            // ignore
          }
        }

        if (id) {
          const res = await generatePortfolio(id);
          setPortfolio(res.portfolio);
          setIsDemo(false);
        } else {
          setPortfolio(DEMO_PORTFOLIO);
          setIsDemo(true);
        }
      } catch (err) {
        console.warn('Could not load customized portfolio from API, using demo:', err);
        setPortfolio(DEMO_PORTFOLIO);
        setIsDemo(true);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <Loader2 size={40} className="animate-spin text-indigo-500 mb-4" />
        <p className="text-slate-600 font-medium">Generating your beautiful portfolio website...</p>
      </div>
    );
  }

  if (!portfolio) {
    return (
      <div className="text-center py-24 text-slate-600">
        <Sparkles size={48} className="mx-auto mb-4 text-slate-400" />
        <h2 className="text-xl font-semibold mb-2">Portfolio Generator</h2>
        <p className="mb-6">Upload a resume to automatically generate your personal portfolio website.</p>
        <div className="flex items-center justify-center gap-4">
          <button onClick={() => navigate('/app/upload')} className="btn-primary">
            Upload Resume
          </button>
          <button 
            onClick={() => {
              setPortfolio(DEMO_PORTFOLIO);
              setIsDemo(true);
            }} 
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition-colors"
          >
            View Demo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 animate-fade-in relative">
      {/* Top Banner */}
      <div className="sticky top-0 left-0 w-full bg-slate-900 text-white py-3 px-6 flex justify-between items-center z-20 shadow-md">
        <div className="flex items-center gap-2">
          <Globe size={18} className="text-indigo-400" />
          <span className="font-semibold text-sm">
            {isDemo ? 'Portfolio Preview (Sample Data)' : 'Your AI Generated Portfolio Website'}
          </span>
          {isDemo && (
            <span className="bg-amber-500/20 text-amber-300 text-xs px-2 py-0.5 rounded-full border border-amber-500/30">
              Demo Mode
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isDemo && (
            <button
              onClick={() => navigate('/app/upload')}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Upload size={14} /> Upload Your Resume
            </button>
          )}
          <button
            onClick={() => toast.success('Portfolio link ready to publish!')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <ExternalLink size={16} /> Publish &amp; Share
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto mt-8 bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
        {/* Header / Hero Section */}
        <div className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 px-10 py-20 text-center relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-5xl font-extrabold text-white mb-4 tracking-tight">
              {portfolio.name}
            </h1>
            <p className="text-xl text-indigo-200 max-w-2xl mx-auto font-light leading-relaxed">
              {portfolio.tagline}
            </p>
            <div className="flex justify-center gap-4 mt-8">
              {portfolio.email && (
                <a
                  href={`mailto:${portfolio.email}`}
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors flex items-center justify-center border border-white/10"
                >
                  <Mail size={20} />
                </a>
              )}
              {portfolio.github && (
                <a
                  href={portfolio.github}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors flex items-center justify-center border border-white/10"
                >
                  <Code size={20} />
                </a>
              )}
              {portfolio.linkedin && (
                <a
                  href={portfolio.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-colors flex items-center justify-center border border-white/10"
                >
                  <LinkIcon size={20} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="p-10 space-y-16">
          {/* About Section */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">About Me</h2>
            <p className="text-slate-600 leading-relaxed text-lg">
              {portfolio.about}
            </p>
          </div>

          {/* Skills Section */}
          {portfolio.skills?.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Technical Skills</h2>
              <div className="flex flex-wrap gap-2.5">
                {portfolio.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-indigo-50 border border-indigo-100 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience Section */}
          {portfolio.experience?.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-8 border-b border-slate-100 pb-2">Work Experience</h2>
              <div className="space-y-8 border-l-2 border-indigo-100 ml-4 pl-6">
                {portfolio.experience.map((exp, index) => (
                  <div key={index} className="relative group">
                    <div className="absolute -left-[31px] top-1.5 w-3.5 h-3.5 bg-indigo-500 rounded-full ring-4 ring-white"></div>
                    <h3 className="text-xl font-bold text-slate-800">{exp.role}</h3>
                    <div className="flex gap-2 text-sm text-slate-500 font-medium mb-3">
                      <span>{exp.company}</span>
                      <span>•</span>
                      <span>{exp.duration}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      {exp.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Section */}
          {portfolio.projects?.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-2">Featured Projects</h2>
              <div className="grid md:grid-cols-2 gap-6">
                {portfolio.projects.map((proj, index) => (
                  <div key={index} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{proj.title}</h3>
                    <p className="text-slate-600 text-sm mb-4 leading-relaxed">
                      {proj.description}
                    </p>
                    {proj.technologies?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {proj.technologies.map((t, idx) => (
                          <span key={idx} className="bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1 rounded-md font-medium">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Portfolio;
