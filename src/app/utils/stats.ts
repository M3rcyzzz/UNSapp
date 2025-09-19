// Statistics tracking utility
export const trackEvent = async (action: 'visit' | 'import') => {
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
      }),
    });
  } catch (error) {
    // Silently fail - we don't want stats tracking to break the app
    console.debug('Stats tracking failed:', error);
  }
};

// Track page visit on app load
export const trackVisit = () => {
  // Only track once per session
  if (typeof window !== 'undefined' && !sessionStorage.getItem('visitTracked')) {
    trackEvent('visit');
    sessionStorage.setItem('visitTracked', 'true');
  }
};

// Track UNS import
export const trackImport = () => {
  trackEvent('import');
};
