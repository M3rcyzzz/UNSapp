"use client";

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Download, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  Clock, 
  Search, 
  Copy, 
  Wifi, 
  MousePointer,
  BarChart3,
  Monitor
} from 'lucide-react';

interface StatsData {
  // Basic metrics
  totalVisits: number;
  totalImports: number;
  totalExports: number;
  totalSessions: number;
  totalSessionDuration: number;
  averageSessionDuration: number;
  averagePageLoadTime: number;
  engagementScore: number;
  
  // Feature usage
  featureUsage: {
    mqtt_connect: number;
    mqtt_disconnect: number;
    mqtt_error: number;
    search: number;
    tree_expand: number;
    tree_collapse: number;
    tree_select: number;
    copy: number;
    import: number;
    export: number;
  };
  
  // Search analytics
  searchQueries: string[];
  totalSearchResults: number;
  topSearchTerms: [string, number][];
  
  // Tree interaction analytics
  mostAccessedTopics: Record<string, number>;
  topTopics: [string, number][];
  
  // Performance metrics
  performanceMetrics: {
    pageLoadTimes: number[];
    averagePageLoadTime: number;
  };
  
  // User engagement
  userEngagement: {
    totalUserActivity: number;
    averageSessionDuration: number;
    engagementScore: number;
  };
  
  // Error tracking
  errors: {
    total: number;
    byType: Record<string, number>;
  };
  
  // Device and browser analytics
  deviceAnalytics: {
    screenResolutions: Record<string, number>;
    timezones: Record<string, number>;
    browsers: Record<string, number>;
  };
  
  // Daily aggregations
  dailyVisits: Record<string, number>;
  dailyImports: Record<string, number>;
  dailyExports: Record<string, number>;
  dailySessions: Record<string, number>;
  dailyDurations: Record<string, number>;
  
  // Timestamps
  lastVisit: string | null;
  lastImport: string | null;
  lastExport: string | null;
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>{children}</div>
);

const StatCard = ({ title, value, icon: Icon, color = "blue" }: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<{ className?: string }>; 
  color?: string;
}) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50", 
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50",
    red: "text-red-600 bg-red-50",
    indigo: "text-indigo-600 bg-indigo-50"
  };
  
  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default function MercyStatsPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      const result = await response.json();
      if (result.success) {
        setStats(result.data);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);


  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getRecentDays = (days: number = 7) => {
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(date.toISOString().split('T')[0]);
    }
    return result;
  };

  const getDailyData = (dailyData: Record<string, number>, days: number = 7) => {
    const recentDays = getRecentDays(days);
    return recentDays.map(day => ({
      date: day,
      value: dailyData[day] || 0
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Failed to load stats</h1>
            <button 
              onClick={fetchStats}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dailyVisits = getDailyData(stats.dailyVisits);
  const dailyImports = getDailyData(stats.dailyImports);
  const dailyExports = getDailyData(stats.dailyExports);

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">UNS App Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive usage analytics and performance metrics</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={fetchStats}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Visits"
            value={stats.totalVisits.toLocaleString()}
            icon={Users}
            color="blue"
          />
          <StatCard
            title="Total Sessions"
            value={stats.totalSessions.toLocaleString()}
            icon={Activity}
            color="green"
          />
          <StatCard
            title="Avg Session Duration"
            value={formatDuration(stats.averageSessionDuration)}
            icon={Clock}
            color="purple"
          />
          <StatCard
            title="Engagement Score"
            value={`${stats.engagementScore}/100`}
            icon={BarChart3}
            color="orange"
          />
        </div>

        {/* Feature Usage Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="MQTT Connections"
            value={stats.featureUsage.mqtt_connect}
            icon={Wifi}
            color="green"
          />
          <StatCard
            title="Search Queries"
            value={stats.featureUsage.search}
            icon={Search}
            color="blue"
          />
          <StatCard
            title="Copy Actions"
            value={stats.featureUsage.copy}
            icon={Copy}
            color="purple"
          />
          <StatCard
            title="Tree Interactions"
            value={stats.featureUsage.tree_expand + stats.featureUsage.tree_collapse + stats.featureUsage.tree_select}
            icon={MousePointer}
            color="orange"
          />
        </div>

        {/* Import/Export Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Imports"
            value={stats.totalImports.toLocaleString()}
            icon={Download}
            color="green"
          />
          <StatCard
            title="Total Exports"
            value={stats.totalExports.toLocaleString()}
            icon={TrendingUp}
            color="blue"
          />
          <StatCard
            title="Page Load Time"
            value={`${stats.averagePageLoadTime.toFixed(0)}ms`}
            icon={Monitor}
            color="purple"
          />
        </div>

        {/* Daily Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Visits (Last 7 Days)</h3>
              <div className="space-y-3">
                {dailyVisits.map(({ date, value }) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (value / Math.max(...dailyVisits.map(d => d.value), 1)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Imports (Last 7 Days)</h3>
              <div className="space-y-3">
                {dailyImports.map(({ date, value }) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (value / Math.max(...dailyImports.map(d => d.value), 1)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Exports (Last 7 Days)</h3>
              <div className="space-y-3">
                {dailyExports.map(({ date, value }) => (
                  <div key={date} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {new Date(date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (value / Math.max(...dailyExports.map(d => d.value), 1)) * 100)}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8 text-right">
                        {value}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Top Searches and Topics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Search Terms</h3>
              <div className="space-y-2">
                {stats.topSearchTerms.slice(0, 10).map(([term, count]) => (
                  <div key={term} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1">{term}</span>
                    <span className="text-sm font-medium text-gray-900 ml-2">{count}</span>
                  </div>
                ))}
                {stats.topSearchTerms.length === 0 && (
                  <p className="text-sm text-gray-500">No search data available</p>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Accessed Topics</h3>
              <div className="space-y-2">
                {stats.topTopics.slice(0, 10).map(([topic, count]) => (
                  <div key={topic} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 truncate flex-1 font-mono">{topic}</span>
                    <span className="text-sm font-medium text-gray-900 ml-2">{count}</span>
                  </div>
                ))}
                {stats.topTopics.length === 0 && (
                  <p className="text-sm text-gray-500">No topic access data available</p>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Device Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Browser Distribution</h3>
              <div className="space-y-2">
                {Object.entries(stats.deviceAnalytics.browsers).map(([browser, count]) => (
                  <div key={browser} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{browser}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Screen Resolutions</h3>
              <div className="space-y-2">
                {Object.entries(stats.deviceAnalytics.screenResolutions).slice(0, 5).map(([resolution, count]) => (
                  <div key={resolution} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{resolution}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Summary</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Total Errors</span>
                  <span className="text-sm font-medium text-red-600">{stats.errors.total}</span>
                </div>
                {Object.entries(stats.errors.byType).map(([errorType, count]) => (
                  <div key={errorType} className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">{errorType}</span>
                    <span className="text-sm font-medium text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Summary */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Usage Pattern</h4>
                <p className="text-gray-600">
                  {stats.totalImports > 0 
                    ? `Import rate: ${((stats.totalImports / stats.totalVisits) * 100).toFixed(1)}% of visits result in imports`
                    : 'No imports recorded yet'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                <p className="text-gray-600">
                  {stats.lastVisit 
                    ? `Last activity: ${new Date(stats.lastVisit).toLocaleDateString()}`
                    : 'No recent activity'
                  }
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Engagement</h4>
                <p className="text-gray-600">
                  {stats.totalVisits > 0 
                    ? `Average ${(stats.totalImports / stats.totalVisits).toFixed(2)} imports per visit`
                    : 'No data available'
                  }
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}