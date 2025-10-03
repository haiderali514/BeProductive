import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string, pass: string) => boolean;
  onNavigate: (view: 'signup') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onLogin(email, password);
    if (!success) {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-background-primary text-content-primary p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-background-secondary rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-center">Log In</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <p className="text-red-500 text-center text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-content-secondary">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-content-secondary">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full mt-1 px-3 py-2 bg-background-primary border border-border-primary rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary-focus transition-colors"
          >
            Log In
          </button>
        </form>
        <p className="text-sm text-center text-content-secondary">
          Don't have an account?{' '}
          <button onClick={() => onNavigate('signup')} className="font-medium text-primary hover:underline">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};