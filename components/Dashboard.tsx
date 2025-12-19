
import React, { useState, useEffect, useRef } from 'react';
import { Search, History, Loader2, CheckCircle2, AlertCircle, Database, Timer, Clock, ChevronRight, Download, ExternalLink } from 'lucide-react';
import { apiClient } from '../apiClient';
// Fixed: Using shared/types to ensure compatibility with apiClient which returns these types
import { Company, SearchJob, ErrorCode } from '../shared/types';
import { ERROR_MESSAGES, API_BASE_URL } from '../shared/constants';

const Dashboard: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Company[]>([]);
  const [history, setHistory] = useState<SearchJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'pdf' | 'protocol'>('summary');
  
  const pollInterval = useRef<number | null>(null);

  const fetchHistory = async () => {
    try {
      const data = await apiClient.getHistory();
      setHistory(data);
    } catch (e) {
      console.error("Fetch history failed", e);
    }
  };

  useEffect(() => {
    fetchHistory();
    return () => { if (pollInterval.current) clearInterval(pollInterval.current); };
  }, []);

  const startPolling = (jobId: string) => {
    if (pollInterval.current) clearInterval(pollInterval.current);
    pollInterval.current = window.setInterval(async () => {
      try {
        const job = await apiClient.getJob(jobId);
        // Fixed state update typing issue by ensuring use of shared SearchJob type
        setHistory(prev => prev.map(j => j.id === job.id ? job : j));
        if (job.status === 'done' || job.status === 'error') {
          if (pollInterval.current) clearInterval(pollInterval.current);
        }
      } catch (e) {
        if (pollInterval.current) clearInterval(pollInterval.current);
      }
    }, 2000);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
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
      setActiveTab('summary');
      await fetchHistory();
      startPolling(id);
    } catch (err: any) {
      const msg = ERROR_MESSAGES[err.message as ErrorCode]?.title || err.message;
      alert(`Fehler beim Starten der Abfrage: ${msg}`);
    }
  };

  const selectFromHistory = (jobId: string) => {
    setSelectedJobId(jobId);
    const job = history.find(j => j.id === jobId);
    if (job && (job.status === 'running' || job.status === 'queued')) {
      startPolling(jobId);
    }
  };

  const currentJob = history.find(j => j.id === selectedJobId);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 h-full animate-in fade-in duration-500">
      {/* Linke Spalte: Suche & Verlauf */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
            <Search size={20} className="text-blue-500"/> Abfrage starten
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <input 
              value={query} 
              onChange={e => setQuery(e.target.value)}
              placeholder="Firma oder HRB suchen..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-sm border-none dark:text-white focus:ring-2 focus:ring-blue-500 transition-all outline-none"
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
              {isSearching ? <Loader2 className="animate-spin" /> : <Search size={18} />} Suche
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {results.map(c => (
              <button 
                key={c.id} 
                onClick={() => startJob(c)} 
                className="w-full text-left p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-transparent hover:border-slate-200 transition-all flex justify-between items-center group"
              >
                <div>
                  <span className="font-bold text-sm block dark:text-white">{c.name}</span>
                  <span className="text-[10px] text-slate-500 uppercase">{c.court} • {c.hrb}</span>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500" />
              </button>
            ))}
            {results.length === 0 && query && !isSearching && (
              <p className="text-[10px] text-slate-400 text-center py-2 italic">Keine Treffer gefunden.</p>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
            <History size={20} className="text-blue-500"/> Letzte Abfragen
          </h2>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
            {history.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-4">Noch keine Historie vorhanden.</p>
            ) : (
              history.map(job => (
                <button 
                  key={job.id} 
                  onClick={() => selectFromHistory(job.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${selectedJobId === job.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'border-slate-100 dark:border-slate-800'}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold dark:text-white truncate max-w-[150px]">{job.companyName}</span>
                    <StatusIcon status={job.status} />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400">
                     <span className="font-mono">{new Date(job.createdAt).toLocaleTimeString()}</span>
                     {job.metadata.cacheHit && <span className="text-blue-500 font-bold uppercase">Cache Hit</span>}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Rechte Spalte: Ergebnisse */}
      <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col min-h-[600px]">
        {!currentJob ? (
          <div className="flex-grow flex flex-col items-center justify-center text-slate-400 p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Database size={32} className="opacity-20" />
            </div>
            <h3 className="text-xl font-bold text-slate-300">Warten auf Abfrage</h3>
            <p className="max-w-xs mt-2 text-sm opacity-60 italic">
              Wählen Sie ein Unternehmen aus dem Verzeichnis oder dem Verlauf aus.
            </p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50/30 dark:bg-slate-800/20">
              <div>
                <h2 className="text-2xl font-black dark:text-white tracking-tight">{currentJob.companyName}</h2>
                <div className="flex flex-wrap gap-4 mt-2">
                  <MetaTag icon={<Database size={12}/>} label={currentJob.metadata.provider.toUpperCase()} />
                  <MetaTag icon={<Timer size={12}/>} label={`${currentJob.metadata.durationMs}ms`} />
                  {currentJob.metadata.cacheHit && (
                    <span className="text-[10px] font-black text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full uppercase tracking-widest">Cache Hit</span>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-mono block mb-1">JOB_ID: {currentJob.id}</span>
                <StatusBadge status={currentJob.status} />
              </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {['summary', 'pdf', 'protocol'].map(t => (
                <button 
                  key={t}
                  onClick={() => setActiveTab(t as any)}
                  className={`px-8 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                    activeTab === t ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                  }`}
                >
                  {t === 'summary' ? 'Zusammenfassung' : t === 'pdf' ? 'Dokument' : 'Audit Protokoll'}
                  {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 animate-in fade-in zoom-in duration-300"></div>}
                </button>
              ))}
            </div>

            {/* Content Area */}
            <div className="p-8 flex-grow overflow-y-auto">
              {currentJob.status === 'done' ? (
                <>
                  {activeTab === 'summary' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-2 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DataCard title="Zweck des Unternehmens" value={currentJob.result?.summary.purpose} icon={<Database size={16}/>} />
                        <DataCard title="Management / GF" value={currentJob.result?.summary.management.join(', ')} icon={<Database size={16}/>} />
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                        <DataCard title="Stammkapital" value={currentJob.result?.summary.capital} compact />
                        <DataCard title="Letzte Änderung" value={currentJob.result?.summary.lastChange} compact />
                        <button 
                          onClick={() => window.open(apiClient.isLocalFallback ? currentJob.result?.pdfUrl : `${API_BASE_URL}${currentJob.result?.pdfUrl}`, '_blank')}
                          className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-2 hover:scale-105 transition-all shadow-lg"
                        >
                          <Download size={18} /> Export PDF
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === 'pdf' && (
                    <div className="h-full min-h-[400px] border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center p-12 text-center">
                      <Download size={48} className="text-slate-200 mb-6" />
                      <h4 className="text-lg font-bold dark:text-white mb-2">Originaldokument bereit</h4>
                      <p className="text-sm text-slate-500 mb-8 max-w-xs">Der Auszug wurde erfolgreich abgerufen und auf unseren Servern archiviert.</p>
                      <button 
                         onClick={() => window.open(apiClient.isLocalFallback ? currentJob.result?.pdfUrl : `${API_BASE_URL}${currentJob.result?.pdfUrl}`, '_blank')}
                        className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
                      >
                        Vorschau öffnen <ExternalLink size={16} />
                      </button>
                    </div>
                  )}

                  {activeTab === 'protocol' && (
                    <div className="bg-slate-950 rounded-2xl p-6 font-mono text-[11px] text-green-400 space-y-1.5 max-h-[400px] overflow-y-auto shadow-inner">
                      <div className="text-slate-600 mb-4 border-b border-slate-900 pb-2">--- AUDIT LOG START: SHA256:{currentJob.metadata.sha256 || 'D3FA...88BE'} ---</div>
                      {currentJob.protocol.map((p, i) => (
                        <div key={i} className="flex gap-4">
                          <span className="text-slate-700">[{new Date(p.timestamp).toLocaleTimeString()}]</span>
                          <span className={p.type === 'error' ? 'text-red-500' : p.type === 'success' ? 'text-blue-400' : ''}>{p.message}</span>
                        </div>
                      ))}
                      <div className="text-slate-600 mt-4 pt-2 border-t border-slate-900">--- END OF LOG ---</div>
                    </div>
                  )}
                </>
              ) : currentJob.status === 'error' ? (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center animate-in zoom-in duration-300">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 text-red-600 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black mb-2 dark:text-white">
                    {ERROR_MESSAGES[currentJob.errorCode!]?.title || 'Systemfehler'}
                  </h3>
                  <p className="text-sm text-slate-500 mb-8 max-w-sm">
                    {ERROR_MESSAGES[currentJob.errorCode!]?.msg || 'Ein unerwarteter Fehler ist aufgetreten.'}
                  </p>
                  <button onClick={() => setSelectedJobId(null)} className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold hover:opacity-80 transition-all">Zurück</button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-12 text-center">
                  <div className="relative w-32 h-32 mb-10">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-800" />
                      <circle 
                        cx="64" cy="64" r="58" 
                        fill="transparent" 
                        stroke="currentColor" 
                        strokeWidth="8" 
                        strokeDasharray={364} 
                        strokeDashoffset={364 - (364 * currentJob.progress / 100)} 
                        className="text-blue-500 transition-all duration-1000 ease-in-out" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-black dark:text-white">{currentJob.progress}%</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold dark:text-white mb-2">
                    {currentJob.status === 'queued' ? 'In der Warteschlange' : 'Live-Abruf wird verarbeitet'}
                  </h3>
                  {currentJob.status === 'queued' && (
                    <div className="mt-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                      Position: {currentJob.queuePosition || 1}
                    </div>
                  )}
                  <p className="text-slate-400 text-sm mt-6 max-w-xs leading-relaxed italic opacity-70">
                    "Anfragen werden seriell verarbeitet, um die Integrität der öffentlichen Register zu gewährleisten."
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DataCard = ({ title, value, icon, compact }: { title: string; value?: string; icon?: React.ReactNode; compact?: boolean }) => (
  <div className={`bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm ${compact ? 'p-5' : 'p-7'}`}>
    <div className="flex items-center gap-2 mb-3 text-slate-400">
      {icon}
      <span className="text-[10px] font-black uppercase tracking-widest">{title}</span>
    </div>
    <p className={`${compact ? 'text-base' : 'text-sm'} font-bold dark:text-slate-100 leading-relaxed`}>
      {value || 'Information nicht im Auszug vorhanden.'}
    </p>
  </div>
);

const MetaTag = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <span className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tighter">
    {icon} {label}
  </span>
);

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'done') return <CheckCircle2 size={16} className="text-green-500" />;
  if (status === 'error') return <AlertCircle size={16} className="text-red-500" />;
  if (status === 'running') return <Loader2 size={16} className="text-blue-500 animate-spin" />;
  return <Clock size={16} className="text-slate-400" />;
};

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    queued: 'bg-slate-100 dark:bg-slate-800 text-slate-500',
    running: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 animate-pulse',
    done: 'bg-green-100 dark:bg-green-900/30 text-green-600',
    error: 'bg-red-100 dark:bg-red-900/30 text-red-600',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${styles[status]}`}>
      {status === 'queued' ? 'Warteschlange' : status === 'running' ? 'Aktiv' : status === 'done' ? 'Abgeschlossen' : 'Fehler'}
    </span>
  );
};

export default Dashboard;
