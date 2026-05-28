'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sun, Moon, Layout } from 'lucide-react';

export default function AuthPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  
  // Safe layout mounting flags to prevent Next.js hydration crashes
  const [mounted, setMounted] = useState<boolean>(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const cleanBaseUrl = BACKEND_URL.replace(/\/$/, '');

  // 1. Direct DOM theme alignment on initial loading cycle
  useEffect(() => {
    setMounted(true);
    const savedTheme = (localStorage.getItem('theme') as 'light' | 'dark') || 'dark';
    setCurrentTheme(savedTheme);
    
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  // Explicit Toggle Trigger Handler
  const toggleTheme = () => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // ================= VALIDATIONS =================

  // Name validation (Register only)
  if (!isLogin) {
    if (!formData.name.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (formData.name.trim().length < 3) {
      setError('Full name must be at least 3 characters');
      setLoading(false);
      return;
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!formData.email.trim()) {
    setError('Email is required');
    setLoading(false);
    return;
  }

  if (!emailRegex.test(formData.email)) {
    setError('Please enter a valid email address');
    setLoading(false);
    return;
  }

  // Password validation
  if (!formData.password) {
    setError('Password is required');
    setLoading(false);
    return;
  }

  if (formData.password.length < 6) {
    setError('Password must be at least 6 characters');
    setLoading(false);
    return;
  }

  if (!/(?=.*[A-Z])/.test(formData.password)) {
    setError('Password must contain at least one uppercase letter');
    setLoading(false);
    return;
  }

  if (!/(?=.*[0-9])/.test(formData.password)) {
    setError('Password must contain at least one number');
    setLoading(false);
    return;
  }

  const endpoint = isLogin ? '/auth/login' : '/auth/register';
    const payload = isLogin 
      ? { email: formData.email, password: formData.password }
      : formData;

    try {
      const cleanUrl = `${cleanBaseUrl}/${endpoint.replace(/^\//, '')}`;

      const res = await fetch(cleanUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      router.push('/dashboard'); 
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Prevent UI compilation before safety layout checks finish mounting natively
  if (!mounted) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0b0f19] transition-colors duration-300 p-6 selection:bg-indigo-500 selection:text-white">
      {/* 🌟 ROBUST THEME TOGGLE BUTTON */}
      <button 
        type="button"
        onClick={toggleTheme}
        className="fixed top-6 right-6 p-3 rounded-full bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-800 hover:scale-110 transition-transform z-50"
      >
        {currentTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-600" />}
      </button>

      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl shadow-2xl backdrop-blur-md">
        <div className="flex flex-col items-center mb-6">
          <div className="p-3 bg-indigo-600 rounded-xl mb-3 shadow-lg shadow-indigo-600/20">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs text-center mt-1">
            {isLogin ? 'Sign in to access your collaborative boards' : 'Get started with your team workspace today'}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Full Name</label>
              <input
                type="text"
                name="name"
                required
                className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Email Address</label>
            <input
              type="email"
              name="email"
              required
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl px-4 py-3 text-sm focus:border-indigo-500 outline-none transition-all"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleInputChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 text-white font-semibold rounded-xl py-3 text-sm transition-colors shadow-lg shadow-indigo-600/20 mt-2"
          >
            {loading ? 'Authenticating...' : isLogin ? 'Sign In' : 'Register'}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/60 text-center">
          <button
            type="button"
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            className="text-indigo-600 dark:text-indigo-400 hover:underline text-sm font-medium transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}