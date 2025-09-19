"use client";

import React, { useState } from 'react';
import { Wifi, WifiOff, Settings, Play, Square } from 'lucide-react';
import { MqttConfig, useMqtt, MqttStats } from './mqtt-hook';

interface MqttConfigProps {
  onStatsUpdate: (stats: MqttStats) => void;
}

export const MqttConfigComponent: React.FC<MqttConfigProps> = ({ onStatsUpdate }) => {
  const [config, setConfig] = useState<MqttConfig>({
    brokerUrl: 'wss://broker.hivemq.com:8884/mqtt',
    username: '',
    password: '',
    clientId: '',
    topicPrefix: 'v1/FY-Fab',
  });
  
  const [showConfig, setShowConfig] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { stats, connect, disconnect } = useMqtt();

  // Update parent component with stats
  React.useEffect(() => {
    onStatsUpdate(stats);
  }, [stats, onStatsUpdate]);

  const handleConnect = async () => {
    console.log('Attempting to connect with config:', config);
    console.log('Broker URL:', config.brokerUrl);
    console.log('Topic prefix:', config.topicPrefix);
    
    // Enable MQTT debug logging
    localStorage.debug = 'mqttjs*';
    
    setIsConnecting(true);
    try {
      await connect(config);
      console.log('Connect function called successfully');
    } catch (error) {
      console.error('Connection failed:', error);
      alert(`Failed to connect to MQTT broker: ${error}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  const formatMessageCount = (count: number) => {
    if (count < 1000) return count.toString();
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-sm font-semibold text-gray-700 tracking-wide">MQTT Live Connection</h3>
          <div className="flex items-center gap-2">
            {stats.connected ? (
              <div className="flex items-center gap-1 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-xs font-medium whitespace-nowrap">Connected</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-500">
                <WifiOff className="w-4 h-4" />
                <span className="text-xs font-medium whitespace-nowrap">Disconnected</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {stats.connected ? (
            <button
              onClick={handleDisconnect}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-red-200 text-red-700 bg-red-50 rounded-xl hover:bg-red-100 hover:border-red-300 transition-colors whitespace-nowrap"
            >
              <Square className="w-4 h-4" />
              Disconnect
            </button>
          ) : (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="flex items-center gap-1 px-3 py-1.5 text-sm border border-green-200 text-green-700 bg-green-50 rounded-xl hover:bg-green-100 hover:border-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Play className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect'}
            </button>
          )}
          
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 px-3 py-1.5 text-sm border border-gray-200 text-gray-700 bg-gray-50 rounded-xl hover:bg-gray-100 hover:border-gray-300 transition-colors whitespace-nowrap"
          >
            <Settings className="w-4 h-4" />
            Config
          </button>
        </div>
      </div>

      {/* Connection Stats */}
      {stats.connected && (
        <div className="mb-3 p-2 bg-green-50 rounded-xl border border-green-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-green-700 font-medium">Messages:</span>
              <span className="ml-1 font-mono text-green-800">{formatMessageCount(stats.messageCount)}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Topics:</span>
              <span className="ml-1 font-mono text-green-800">{stats.topics.size}</span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Last Message:</span>
              <span className="ml-1 font-mono text-green-800">
                {stats.lastMessage ? new Date(stats.lastMessage.timestamp).toLocaleTimeString() : 'None'}
              </span>
            </div>
            <div>
              <span className="text-green-700 font-medium">Status:</span>
              <span className="ml-1 text-green-800">Live</span>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Panel */}
      {showConfig && (
        <div className="border-t border-gray-200 pt-3">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">MQTT Broker Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Broker URL</label>
              <input
                type="text"
                value={config.brokerUrl}
                onChange={(e) => setConfig(prev => ({ ...prev, brokerUrl: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                placeholder="ws://localhost:1883"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Topic Prefix</label>
              <input
                type="text"
                value={config.topicPrefix}
                onChange={(e) => setConfig(prev => ({ ...prev, topicPrefix: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                placeholder="v1"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Username (Optional)</label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig(prev => ({ ...prev, username: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                placeholder="username"
              />
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Password (Optional)</label>
              <input
                type="password"
                value={config.password}
                onChange={(e) => setConfig(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
                placeholder="password"
              />
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs text-blue-700 mb-2">
              <strong>Note:</strong> The browser will subscribe to <code className="bg-blue-100 px-1 rounded">{config.topicPrefix || 'v1'}/#</code> 
              to receive all UNS topics. Make sure your MQTT broker supports WebSocket connections for browser compatibility.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
