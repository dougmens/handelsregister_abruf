
import React, { useState, useEffect } from 'react';
import { Shield, ShieldAlert, Moon, Sun, Server, WifiOff } from 'lucide-react';
import { SYSTEM_BANNER } from '../shared/constants';
import { apiClient } from '../apiClient';
import { RateLimitState } from '../shared/types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('theme') === 'dark');
  const [rateLimit, setRateLimit] = useState<RateLimitState | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const limits = await apiClient.getRateLimits();
        setRateLimit(limits);
        setIsDemo(apiClient.isLocalFallback);
      } catch (e) {
        console.error("Layout initialization failed", e);
      }
    };
    fetchLimits();
    const inv = setInterval(fetchLimits, 5000);
    
    if (darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    return () => clearInterval(inv);
  }, [darkMode]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col transition-colors">
      <div className="bg-blue-600 text-white py-1 px-4 text-center text-[10px] font-bold uppercase tracking-widest">
        {SYSTEM_BANNER}
      </div>

      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16">
        <div className="max-w-7xl mx-auto px-4 h-full flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('landing')}>
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <Shield className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl dark:text-white">RegiScan</span>
            {isDemo && (
              <span className="ml-2 px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase rounded flex items-center gap-1">
                <WifiOff size={10} /> Standalone Mode
              </span>
            )}
          </div>

          <div className="hidden md:flex gap-6 items-center">
            {['landing', 'dashboard', 'pricing'].map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm font-bold uppercase tracking-tight transition-colors ${activeTab === tab ? 'text-blue-600' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {tab}
              </button>
            ))}
            
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2" />

            {rateLimit && (
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black uppercase text-slate-400">Quota</span>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className={`w-3 h-1 rounded-full ${i < (rateLimit.userCurrent / rateLimit.userMax * 5) ? 'bg-blue-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                  ))}
                </div>
              </div>
            )}

            <button onClick={() => setDarkMode(!darkMode)} className="p-2 text-slate-500">
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-grow">{children}</main>

      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400 uppercase font-bold tracking-widest">
          <div className="flex items-center gap-2">
            {isDemo ? (
              <span className="flex items-center gap-2 text-amber-500"><ShieldAlert size={14} /> Local Engine (Preview)</span>
            ) : (
              <span className="flex items-center gap-2 text-green-500"><Server size={14} /> API: Connected</span>
            )}
          </div>
          <span>&copy; 2024 RegiScan Intelligence</span>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
