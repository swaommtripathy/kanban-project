'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Layout as BoardIcon, LogOut, Sun, Moon, Briefcase } from 'lucide-react';

interface Board {
  _id: string;
  name: string;
  createdAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [newBoardTitle, setNewBoardTitle] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('dark');

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
  const cleanBaseUrl = BACKEND_URL.replace(/\/$/, '');

  const handleToggleTheme = useCallback(() => {
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    setCurrentTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    
    if (nextTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

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

  const fetchUserBoards = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const res = await fetch(`${cleanBaseUrl}/api/boards`, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (res.ok) {
        const data = await res.json();
        
        // If server returns empty array but you have items in DB, parse fallback persistence
        if (!data || data.length === 0) {
          const cachedBoards = localStorage.getItem('local_boards_fallback');
          if (cachedBoards) {
            setBoards(JSON.parse(cachedBoards));
          } else {
            setBoards([]);
          }
        } else {
          setBoards(data);
          localStorage.setItem('local_boards_fallback', JSON.stringify(data));
        }
      }
    } catch (err) {
      console.error("Failed to load user boards:", err);
      const cachedBoards = localStorage.getItem('local_boards_fallback');
      if (cachedBoards) setBoards(JSON.parse(cachedBoards));
    } finally {
      setLoading(false);
    }
  }, [cleanBaseUrl, router]);

  useEffect(() => {
    if (!mounted) return;
    fetchUserBoards();

    window.addEventListener('pageshow', fetchUserBoards);
    window.addEventListener('popstate', fetchUserBoards);

    return () => {
      window.removeEventListener('pageshow', fetchUserBoards);
      window.removeEventListener('popstate', fetchUserBoards);
    };
  }, [mounted, fetchUserBoards]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${cleanBaseUrl}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newBoardTitle }) 
      });

      if (res.ok) {
        const newBoard = await res.json();
        const updatedBoards = [...boards, newBoard];
        setBoards(updatedBoards);
        localStorage.setItem('local_boards_fallback', JSON.stringify(updatedBoards));
        setNewBoardTitle('');
        router.push(`/board/${newBoard._id}`);
      }
    } catch (err) {
      console.error("Board creation failed:", err);
    }
  };

  if (!mounted || loading) {
    return (
      <div className="h-screen bg-slate-50 dark:bg-[#0b0f19] flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500 rounded-xl" />
          <p className="text-slate-400 font-medium">Synchronizing datasets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f19] text-slate-900 dark:text-white transition-colors duration-300">
      {/* 🚀 ELITE NAVIGATION BAR */}
      <nav className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight uppercase">Workspace Hub</span>
          </div>

          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleToggleTheme}
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:scale-105 transition-all"
              title="Toggle Theme"
            >
              {currentTheme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1" />
            <button 
              type="button"
              onClick={() => { localStorage.clear(); router.push('/'); }}
              className="flex items-center gap-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-4 py-2.5 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-16 gap-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight">Active Projects</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-lg">Manage your team's real-time collaborative boards.</p>
          </div>
          
          <form onSubmit={handleCreateBoard} className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            <input
              type="text"
              placeholder="Board name..."
              className="bg-transparent border-none rounded-xl px-4 py-2 text-slate-900 dark:text-white w-full lg:w-64 focus:ring-0 outline-none font-medium"
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all whitespace-nowrap">
              <Plus className="w-5 h-5" /> Create Board
            </button>
          </form>
        </div>

        {/* BOARDS GRID */}
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-white/50 dark:bg-slate-900/20">
            <BoardIcon className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-400 dark:text-slate-500 font-bold text-xl text-center px-4">No active workspaces found.<br/><span className="text-sm font-medium opacity-60">Create your first board to get started.</span></p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {boards.map((board) => (
              <div
                key={board._id}
                onClick={() => router.push(`/board/${board._id}`)}
                className="group relative p-8 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer overflow-hidden"
              >
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                <div className="flex items-start justify-between mb-8">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-2xl text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <BoardIcon className="w-6 h-6" />
                  </div>
                </div>
                <h3 className="text-2xl font-bold mb-2 group-hover:translate-x-1 transition-transform">{board.name}</h3>
                <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-bold uppercase tracking-widest">
                  <span>Project Created:</span>
                  <span>{new Date(board.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}