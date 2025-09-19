import { NextRequest, NextResponse } from 'next/server';

// Advanced statistics storage
const stats = {
  // Basic metrics
  totalVisits: 0,
  totalImports: 0,
  totalExports: 0,
  totalSessions: 0,
  totalSessionDuration: 0,
  
  // Feature usage
  featureUsage: {
    mqtt_connect: 0,
    mqtt_disconnect: 0,
    mqtt_error: 0,
    search: 0,
    tree_expand: 0,
    tree_collapse: 0,
    tree_select: 0,
    copy: 0,
    import: 0,
    export: 0,
  },
  
  // Search analytics
  searchQueries: [] as string[],
  totalSearchResults: 0,
  
  // Tree interaction analytics
  mostAccessedTopics: {} as Record<string, number>,
  
  // Performance metrics
  performanceMetrics: {
    pageLoadTimes: [] as number[],
    averagePageLoadTime: 0,
  },
  
  // User engagement
  userEngagement: {
    totalUserActivity: 0,
    averageSessionDuration: 0,
    engagementScore: 0,
  },
  
  // Error tracking
  errors: {
    total: 0,
    byType: {} as Record<string, number>,
  },
  
  // Device and browser analytics
  deviceAnalytics: {
    screenResolutions: {} as Record<string, number>,
    timezones: {} as Record<string, number>,
    browsers: {} as Record<string, number>,
  },
  
  // Daily aggregations
  dailyVisits: {} as Record<string, number>,
  dailyImports: {} as Record<string, number>,
  dailyExports: {} as Record<string, number>,
  dailySessions: {} as Record<string, number>,
  dailyDurations: {} as Record<string, number>,
  dailyFeatureUsage: {} as Record<string, Record<string, number>>,
  
  // Timestamps
  lastVisit: null as Date | null,
  lastImport: null as Date | null,
  lastExport: null as Date | null,
};

// Helper function to get browser info
const getBrowserInfo = (userAgent: string) => {
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  return 'Other';
};

// Helper function to calculate engagement score
const calculateEngagementScore = () => {
  const totalFeatures = Object.values(stats.featureUsage).reduce((sum, count) => sum + count, 0);
  const avgSessionDuration = stats.totalSessions > 0 ? stats.totalSessionDuration / stats.totalSessions : 0;
  const searchActivity = stats.searchQueries.length;
  
  // Simple engagement score calculation
  const score = Math.min(100, (totalFeatures * 2) + (avgSessionDuration / 1000 / 60) + (searchActivity * 5));
  return Math.round(score);
};

