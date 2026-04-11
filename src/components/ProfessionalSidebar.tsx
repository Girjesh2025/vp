import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  TrendingUp, 
  Settings, 
  Bell,
  Brain,
  Star,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Globe,
  Calculator,
  Eye,
  Activity,
  ChevronDown,
  Radar,
  Sparkles
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  isActive?: boolean;
  isNew?: boolean;
}

interface ProfessionalSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  portfolioCount?: number;
}

const ProfessionalSidebar: React.FC<ProfessionalSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse,
  portfolioCount = 0
}) => {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, badge: portfolioCount > 0 ? portfolioCount : undefined },
    { id: 'tools', label: 'Market Pulse', icon: Globe },
    { id: 'market-eye', label: 'Market Eye', icon: Eye },
    { id: 'swing-player', label: 'Swing Player', icon: Activity },
    { id: 'options-player', label: 'Options Player', icon: TrendingUp },
    { id: 'options-watch', label: 'Options Watch', icon: Radar, isNew: true },
    { id: 'options-decode', label: 'Options Decode', icon: Brain },
    { id: 'options-hint', label: 'Options Guide', icon: Brain },
    { id: 'trading-psychology', label: 'Trading Psychology', icon: Sparkles, isNew: true },
    { id: 'trading-tools', label: 'Trading Tools', icon: Calculator },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: '3' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];


  const bottomMenuItems: MenuItem[] = [
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
    { id: 'logout', label: 'Sign Out', icon: LogOut },
  ];

  const handleMenuClick = (itemId: string) => {
    if (itemId === 'logout') {
      console.log('Logout clicked');
      return;
    }
    onTabChange(itemId);
  };

  return (
    <div className={`bg-[#131b26] border-r border-[#1e293b] shadow-sm transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-[#1e293b]">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-black text-white">
                  <span className="text-emerald-500">Paper</span>Profit
                </h2>
                <p className="text-xs text-slate-400">NSE & BSE Paper Trading</p>
              </div>
            </div>
          )}
          
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1e293b] transition-colors duration-200"
            >
              {isCollapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">
              Main Menu
            </p>
          )}
          
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                  isActive
                    ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-sm shadow-emerald-500/10'
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-white'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-emerald-500' : 'text-slate-500 group-hover:text-slate-300'
                }`} />
                
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1 text-sm">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                        isActive 
                          ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30' 
                          : 'bg-[#1e293b] text-slate-300 border border-slate-700/50'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    {item.isNew && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/30 text-amber-400 tracking-wider">NEW</span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-[#1e293b]">
        <div className="space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            const isLogout = item.id === 'logout';
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                  isLogout
                    ? 'text-red-400 hover:bg-red-500/10 hover:text-red-300'
                    : 'text-slate-400 hover:bg-[#1e293b] hover:text-slate-200'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${isLogout ? 'group-hover:text-red-400' : 'group-hover:text-slate-300'}`} />
                {!isCollapsed && (
                  <span className="font-medium text-sm">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Status */}
      {!isCollapsed && (
      <div className="p-4 border-t border-[#1e293b] bg-[#131b26]">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-200">Online</p>
              <p className="text-[10px] text-slate-500 tracking-wider uppercase mt-0.5">All systems operational</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalSidebar;