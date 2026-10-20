// src/data/demoData.ts
// Static demo analysis data — clearly labelled as sample

import type { ResumeAnalysis } from '../services/api';

export const DEMO_ANALYSIS: ResumeAnalysis = {
  overall_score: 72,
  ats_score: 78,
  content_score: 70,
  skills_score: 65,
  formatting_score: 85,
  grammar_score: 80,
  strengths: [
    { title: 'Clear Section Headings', description: 'Resume uses standard ATS-friendly headings like Experience, Education, and Skills.' },
    { title: 'Contact Information Present', description: 'Email, phone, and LinkedIn are clearly listed at the top.' },
    { title: 'Good Formatting', description: 'Single-column layout is ATS-compatible and easy to scan.' },
    { title: 'Relevant Skill Set', description: 'Core technical skills align with software engineering roles.' },
  ],
  weaknesses: [
    { title: 'Missing Measurable Achievements', description: 'Experience bullet points describe responsibilities, not results.' },
    { title: 'Weak Professional Summary', description: 'Summary is generic and does not highlight key differentiators.' },
    { title: 'Missing Cloud Skills', description: 'No mention of cloud platforms like AWS, GCP, or Azure.' },
    { title: 'Limited Project Detail', description: 'Projects lack technology stack and outcome information.' },
  ],
  ats_analysis: {
    strengths: [
      'Clear section headings detected',
      'Contact information detected',
      'Education section detected',
      'Experience section detected',
      'Skills section detected',
      'Single-column layout — ATS compatible',
    ],
    problems: [
      { issue: 'Missing industry keywords', explanation: 'Keywords like Docker, Kubernetes, and CI/CD are absent, reducing ATS match rate.' },
      { issue: 'Generic professional summary', explanation: 'ATS systems score summaries with role-specific keywords higher.' },
      { issue: 'Weak action verbs in some bullets', explanation: 'Phrases like "worked on" and "helped with" reduce impact and keyword density.' },
    ],
  },
  missing_keywords: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Agile', 'REST API', 'Git', 'Linux'],
  matching_keywords: ['Python', 'JavaScript', 'React', 'SQL', 'FastAPI', 'Node.js', 'PostgreSQL'],
  recommended_keywords: [
    'RESTful API', 'Microservices', 'Unit Testing', 'Version Control', 'Problem Solving',
  ],
  grammar_issues: [
    {
      original: 'Responsible for developing web application.',
      problem: 'Passive and weak phrasing reduces impact.',
      suggestion: 'Developed a responsive React web application serving 500+ daily users.',
      explanation: 'Use active voice with action verbs and add quantifiable results.',
    },
    {
      original: 'Helped the team with backend tasks.',
      problem: '"Helped with" is vague and undersells contributions.',
      suggestion: 'Collaborated on backend API development using FastAPI and PostgreSQL.',
      explanation: 'Be specific about your role and technologies used.',
    },
    {
      original: 'good communication skill',
      problem: 'Should be plural and properly capitalized.',
      suggestion: 'Strong communication skills',
      explanation: 'Consistency in grammar and capitalization matters for professionalism.',
    },
  ],
  suggestions: [
    {
      priority: 'high',
      problem: 'No measurable achievements in experience section.',
      why_it_matters: 'Recruiters and ATS systems favor quantified impact over task descriptions.',
      suggested_improvement: 'Add metrics like "Reduced page load time by 30%" or "Improved test coverage from 40% to 85%".',
    },
    {
      priority: 'high',
      problem: 'Professional summary is too generic.',
      why_it_matters: 'First 6 seconds of review happen in the summary — it must differentiate you.',
      suggested_improvement: 'Write a 3-sentence summary: who you are, what you do best, and your career goal.',
    },
    {
      priority: 'high',
      problem: 'Missing cloud platform experience.',
      why_it_matters: 'Most modern engineering roles require cloud skills (AWS, GCP, or Azure).',
      suggested_improvement: 'If you have hands-on experience, add it with specifics. If not, consider adding a learning project.',
    },
    {
      priority: 'medium',
      problem: 'Projects lack technical depth.',
      why_it_matters: 'Projects are evaluated for technologies, scope, and outcomes.',
      suggested_improvement: 'Include: what the project does, technologies used, your specific role, and any metrics.',
    },
    {
      priority: 'medium',
      problem: 'No certifications listed.',
      why_it_matters: 'Certifications signal commitment to continuous learning.',
      suggested_improvement: 'Add relevant certifications (Google Cloud, AWS, React, etc.) with dates.',
    },
    {
      priority: 'low',
      problem: 'Inconsistent bullet point style.',
      why_it_matters: 'Formatting consistency reflects attention to detail.',
      suggested_improvement: 'Ensure all bullet points start with a past-tense action verb.',
    },
  ],
  skills: [
    { name: 'Python', category: 'programming_language', relevance: 'high' },
    { name: 'JavaScript', category: 'programming_language', relevance: 'high' },
    { name: 'TypeScript', category: 'programming_language', relevance: 'high' },
    { name: 'React', category: 'framework', relevance: 'high' },
    { name: 'FastAPI', category: 'framework', relevance: 'high' },
    { name: 'Node.js', category: 'framework', relevance: 'medium' },
    { name: 'PostgreSQL', category: 'database', relevance: 'high' },
    { name: 'MySQL', category: 'database', relevance: 'medium' },
    { name: 'Git', category: 'tool', relevance: 'high' },
    { name: 'VS Code', category: 'tool', relevance: 'low' },
    { name: 'Teamwork', category: 'soft_skill', relevance: 'medium' },
    { name: 'Communication', category: 'soft_skill', relevance: 'medium' },
  ],
  experience_analysis: [
    {
      original: 'Worked on website development using React.',
      quality: 'weak',
      suggestion: 'Developed a responsive React-based web application with 500+ monthly active users, improving user retention by 20%.',
    },
    {
      original: 'Helped with backend API tasks.',
      quality: 'weak',
      suggestion: 'Built and maintained 12+ RESTful API endpoints using FastAPI, reducing average response time by 35%.',
    },
  ],
  project_analysis: [
    {
      title: 'College ERP System',
      current_description: 'Created a college ERP system.',
      quality: 'weak',
      suggestion: 'Developed a full-stack College ERP system managing 1,200+ student records, attendance tracking, and course management using React, FastAPI, and PostgreSQL.',
    },
    {
      title: 'Portfolio Website',
      current_description: 'Made a personal portfolio website.',
      quality: 'weak',
      suggestion: 'Designed and deployed a responsive personal portfolio website using React and Tailwind CSS, achieving a 95+ Lighthouse performance score.',
    },
  ],
  contact_info_detected: true,
  education_detected: true,
  experience_detected: true,
  skills_section_detected: true,
};
