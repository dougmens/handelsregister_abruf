
import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';

const Pricing: React.FC = () => {
  const tiers = [
    {
      name: 'Starter',
      price: '0',
      features: ['2 Abrufe pro Monat', 'Web-Ansicht', 'Basis Protokoll', 'Sammel-PDF'],
      cta: 'Kostenlos starten',
      highlight: false
    },
    {
      name: 'Pro',
      price: '49',
      features: ['50 Abrufe pro Monat', 'CSV/JSON Export', 'Automatisches Monitoring', 'API Zugriff (Beta)', 'Vorrangiger Support'],
      cta: 'Jetzt upgraden',
      highlight: true
    },
    {
      name: 'Business',
      price: '199',
      features: ['Unbegrenzte Abrufe', 'Whitelabel Berichte', 'Eigener Account Manager', 'SLA Garantie', 'On-Premise Option'],
      cta: 'Kontakt aufnehmen',
      highlight: false
    }
  ];

  return (
    <div className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-base font-bold text-blue-600 uppercase tracking-widest mb-2">Preise</h2>
        <p className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Wählen Sie den passenden Plan</p>
        <p className="text-slate-500 dark:text-slate-400">Transparente Kosten, keine versteckten Gebühren. Jederzeit kündbar.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tiers.map((tier, i) => (
          <div 
            key={i} 
            className={`relative p-8 rounded-3xl border flex flex-col ${
              tier.highlight 
                ? 'bg-blue-600 border-blue-600 shadow-2xl shadow-blue-500/30 text-white' 
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white'
            }`}
          >
            {tier.highlight && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-slate-900 text-xs font-black px-3 py-1 rounded-full uppercase">
                Empfehlung
              </div>
            )}
            <h3 className="text-xl font-bold mb-4">{tier.name}</h3>
            <div className="flex items-baseline mb-8">
              <span className="text-4xl font-black">{tier.price}€</span>
              <span className={`ml-2 text-sm ${tier.highlight ? 'text-blue-100' : 'text-slate-500'}`}>/ Monat</span>
            </div>
            <ul className="space-y-4 mb-8 flex-grow">
              {tier.features.map((f, j) => (
                <li key={j} className="flex items-center gap-3 text-sm">
                  <Check size={18} className={tier.highlight ? 'text-blue-200' : 'text-blue-500'} />
                  {f}
                </li>
              ))}
            </ul>
            <button 
              className={`w-full py-4 rounded-xl font-bold transition-all ${
                tier.highlight 
                  ? 'bg-white text-blue-600 hover:bg-slate-50' 
                  : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100'
              }`}
            >
              {tier.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-16 p-8 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 flex flex-col md:flex-row items-center gap-8">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white shrink-0">
          <ShieldCheck size={32} />
        </div>
        <div>
          <h4 className="text-xl font-bold text-slate-900 dark:text-white">Enterprise & Custom Solutions</h4>
          <p className="text-slate-600 dark:text-slate-400 text-sm">Sie benötigen Massenabrufe (10.000+) oder eine tiefe Systemintegration per Webhook? Wir bauen Ihre Lösung.</p>
        </div>
        <button className="md:ml-auto whitespace-nowrap bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all">
          Vertrieb kontaktieren
        </button>
      </div>
    </div>
  );
};

export default Pricing;
