import React from 'react';
import { 
  LayoutDashboard, 
  Briefcase, 
  TrendingUp, 
  BarChart3, 
  Settings, 
  Bell,
  Brain,
  Star,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  badge?: string | number;
  isActive?: boolean;
}

interface ProfessionalSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const ProfessionalSidebar: React.FC<ProfessionalSidebarProps> = ({
  activeTab,
  onTabChange,
  isCollapsed = false,
  onToggleCollapse
}) => {
  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'portfolio', label: 'Portfolio', icon: Briefcase, badge: '5' },
    { id: 'stock-recommendations', label: 'Stock Recommendations', icon: Star, badge: 'NEW' },
    { id: 'ai-trading', label: 'AI Trading', icon: Brain },
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
      // Handle logout logic here
      console.log('Logout clicked');
      return;
    }
    if (itemId === 'help') {
      // Handle help logic here
      console.log('Help clicked');
      return;
    }
    onTabChange(itemId);
  };

  return (
    <div className={`bg-white border-r border-gray-200 shadow-sm transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } flex flex-col h-full`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Portfolio Pro</h2>
                <p className="text-xs text-gray-500">Investment Suite</p>
              </div>
            </div>
          )}
          
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
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
      <nav className="flex-1 p-4">
        <div className="space-y-1">
          {!isCollapsed && (
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
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
                    ? 'bg-gradient-to-r from-indigo-50 to-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-5 h-5 ${
                  isActive ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                }`} />
                
                {!isCollapsed && (
                  <>
                    <span className="font-medium flex-1">{item.label}</span>
                    {item.badge && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Bottom Navigation */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-1">
          {bottomMenuItems.map((item) => {
            const Icon = item.icon;
            
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 group"
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Status */}
      {!isCollapsed && (
      <div className="p-4 border-t border-gray-200 bg-white/60 backdrop-blur">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Online</p>
              <p className="text-xs text-gray-500">All systems operational</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalSidebar;