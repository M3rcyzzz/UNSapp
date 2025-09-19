// Advanced Statistics tracking utility
export const trackEvent = async (action: string, data?: Record<string, unknown>) => {
  try {
    await fetch('/api/stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        ...data,
      }),
    });
  } catch (error) {
    // Silently fail - we don't want stats tracking to break the app
    console.debug('Stats tracking failed:', error);
  }
};

// Session tracking
let sessionStartTime: number | null = null;
let sessionId: string | null = null;

// Initialize session
export const initSession = () => {
  if (typeof window === 'undefined') return;
  
  sessionStartTime = Date.now();
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Track page visit
  trackEvent('visit', {
    sessionId,
    visitStartTime: sessionStartTime,
    referrer: document.referrer,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  });
};

// Track session end with duration
export const trackSessionEnd = () => {
  if (typeof window === 'undefined' || !sessionStartTime || !sessionId) return;
  
  const duration = Date.now() - sessionStartTime;
  trackEvent('session_end', {
    sessionId,
    duration,
    visitStartTime: sessionStartTime,
  });
};

// Feature usage tracking
export const trackFeatureUsage = (feature: string, data?: Record<string, unknown>) => {
  trackEvent('feature_usage', {
    feature,
    ...data,
  });
};

// MQTT connection tracking
export const trackMqttConnection = (action: 'connect' | 'disconnect' | 'error', data?: Record<string, unknown>) => {
  trackEvent('mqtt_connection', {
    action,
    ...data,
  });
};

// Import/Export tracking
export const trackImport = (data?: Record<string, unknown>) => {
  trackEvent('import', data);
};

export const trackExport = (data?: Record<string, unknown>) => {
  trackEvent('export', data);
};

// Search tracking
export const trackSearch = (query: string, resultsCount: number) => {
  trackEvent('search', {
    query,
    resultsCount,
    queryLength: query.length,
  });
};

// Tree interaction tracking
export const trackTreeInteraction = (action: 'expand' | 'collapse' | 'select', data?: Record<string, unknown>) => {
  trackEvent('tree_interaction', {
    action,
    ...data,
  });
};

// Copy action tracking
export const trackCopy = (content: string, source: string) => {
  trackEvent('copy', {
    contentLength: content.length,
    source,
  });
};

// Error tracking
export const trackError = (error: string, context?: Record<string, unknown>) => {
  trackEvent('error', {
    error,
    context,
  });
};

// Performance tracking
export const trackPerformance = (metric: string, value: number, unit: string = 'ms') => {
  trackEvent('performance', {
    metric,
    value,
    unit,
  });
};

// User engagement tracking
export const trackEngagement = (action: string, data?: Record<string, unknown>) => {
  trackEvent('engagement', {
    action,
    ...data,
  });
};

// Initialize comprehensive tracking
export const initAdvancedTracking = () => {
  if (typeof window === 'undefined') return;

  // Initialize session
  initSession();

  // Track page load performance
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    trackPerformance('page_load', loadTime);
  });

  // Track session end events
  const handleBeforeUnload = () => {
    trackSessionEnd();
  };

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      trackSessionEnd();
    }
  };

  // Track user interactions
  const trackUserActivity = () => {
    trackEngagement('user_activity');
  };

  // Add event listeners
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  // Track user activity (mouse movement, clicks, etc.)
  let activityTimeout: NodeJS.Timeout;
  const resetActivityTimeout = () => {
    clearTimeout(activityTimeout);
    activityTimeout = setTimeout(trackUserActivity, 30000); // Track every 30 seconds of activity
  };

  document.addEventListener('mousemove', resetActivityTimeout);
  document.addEventListener('click', resetActivityTimeout);
  document.addEventListener('keypress', resetActivityTimeout);

  // Cleanup function
  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    document.removeEventListener('mousemove', resetActivityTimeout);
    document.removeEventListener('click', resetActivityTimeout);
    document.removeEventListener('keypress', resetActivityTimeout);
    clearTimeout(activityTimeout);
  };
};

// Legacy functions for backward compatibility
export const trackVisit = initSession;