export async function GET() {
  // Calculate derived metrics
  const averageSessionDuration = stats.totalSessions > 0 
    ? Math.round(stats.totalSessionDuration / stats.totalSessions) 
    : 0;
  
  const averagePageLoadTime = stats.performanceMetrics.pageLoadTimes.length > 0
    ? Math.round(stats.performanceMetrics.pageLoadTimes.reduce((sum, time) => sum + time, 0) / stats.performanceMetrics.pageLoadTimes.length)
    : 0;
  
  const engagementScore = calculateEngagementScore();
  
  // Get top searched terms
  const topSearchTerms = stats.searchQueries
    .reduce((acc, query) => {
      acc[query] = (acc[query] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  
  const topSearches = Object.entries(topSearchTerms)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);
  
  // Get most accessed topics
  const topTopics = Object.entries(stats.mostAccessedTopics)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return NextResponse.json({
    success: true,
    data: {
      ...stats,
      averageSessionDuration,
      averagePageLoadTime,
      engagementScore,
      topSearchTerms: topSearches,
      topTopics,
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;
    
    const today = new Date().toISOString().split('T')[0];
    const userAgent = request.headers.get('user-agent') || '';
    
    // Update daily aggregations
    if (!stats.dailyFeatureUsage[today]) {
      stats.dailyFeatureUsage[today] = {};
    }
    
    switch (action) {
      case 'visit':
        stats.totalVisits++;
        stats.lastVisit = new Date();
        stats.dailyVisits[today] = (stats.dailyVisits[today] || 0) + 1;
        
        // Track device analytics
        if (data.screenResolution) {
          stats.deviceAnalytics.screenResolutions[data.screenResolution] = 
            (stats.deviceAnalytics.screenResolutions[data.screenResolution] || 0) + 1;
        }
        if (data.timezone) {
          stats.deviceAnalytics.timezones[data.timezone] = 
            (stats.deviceAnalytics.timezones[data.timezone] || 0) + 1;
        }
        stats.deviceAnalytics.browsers[getBrowserInfo(userAgent)] = 
          (stats.deviceAnalytics.browsers[getBrowserInfo(userAgent)] || 0) + 1;
        break;
        
      case 'session_end':
        if (data.duration) {
          stats.totalSessions++;
          stats.totalSessionDuration += data.duration;
          stats.dailySessions[today] = (stats.dailySessions[today] || 0) + 1;
          stats.dailyDurations[today] = (stats.dailyDurations[today] || 0) + data.duration;
        }
        break;
        
      case 'feature_usage':
        if (data.feature && stats.featureUsage[data.feature as keyof typeof stats.featureUsage] !== undefined) {
          stats.featureUsage[data.feature as keyof typeof stats.featureUsage]++;
          stats.dailyFeatureUsage[today][data.feature] = 
            (stats.dailyFeatureUsage[today][data.feature] || 0) + 1;
        }
        break;
        
      case 'mqtt_connection':
        if (data.action === 'connect') {
          stats.featureUsage.mqtt_connect++;
        } else if (data.action === 'disconnect') {
          stats.featureUsage.mqtt_disconnect++;
        } else if (data.action === 'error') {
          stats.featureUsage.mqtt_error++;
        }
        stats.dailyFeatureUsage[today][`mqtt_${data.action}`] = 
          (stats.dailyFeatureUsage[today][`mqtt_${data.action}`] || 0) + 1;
        break;
        
      case 'import':
        stats.totalImports++;
        stats.lastImport = new Date();
        stats.dailyImports[today] = (stats.dailyImports[today] || 0) + 1;
        stats.featureUsage.import++;
        stats.dailyFeatureUsage[today]['import'] = (stats.dailyFeatureUsage[today]['import'] || 0) + 1;
        break;
        
      case 'export':
        stats.totalExports++;
        stats.lastExport = new Date();
        stats.dailyExports[today] = (stats.dailyExports[today] || 0) + 1;
        stats.featureUsage.export++;
        stats.dailyFeatureUsage[today]['export'] = (stats.dailyFeatureUsage[today]['export'] || 0) + 1;
        break;
        
      case 'search':
        if (data.query) {
          stats.searchQueries.push(data.query);
          stats.featureUsage.search++;
          stats.totalSearchResults += data.resultsCount || 0;
          stats.dailyFeatureUsage[today]['search'] = (stats.dailyFeatureUsage[today]['search'] || 0) + 1;
        }
        break;
        
      case 'tree_interaction':
        if (data.action === 'expand') {
          stats.featureUsage.tree_expand++;
        } else if (data.action === 'collapse') {
          stats.featureUsage.tree_collapse++;
        } else if (data.action === 'select') {
          stats.featureUsage.tree_select++;
          if (data.topicPath) {
            stats.mostAccessedTopics[data.topicPath] = 
              (stats.mostAccessedTopics[data.topicPath] || 0) + 1;
          }
        }
        stats.dailyFeatureUsage[today][`tree_${data.action}`] = 
          (stats.dailyFeatureUsage[today][`tree_${data.action}`] || 0) + 1;
        break;
        
      case 'copy':
        stats.featureUsage.copy++;
        stats.dailyFeatureUsage[today]['copy'] = (stats.dailyFeatureUsage[today]['copy'] || 0) + 1;
        break;
        
      case 'error':
        stats.errors.total++;
        if (data.error) {
          stats.errors.byType[data.error] = (stats.errors.byType[data.error] || 0) + 1;
        }
        break;
        
      case 'performance':
        if (data.metric === 'page_load' && data.value) {
          stats.performanceMetrics.pageLoadTimes.push(data.value);
          // Keep only last 100 measurements
          if (stats.performanceMetrics.pageLoadTimes.length > 100) {
            stats.performanceMetrics.pageLoadTimes.shift();
          }
        }
        break;
        
      case 'engagement':
        stats.userEngagement.totalUserActivity++;
        break;
    }
    
    return NextResponse.json({
      success: true,
      message: `Stats updated for ${action}`,
      data: stats
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}