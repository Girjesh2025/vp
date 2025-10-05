// Browser Notification System
export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  requireInteraction?: boolean;
}

export interface PriceAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  condition: 'above' | 'below';
  isActive: boolean;
  createdAt: string;
}

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'default') {
    return await Notification.requestPermission();
  }

  return Notification.permission;
};

// Send browser notification
export const sendNotification = async (options: NotificationOptions): Promise<void> => {
  const permission = await requestNotificationPermission();
  
  if (permission !== 'granted') {
    console.warn('Notification permission not granted');
    return;
  }

  try {
    const notification = new Notification(options.title, {
      body: options.body,
      icon: options.icon || '/vite.svg',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      badge: '/vite.svg'
    });

    // Auto close after 5 seconds if not requiring interaction
    if (!options.requireInteraction) {
      setTimeout(() => notification.close(), 5000);
    }

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Price alert notifications
export const sendPriceAlert = async (symbol: string, currentPrice: number, targetPrice: number, condition: 'above' | 'below'): Promise<void> => {
  const title = `Price Alert: ${symbol}`;
  const body = `${symbol} is now ${condition} ₹${targetPrice}. Current price: ₹${currentPrice}`;
  
  await sendNotification({
    title,
    body,
    tag: `price-alert-${symbol}`,
    requireInteraction: true
  });
};

// Portfolio update notifications
export const sendPortfolioUpdate = async (totalPnL: number, totalPnLPercent: number): Promise<void> => {
  const isPositive = totalPnL >= 0;
  const title = `Portfolio Update`;
  const body = `Your portfolio is ${isPositive ? 'up' : 'down'} by ₹${Math.abs(totalPnL).toFixed(2)} (${Math.abs(totalPnLPercent).toFixed(2)}%)`;
  
  await sendNotification({
    title,
    body,
    tag: 'portfolio-update',
    icon: isPositive ? '📈' : '📉'
  });
};

// Market news notifications
export const sendMarketNewsNotification = async (newsTitle: string, newsDescription: string): Promise<void> => {
  await sendNotification({
    title: `Market News: ${newsTitle}`,
    body: newsDescription,
    tag: 'market-news'
  });
};

// Check price alerts
export const checkPriceAlerts = (alerts: PriceAlert[], currentPrices: Record<string, number>): void => {
  alerts.forEach(alert => {
    if (!alert.isActive) return;
    
    const currentPrice = currentPrices[alert.symbol];
    if (!currentPrice) return;

    const shouldAlert = 
      (alert.condition === 'above' && currentPrice >= alert.targetPrice) ||
      (alert.condition === 'below' && currentPrice <= alert.targetPrice);

    if (shouldAlert) {
      sendPriceAlert(alert.symbol, currentPrice, alert.targetPrice, alert.condition);
      // Deactivate alert after triggering
      alert.isActive = false;
    }
  });
};

// Notification settings management
export interface NotificationSettings {
  priceAlerts: boolean;
  portfolioUpdates: boolean;
  marketNews: boolean;
  soundEnabled: boolean;
  updateFrequency: number; // in minutes
}

export const getNotificationSettings = (): NotificationSettings => {
  const saved = localStorage.getItem('notificationSettings');
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Default settings
  return {
    priceAlerts: true,
    portfolioUpdates: true,
    marketNews: true,
    soundEnabled: true,
    updateFrequency: 30
  };
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  localStorage.setItem('notificationSettings', JSON.stringify(settings));
};

// Initialize notification system
export const initializeNotifications = async (): Promise<void> => {
  await requestNotificationPermission();
  console.log('Notification system initialized');
};