
import React, { useState, useEffect } from 'react';
import { Search, History, Building2, Loader2, CheckCircle2, AlertCircle, FileText, Download, Clock, Database, Timer, ChevronRight } from 'lucide-react';
import { apiClient } from '../apiClient';
import { Company, SearchJob, ErrorCode } from '../types';
import { ERROR_MESSAGES } from '../constants';

const Dashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Company[]>([]);
  const [history, setHistory] = useState<SearchJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const fetchHistory = async () => {
    const data = await apiClient.getHistory();
    setHistory(data);
  };

  useEffect(() => {
    fetchHistory();
    const inv = setInterval(async () => {
      if (selectedJobId) {
        const job = await apiClient.getJob(selectedJobId);
        if (job) {
          setHistory(prev => prev.map(j => j.id === job.id ? job : j));
        }
      }
      fetchHistory();
    }, 3000);
    return () => clearInterval(inv);
  }, [selectedJobId]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const data = await apiClient.search(query);
      setResults(data);
    } finally {
      setIsSearching(false);
    }
  };

  const startJob = async (company: Company) => {
    try {
      const id = await apiClient.startJob(company);
      setSelectedJobId(id);
      setResults([]);
      setQuery('');
      fetchHistory();
    } catch (err: any) {
      alert(`Fehler: ${ERROR_MESSAGES[err.message as ErrorCode]?.title || err.message}`);
    }
  };

  const currentJob = history.find(j => j.id === selectedJobId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white"><Search size={20} className="text-blue-500"/> Suchen</h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder="Firma suchen..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none dark:text-white"
            />
            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
              {isSearching ? <Loader2 className="animate-spin" /> : <Search size={18} />} Suchen
            </button>
          </form>
          {results.map(c => (
            <button key={c.id} onClick={() => startJob(c)} className="w-full text-left mt-2 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-all">
              <span className="font-bold text-sm block dark:text-white">{c.name}</span>
              <span className="text-[10px] text-slate-500 uppercase">{c.court} {c.hrb}</span>
            </button>
          ))}
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white"><History size={20} className="text-blue-500"/> Historie</h2>
          <div className="space-y-2">
            {history.map(job => (
              <button 
                key={job.id} 
                onClick={() => setSelectedJobId(job.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${selectedJobId === job.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'border-slate-100 dark:border-slate-800'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold dark:text-white truncate max-w-[120px]">{job.companyName}</span>
                  <StatusIcon status={job.status} />
                </div>
                <span className="text-[9px] text-slate-400 font-mono">{new Date(job.createdAt).toLocaleTimeString()}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Detail Area */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[500px]">
        {!currentJob ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400">
            <Database size={48} className="mb-4 opacity-20" />
            <span className="text-sm font-bold uppercase tracking-widest">Warten auf Auswahl</span>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
              <h2 className="text-2xl font-black dark:text-white">{currentJob.companyName}</h2>
              <div className="flex gap-4 mt-2">
                <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Timer size={12}/> {currentJob.metadata.durationMs}ms</span>
                <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1"><Database size={12}/> {currentJob.metadata.provider}</span>
                {currentJob.metadata.cacheHit && <span className="text-[9px] font-black text-blue-500 uppercase">Cache Hit</span>}
              </div>
            </div>

            <div className="p-8 flex-grow">
              {currentJob.status === 'done' ? (
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase mb-2">Zweck des Unternehmens</h4>
                    <p className="text-sm dark:text-slate-300">{currentJob.result?.summary.purpose}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Kapital</span>
                      <span className="text-lg font-bold dark:text-white">{currentJob.result?.summary.capital}</span>
                    </div>
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Aktualisiert</span>
                      <span className="text-lg font-bold dark:text-white">{currentJob.result?.summary.lastChange}</span>
                    </div>
                  </div>
                </div>
              ) : currentJob.status === 'failed' ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <AlertCircle size={48} className="text-red-500 mb-4" />
                  <h3 className="text-xl font-bold mb-2 dark:text-white">{ERROR_MESSAGES[currentJob.errorCode!]?.title || 'Fehler'}</h3>
                  <p className="text-sm text-slate-500 mb-6">{ERROR_MESSAGES[currentJob.errorCode!]?.msg}</p>
                  <button onClick={() => setSelectedJobId(null)} className="px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold">Zurück</button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="relative w-20 h-20 mb-6">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="4" className="text-slate-100 dark:text-slate-800" />
                      <circle cx="40" cy="40" r="36" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray={226} strokeDashoffset={226 - (226 * currentJob.progress / 100)} className="text-blue-500 transition-all duration-500" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center font-black">{currentJob.progress}%</div>
                  </div>
                  <h3 className="text-lg font-bold dark:text-white mb-1">{currentJob.status === 'queued' ? 'In der Warteschlange' : 'Abruf läuft...'}</h3>
                  {currentJob.queuePosition && <p className="text-blue-500 text-xs font-bold uppercase">Position: {currentJob.queuePosition}</p>}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'done') return <CheckCircle2 size={12} className="text-green-500" />;
  if (status === 'failed') return <AlertCircle size={12} className="text-red-500" />;
  if (status === 'running') return <Loader2 size={12} className="text-blue-500 animate-spin" />;
  return <Clock size={12} className="text-slate-400" />;
};

export default Dashboard;
