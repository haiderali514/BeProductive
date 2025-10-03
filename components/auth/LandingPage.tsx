import React from 'react';

interface LandingPageProps {
  onNavigate: (view: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background-primary text-content-primary">
      <div className="text-center max-w-2xl mx-auto p-4">
        <h1 className="text-5xl font-bold mb-4">
          Welcome to <span className="text-primary">AI Task Manager</span>
        </h1>
        <p className="text-lg text-content-secondary mb-8">
          The modern task management app, supercharged with AI. Organize your life, track your habits, and focus your time like never before.
        </p>
        <div className="flex justify-center gap-4">
          <button
            onClick={() => onNavigate('signup')}
            className="px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors"
          >
            Get Started
          </button>
          <button
            onClick={() => onNavigate('login')}
            className="px-8 py-3 bg-background-tertiary text-content-primary font-semibold rounded-lg hover:bg-border-primary transition-colors"
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
};