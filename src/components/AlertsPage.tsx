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
          <h2 className="text-2xl font-bold text-gray-800">Alerts & Notifications</h2>
          <p className="text-gray-600 mt-1">Manage your price alerts and notification preferences</p>
        </div>
        {activeTab === 'alerts' && (
          <button
            onClick={() => setShowCreateAlert(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Alert
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      activeTab === tab.id
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
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
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Price Alerts</h3>
                  <p className="text-gray-500 mb-4">Create your first price alert to get notified when stocks reach your target prices.</p>
                  <button
                    onClick={() => setShowCreateAlert(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                        className={`p-4 border rounded-lg transition-all ${
                          alert.isActive
                            ? status === 'triggered'
                              ? 'border-green-200 bg-green-50'
                              : 'border-gray-200 bg-white hover:bg-gray-50'
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(status)}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">
                                  {stockInfo?.name || alert.symbol}
                                </span>
                                <span className="text-sm text-gray-500">({alert.symbol})</span>
                                {alert.condition === 'above' ? (
                                  <TrendingUp className="w-4 h-4 text-green-500" />
                                ) : (
                                  <TrendingDown className="w-4 h-4 text-red-500" />
                                )}
                              </div>
                              <div className="text-sm text-gray-600">
                                Alert when price goes {alert.condition} ₹{alert.targetPrice.toFixed(2)}
                                {currentPrice && (
                                  <span className="ml-2">
                                    (Current: ₹{currentPrice.toFixed(2)})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleTestAlert(alert)}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Test Alert"
                            >
                              <Activity className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleAlert(alert.id)}
                              className={`p-2 rounded-lg transition-colors ${
                                alert.isActive
                                  ? 'text-green-600 hover:bg-green-100'
                                  : 'text-gray-400 hover:bg-gray-100'
                              }`}
                              title={alert.isActive ? 'Disable Alert' : 'Enable Alert'}
                            >
                              {alert.isActive ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => handleDeleteAlert(alert.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
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
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Notification Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-gray-800">Price Alerts</div>
                        <div className="text-sm text-gray-600">Get notified when stocks reach target prices</div>
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                      <div>
                        <div className="font-medium text-gray-800">Portfolio Updates</div>
                        <div className="text-sm text-gray-600">Daily portfolio performance summaries</div>
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Activity className="w-5 h-5 text-purple-500" />
                      <div>
                        <div className="font-medium text-gray-800">Market News</div>
                        <div className="text-sm text-gray-600">Breaking market news and updates</div>
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      {notificationSettings.soundEnabled ? (
                        <Volume2 className="w-5 h-5 text-blue-500" />
                      ) : (
                        <VolumeX className="w-5 h-5 text-gray-400" />
                      )}
                      <div>
                        <div className="font-medium text-gray-800">Sound Notifications</div>
                        <div className="text-sm text-gray-600">Play sound when notifications arrive</div>
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Frequency</h3>
                <div className="p-4 border border-gray-200 rounded-lg">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check for updates every {notificationSettings.updateFrequency} minutes
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
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
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
                <div className="text-center py-12">
                  <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-600 mb-2">No Alert History</h3>
                  <p className="text-gray-500">Triggered alerts will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alertHistory.map((alert, index) => {
                    const stockInfo = getStockInfo(alert.symbol);
                    return (
                      <div
                        key={`${alert.id}-${index}`}
                        className="p-4 border border-gray-200 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-green-500" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-800">
                                  {stockInfo?.name || alert.symbol}
                                </span>
                                <span className="text-sm text-gray-500">({alert.symbol})</span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Alert triggered: Price went {alert.condition} ₹{alert.targetPrice.toFixed(2)}
                                <span className="ml-2">
                                  (Actual: ₹{alert.currentPrice.toFixed(2)})
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Create Price Alert</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stock</label>
                <select
                  value={newAlert.symbol}
                  onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a stock</option>
                  {stocks.map((stock) => (
                    <option key={stock.symbol} value={stock.symbol}>
                      {stock.name} ({stock.symbol})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Condition</label>
                <select
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as 'above' | 'below' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="above">Price goes above</option>
                  <option value="below">Price goes below</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Target Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newAlert.targetPrice || ''}
                  onChange={(e) => setNewAlert({ ...newAlert, targetPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter target price"
                />
                {newAlert.symbol && priceData[newAlert.symbol] && (
                  <p className="text-sm text-gray-500 mt-1">
                    Current price: ₹{priceData[newAlert.symbol].price.toFixed(2)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateAlert(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAlert}
                disabled={!newAlert.symbol || newAlert.targetPrice <= 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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