
import React, { useState } from 'react';
import Layout from './components/Layout';
import Landing from './components/Landing';
import Dashboard from './components/Dashboard';
import Pricing from './components/Pricing';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('landing');

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-700">
        {activeTab === 'landing' && <Landing onStart={() => setActiveTab('dashboard')} />}
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'pricing' && <Pricing />}
      </div>
    </Layout>
  );
};

export default App;
