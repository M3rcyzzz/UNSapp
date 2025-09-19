"use client";

import React, { useState, useEffect } from 'react';
import { Activity, Download, Users, Calendar, TrendingUp, RefreshCw } from 'lucide-react';

interface StatsData {
  totalVisits: number;
  totalImports: number;
  lastVisit: string | null;
  lastImport: string | null;
  dailyVisits: Record<string, number>;
  dailyImports: Record<string, number>;
}

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-200 ${className}`}>{children}</div>
);

const StatCard = ({ title, value, icon: Icon, color = "blue" }: { 
  title: string; 
  value: string | number; 
  icon: React.ComponentType<any>; 
  color?: string;
}) => {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-50",
    green: "text-green-600 bg-green-50", 
    purple: "text-purple-600 bg-purple-50",
    orange: "text-orange-600 bg-orange-50"
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
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

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">UNS App Statistics</h1>
            <p className="text-gray-600 mt-1">Usage analytics and import tracking</p>
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
            title="Total Imports"
            value={stats.totalImports.toLocaleString()}
            icon={Download}
            color="green"
          />
          <StatCard
            title="Last Visit"
            value={formatDate(stats.lastVisit)}
            icon={Activity}
            color="purple"
          />
          <StatCard
            title="Last Import"
            value={formatDate(stats.lastImport)}
            icon={TrendingUp}
            color="orange"
          />
        </div>

        {/* Daily Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
