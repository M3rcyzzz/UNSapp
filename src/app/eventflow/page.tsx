"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Activity, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function EventFlowPage() {
  const [nodeRedStatus, setNodeRedStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [nextJsStatus, setNextJsStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  useEffect(() => {
    // 检查 Node-RED 状态
    const checkNodeRed = async () => {
      try {
        const response = await fetch('/eventflow', { method: 'HEAD' });
        setNodeRedStatus(response.ok ? 'online' : 'offline');
      } catch {
        setNodeRedStatus('offline');
      }
    };

    // 检查 Next.js 状态
    const checkNextJs = async () => {
      try {
        const response = await fetch('/', { method: 'HEAD' });
        setNextJsStatus(response.ok ? 'online' : 'offline');
      } catch {
        setNextJsStatus('offline');
      }
    };

    checkNodeRed();
    checkNextJs();

    // 每30秒检查一次状态
    const interval = setInterval(() => {
      checkNodeRed();
      checkNextJs();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-yellow-500 animate-pulse" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return '在线';
      case 'offline':
        return '离线';
      default:
        return '检查中...';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            UNS EventFlow
          </h1>
          <p className="text-gray-600">
            Node-RED 事件流处理引擎集成
          </p>
        </div>

        {/* 状态面板 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Next.js 应用</h2>
              {getStatusIcon(nextJsStatus)}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              状态: <span className="font-medium">{getStatusText(nextJsStatus)}</span>
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
            >
              <ExternalLink className="w-4 h-4" />
              访问主页
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Node-RED 引擎</h2>
              {getStatusIcon(nodeRedStatus)}
            </div>
            <p className="text-sm text-gray-600 mb-4">
              状态: <span className="font-medium">{getStatusText(nodeRedStatus)}</span>
            </p>
            <a
              href="/eventflow/editor"
              className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800"
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
              打开编辑器
            </a>
          </div>
        </div>

        {/* 快速链接 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快速链接</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <a
              href="/eventflow/editor"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">流程编辑器</h3>
                <p className="text-sm text-gray-600">创建和编辑事件流</p>
              </div>
            </a>

            <a
              href="/eventflow/api"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">API 端点</h3>
                <p className="text-sm text-gray-600">访问自定义 API</p>
              </div>
            </a>

            <Link
              href="/"
              className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ExternalLink className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">UNS 浏览器</h3>
                <p className="text-sm text-gray-600">返回主题浏览器</p>
              </div>
            </Link>
          </div>
        </div>

        {/* 使用说明 */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">使用说明</h2>
          <div className="space-y-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">1. 启动服务</h3>
              <p>使用 <code className="bg-gray-100 px-2 py-1 rounded">npm run dev:full</code> 同时启动 Next.js 和 Node-RED</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">2. 访问编辑器</h3>
              <p>点击&ldquo;打开编辑器&rdquo;或访问 <code className="bg-gray-100 px-2 py-1 rounded">/eventflow/editor</code></p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">3. 创建流程</h3>
              <p>在 Node-RED 编辑器中拖拽节点创建事件处理流程</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">4. 部署和测试</h3>
              <p>部署流程并通过 API 端点测试功能</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
