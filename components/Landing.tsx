
import React from 'react';
import { Search, Zap, FileText, BarChart3, ChevronRight, CheckCircle2 } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

const Landing: React.FC<LandingProps> = ({ onStart }) => {
  const features = [
    {
      title: 'Echtzeit-Suche',
      desc: 'Suchen Sie deutschlandweit in allen Registern gleichzeitig.',
      icon: Search,
    },
    {
      title: 'Strukturierte Daten',
      desc: 'Keine mühsame PDF-Analyse. Wir liefern sauberes JSON oder CSV.',
      icon: Zap,
    },
    {
      title: 'Automatisierte Reports',
      desc: 'Wöchentliche Updates bei Änderungen in Ihren Ziel-Unternehmen.',
      icon: FileText,
    },
    {
      title: 'Risk Management',
      desc: 'Erkennen Sie Insolvenz- oder Liquidations-signale sofort.',
      icon: BarChart3,
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Hero */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6">
            Handelsregister. <br />
            <span className="text-blue-600">Automatisiert & Intelligent.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-xl text-slate-600 dark:text-slate-400 mb-10">
            Wir transformieren öffentliche Registerdaten in digitale Assets. Strukturierte Auszüge, 
            Echtzeit-Monitoring und API-Anbindung für Ihr KYC und Risikomanagement.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={onStart}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-500/20"
            >
              Kostenlos testen <ChevronRight size={20} />
            </button>
            <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 px-8 py-4 rounded-xl text-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              Demo vereinbaren
            </button>
          </div>
        </div>

        {/* Mockup Preview */}
        <div className="mt-16 relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-[120px] rounded-full"></div>
          <div className="relative border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl overflow-hidden p-2">
            <div className="bg-slate-100 dark:bg-slate-800 rounded-xl p-4 flex gap-4">
              <div className="w-1/3 space-y-4">
                <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                </div>
              </div>
              <div className="w-2/3 h-64 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-slate-100/50 dark:bg-slate-900/50 py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-8 rounded-2xl bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-all group">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                  <f.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trust */}
      <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12">Mehr als 500 Unternehmen vertrauen uns</h2>
        <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
          <div className="text-2xl font-black italic">TRUSTED CORP</div>
          <div className="text-2xl font-black italic">LEGAL AI</div>
          <div className="text-2xl font-black italic">FIN-SCAN</div>
          <div className="text-2xl font-black italic">REGO-TECH</div>
        </div>
      </div>
    </div>
  );
};

export default Landing;
