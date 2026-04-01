import React from 'react';
import ProfessionalHeader from '../ProfessionalHeader';
import ProfessionalSidebar from '../ProfessionalSidebar';
import { PieChart, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SectorRotation: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <ProfessionalSidebar activeTab="tools" onTabChange={() => {}} portfolioCount={0} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <ProfessionalHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            <button onClick={() => navigate('/app')} className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 font-medium transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Tools
            </button>
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <PieChart className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Sector Rotation Intelligence</h2>
              <p className="text-slate-500 max-w-md mx-auto">This tool is currently under development. Check back soon for AI-powered sector rotation insights.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SectorRotation;
