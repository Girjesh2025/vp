import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Plus, 
  Trash2, 
  Edit3, 
  TrendingUp, 
  TrendingDown, 
  Settings, 
  History,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Volume2,
  VolumeX,
  Clock,
  Target,
  Activity
} from 'lucide-react';
import { 
  PriceAlert, 
  NotificationSettings,
  getNotificationSettings,
  saveNotificationSettings,
  sendPriceAlert
} from '../utils/notifications';
import type { Stock, PriceData } from '../types';

interface AlertsPageProps {
  stocks: Stock[];
  priceData: Record<string, PriceData>;
  priceAlerts: PriceAlert[];
  setPriceAlerts: (alerts: PriceAlert[]) => void;
  getStockInfo: (symbol: string) => any;
  notificationSettings?: {
    priceAlertsEnabled: boolean;
    portfolioUpdatesEnabled: boolean;
    marketNewsEnabled: boolean;
  };
  onNotificationSettingsChange?: (settings: {
    priceAlertsEnabled: boolean;
    portfolioUpdatesEnabled: boolean;
    marketNewsEnabled: boolean;
  }) => void;
}

interface NewAlert {
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
}

const AlertsPage: React.FC<AlertsPageProps> = ({
  stocks,
  priceData,
  priceAlerts,
  setPriceAlerts,
  getStockInfo,
  notificationSettings: externalNotificationSettings,
  onNotificationSettingsChange
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'settings' | 'history'>('alerts');
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlert, setNewAlert] = useState<NewAlert>({
    symbol: '',
    targetPrice: 0,
    condition: 'above'
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getNotificationSettings());
  const [alertHistory, setAlertHistory] = useState<Array<PriceAlert & { triggeredAt: string; currentPrice: number }>>([]);
  const [editingAlert, setEditingAlert] = useState<string | null>(null);

  // Load alert history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('alertHistory');
    if (savedHistory) {
      setAlertHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save notification settings when they change
  useEffect(() => {
    saveNotificationSettings(notificationSettings);
  }, [notificationSettings]);

  const handleCreateAlert = () => {
    if (!newAlert.symbol || newAlert.targetPrice <= 0) return;

    const alert: PriceAlert = {
      id: Date.now().toString(),
      symbol: newAlert.symbol,
      targetPrice: newAlert.targetPrice,
      condition: newAlert.condition,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    setPriceAlerts([...priceAlerts, alert]);
    setNewAlert({ symbol: '', targetPrice: 0, condition: 'above' });
    setShowCreateAlert(false);
  };

  const handleDeleteAlert = (alertId: string) => {
    setPriceAlerts(priceAlerts.filter(alert => alert.id !== alertId));
  };

  const handleToggleAlert = (alertId: string) => {
    setPriceAlerts(priceAlerts.map(alert => 
      alert.id === alertId ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const handleTestAlert = async (alert: PriceAlert) => {
    const currentPrice = priceData[alert.symbol]?.price || 0;
    await sendPriceAlert(alert.symbol, currentPrice, alert.targetPrice, alert.condition);
    
    // Add to history
    const triggeredAlert = {
      ...alert,
      triggeredAt: new Date().toISOString(),
      currentPrice
    };
    const newHistory = [triggeredAlert, ...alertHistory].slice(0, 50); // Keep last 50
    setAlertHistory(newHistory);
    localStorage.setItem('alertHistory', JSON.stringify(newHistory));
  };

  const getAlertStatus = (alert: PriceAlert) => {
    const currentPrice = priceData[alert.symbol]?.price;
    if (!currentPrice) return 'unknown';
    
    const shouldTrigger = 
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice);
    
    return shouldTrigger ? 'triggered' : 'waiting';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'triggered':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'waiting':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <XCircle className="w-5 h-5 text-gray-400" />;
    }
  };

  const tabs = [
    { id: 'alerts', label: 'Price Alerts', icon: Bell, count: priceAlerts.length },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'history', label: 'History', icon: History, count: alertHistory.length }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Alerts & Notifications</h2>
          <p className="text-slate-400 mt-1">Manage your price alerts and notification preferences</p>
        </div>
        {activeTab === 'alerts' && (
          <button
            onClick={() => setShowCreateAlert(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-[#172030] rounded-2xl shadow-xl border border-slate-800 overflow-hidden">
        <div className="border-b border-slate-800 bg-[#131b26]">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                      : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 text-[10px] rounded font-black tracking-wider ${
                      activeTab === tab.id
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {/* Price Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-4">
              {priceAlerts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <Bell className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Price Alerts</h3>
                  <p className="text-slate-400 mb-6 max-w-sm mx-auto">Create your first price alert to get notified when stocks reach your target prices.</p>
                  <button
                    onClick={() => setShowCreateAlert(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
                  >
                    Create Alert
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {priceAlerts.map((alert) => {
                    const stockInfo = getStockInfo(alert.symbol);
                    const currentPrice = priceData[alert.symbol]?.price;
                    const status = getAlertStatus(alert);
                    
                    return (
                      <div
                        key={alert.id}
                        className={`p-5 border rounded-xl transition-all ${
                          alert.isActive
                            ? status === 'triggered'
                              ? 'border-emerald-500/30 bg-emerald-500/5'
                              : 'border-slate-700 bg-[#131b26] hover:border-slate-600'
                            : 'border-slate-800 bg-[#0f1520] opacity-60'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-4">
                            <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                                status === 'triggered' ? 'bg-emerald-500/20' : 'bg-slate-800'
                            }`}>
                              {getStatusIcon(status)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white text-lg">
                                  {stockInfo?.name || alert.symbol}
                                </span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                  {alert.symbol}
                                </span>
                                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                                  alert.condition === 'above' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                  {alert.condition === 'above' ? (
                                    <><TrendingUp className="w-3 h-3" /> ABOVE</>
                                  ) : (
                                    <><TrendingDown className="w-3 h-3" /> BELOW</>
                                  )}
                                </div>
                              </div>
                              <div className="text-sm text-slate-400 flex items-center gap-2">
                                <span>Target: <span className="font-bold text-slate-200">₹{alert.targetPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></span>
                                {currentPrice && (
                                  <>
                                    <span className="w-1 h-1 rounded-full bg-slate-600" />
                                    <span>Current: <span className="font-bold text-blue-400">₹{currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 sm:self-center self-end">
                            <button
                              onClick={() => handleTestAlert(alert)}
                              className="p-2.5 text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 rounded-lg transition-colors"
                              title="Test Alert"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleAlert(alert.id)}
                              className={`p-2.5 rounded-lg transition-colors ${
                                alert.isActive
                                  ? 'text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20'
                                  : 'text-slate-400 bg-slate-800 hover:bg-slate-700'
                              }`}
                              title={alert.isActive ? 'Disable Alert' : 'Enable Alert'}
                            >
                              {alert.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-2.5 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Delete Alert"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-5 border border-slate-800 bg-[#131b26] rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-blue-500/10 rounded-lg">
                        <Target className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Price Alerts</div>
                        <div className="text-sm text-slate-400">Get notified when stocks reach target prices</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={externalNotificationSettings?.priceAlertsEnabled ?? notificationSettings.priceAlerts}
                        onChange={(e) => {
                          if (onNotificationSettingsChange && externalNotificationSettings) {
                            onNotificationSettingsChange({
                              ...externalNotificationSettings,
                              priceAlertsEnabled: e.target.checked
                            });
                          } else {
                            setNotificationSettings({
                              ...notificationSettings,
                              priceAlerts: e.target.checked
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-5 border border-slate-800 bg-[#131b26] rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-emerald-500/10 rounded-lg">
                        <TrendingUp className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Portfolio Updates</div>
                        <div className="text-sm text-slate-400">Daily portfolio performance summaries</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={externalNotificationSettings?.portfolioUpdatesEnabled ?? notificationSettings.portfolioUpdates}
                        onChange={(e) => {
                          if (onNotificationSettingsChange && externalNotificationSettings) {
                            onNotificationSettingsChange({
                              ...externalNotificationSettings,
                              portfolioUpdatesEnabled: e.target.checked
                            });
                          } else {
                            setNotificationSettings({
                              ...notificationSettings,
                              portfolioUpdates: e.target.checked
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-5 border border-slate-800 bg-[#131b26] rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-purple-500/10 rounded-lg">
                        <Activity className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <div className="font-bold text-white">Market News</div>
                        <div className="text-sm text-slate-400">Breaking market news and updates</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={externalNotificationSettings?.marketNewsEnabled ?? notificationSettings.marketNews}
                        onChange={(e) => {
                          if (onNotificationSettingsChange && externalNotificationSettings) {
                            onNotificationSettingsChange({
                              ...externalNotificationSettings,
                              marketNewsEnabled: e.target.checked
                            });
                          } else {
                            setNotificationSettings({
                              ...notificationSettings,
                              marketNews: e.target.checked
                            });
                          }
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-5 border border-slate-800 bg-[#131b26] rounded-xl">
                    <div className="flex items-center gap-4">
                      <div className={`p-2.5 rounded-lg ${notificationSettings.soundEnabled ? 'bg-amber-500/10' : 'bg-slate-800'}`}>
                        {notificationSettings.soundEnabled ? (
                          <Volume2 className="w-5 h-5 text-amber-400" />
                        ) : (
                          <VolumeX className="w-5 h-5 text-slate-500" />
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-white">Sound Notifications</div>
                        <div className="text-sm text-slate-400">Play sound when notifications arrive</div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={notificationSettings.soundEnabled}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          soundEnabled: e.target.checked
                        })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-white mb-4">Update Frequency</h3>
                <div className="p-5 border border-slate-800 bg-[#131b26] rounded-xl">
                  <label className="block text-sm font-bold text-slate-300 mb-4">
                    Check for updates every <span className="text-blue-400">{notificationSettings.updateFrequency} minutes</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="120"
                    step="5"
                    value={notificationSettings.updateFrequency}
                    onChange={(e) => setNotificationSettings({
                      ...notificationSettings,
                      updateFrequency: parseInt(e.target.value)
                    })}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider accent-blue-500"
                  />
                  <div className="flex justify-between text-xs font-bold text-slate-500 mt-2">
                    <span>5 min</span>
                    <span>60 min</span>
                    <span>120 min</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              {alertHistory.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-700">
                    <History className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">No Alert History</h3>
                  <p className="text-slate-400">Triggered alerts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertHistory.map((alert, index) => {
                    const stockInfo = getStockInfo(alert.symbol);
                    return (
                      <div
                        key={`${alert.id}-${index}`}
                        className="p-5 border border-slate-800 bg-[#131b26] rounded-xl"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start sm:items-center gap-4">
                            <div className="p-2.5 bg-emerald-500/10 rounded-xl flex-shrink-0">
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-bold text-white text-lg">
                                  {stockInfo?.name || alert.symbol}
                                </span>
                                <span className="text-xs font-bold text-slate-500 bg-slate-800 px-2 py-0.5 rounded">
                                  {alert.symbol}
                                </span>
                              </div>
                              <div className="text-sm text-slate-400 flex items-center gap-2">
                                <span>Alert triggered: Price went {alert.condition} <span className="font-bold text-slate-200">₹{alert.targetPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></span>
                                <span className="w-1 h-1 rounded-full bg-slate-600" />
                                <span>Actual: <span className="font-bold text-blue-400">₹{alert.currentPrice.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span></span>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-bold text-slate-500 sm:self-center self-end bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700">
                            {new Date(alert.triggeredAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Alert Modal */}
      {showCreateAlert && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#172030] border border-slate-700 rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">Create Price Alert</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Stock</label>
                <select
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0f1520] border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                >
                  <option value="" className="bg-[#0f1520] text-slate-400">Select a stock</option>
                  {stocks.map((stock) => (
                    <option key={stock.symbol} value={stock.symbol} className="bg-[#0f1520]">
                      {stock.name} ({stock.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Condition</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewAlert({ ...newAlert, condition: 'above' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                      newAlert.condition === 'above'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-[#0f1520] text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4" /> Goes Above
                  </button>
                  <button
                    onClick={() => setNewAlert({ ...newAlert, condition: 'below' })}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${
                      newAlert.condition === 'below'
                        ? 'bg-red-500/20 text-red-400 border-red-500/30'
                        : 'bg-[#0f1520] text-slate-400 border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    <TrendingDown className="w-4 h-4" /> Goes Below
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Target Price</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    value={newAlert.targetPrice || ''}
                    onChange={(e) => setNewAlert({ ...newAlert, targetPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-8 pr-4 py-3 bg-[#0f1520] border border-slate-700 text-white font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all placeholder:font-normal placeholder:text-slate-600"
                    placeholder="0.00"
                  />
                </div>
                {newAlert.symbol && priceData[newAlert.symbol] && (
                  <div className="flex items-center gap-2 mt-2 text-sm">
                    <span className="text-slate-500">Current Market Price:</span>
                    <span className="font-bold text-blue-400">₹{priceData[newAlert.symbol].price.toLocaleString('en-IN', {minimumFractionDigits: 2})}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={() => setShowCreateAlert(false)}
                className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                disabled={!newAlert.symbol || newAlert.targetPrice <= 0}
                className="flex-1 px-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-blue-500/20"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertsPage;