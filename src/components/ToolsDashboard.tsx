import React from 'react';
import { 
  PieChart, Globe, ArrowRight, Calculator,
  TrendingUp, BarChart2, Zap
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ToolsDashboard: React.FC = () => {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'sector-rotation',
      title: 'Sector Rotation Intelligence',
      description: '12-month historical analysis with AI signals, sector rankings, monthly heatmaps, and rotation opportunities.',
      icon: <PieChart className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10',
      badge: { text: 'Featured', color: 'bg-rose-500/20 text-rose-400' },
      tag: { text: 'AI POWERED', color: 'bg-indigo-500/20 text-indigo-400' },
      link: '/app/tools/sector-rotation'
    },
    {
      id: 'global-market',
      title: 'Global Market',
      description: 'Monitor major international indices, global trends, and cross-market sentiment with live world market insights.',
      icon: <Globe className="w-5 h-5 text-blue-400" />,
      iconBg: 'bg-blue-500/10',
      badge: { text: 'New', color: 'bg-rose-500/20 text-rose-400' },
      tag: { text: 'LIVE', color: 'bg-blue-500/20 text-blue-400' },
      link: '/app/tools/global-market'
    },
    {
      id: 'sectoral-flow',
      title: 'Sectoral Flow',
      description: 'Track relative strength and institutional money flow across market sectors with real-time heatmaps.',
      icon: <BarChart2 className="w-5 h-5 text-amber-500" />,
      iconBg: 'bg-amber-500/10',
      tag: { text: 'LIVE', color: 'bg-indigo-500/20 text-indigo-400' },
      link: '/app/tools/sectoral-flow'
    },
    {
      id: 'precision-sizer',
      title: 'Precision Sizer',
      description: 'Calculate optimal position sizes with dynamic risk parameters and real-time volatility adjustments.',
      icon: <Calculator className="w-5 h-5 text-indigo-400" />,
      iconBg: 'bg-indigo-500/10',
      tag: { text: 'HOT', color: 'bg-amber-500/20 text-amber-500' },
      link: '/app/tools/position-calculator' // Reusing the existing calculator but linking from here
    },
    {
      id: 'returns-calculator',
      title: 'Returns Calculator',
      description: 'Analyze trade returns over time and visualize growth with compounding and reinvestment metrics.',
      icon: <TrendingUp className="w-5 h-5 text-emerald-400" />,
      iconBg: 'bg-emerald-500/10',
      tag: { text: 'HOT', color: 'bg-amber-500/20 text-amber-500' },
      link: '/app/tools/returns-calculator'
    }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
        
        <div className="relative flex items-center gap-4">
          <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
            <Zap className="w-7 h-7 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Trading Tools</h2>
            <p className="text-slate-400 text-sm mt-0.5">
              Advanced calculators, market insights, and AI analysis utilities
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => navigate(tool.link)}
            className="group relative bg-[#131b26] rounded-2xl p-6 border border-slate-800 hover:border-slate-700 transition-all duration-300 cursor-pointer flex flex-col min-h-[220px] shadow-lg hover:shadow-xl hover:-translate-y-1 overflow-hidden"
          >
            {/* Hover Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${tool.iconBg} rounded-full blur-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500 pointer-events-none`} />

            {/* Top Row: Icon & Badge */}
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={`w-10 h-10 rounded-xl ${tool.iconBg} flex items-center justify-center`}>
                {tool.icon}
              </div>
              {tool.badge && (
                <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tool.badge.color}`}>
                  {tool.badge.text}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 relative z-10">
              <h3 className="text-lg font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                {tool.title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">
                {tool.description}
              </p>
            </div>

            {/* Bottom Row: Tag & Explore link */}
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-800/50 relative z-10">
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tool.tag.color}`}>
                {tool.tag.text}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-white group-hover:text-indigo-400 transition-colors">
                Explore
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsDashboard;
