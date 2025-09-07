import { NextRequest, NextResponse } from 'next/server';

// Node-RED 配置
const NODE_RED_CONFIG = {
  port: process.env.NODE_RED_PORT || 1880,
  host: process.env.NODE_RED_HOST || 'localhost',
  adminPath: '/eventflow',
  apiPath: '/eventflow/api'
};

// 代理请求到 Node-RED 实例
async function proxyToNodeRed(request: NextRequest, path: string) {
  const nodeRedUrl = `http://${NODE_RED_CONFIG.host}:${NODE_RED_CONFIG.port}${path}`;
  
  try {
    const response = await fetch(nodeRedUrl, {
      method: request.method,
      headers: {
        'Content-Type': request.headers.get('content-type') || 'application/json',
        'User-Agent': request.headers.get('user-agent') || 'Next.js-Node-RED-Proxy',
      },
      body: request.method !== 'GET' ? await request.text() : undefined,
    });

    const data = await response.text();
    
    return new NextResponse(data, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'text/html',
      },
    });
  } catch (error) {
    console.error('Node-RED proxy error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Node-RED service unavailable',
        message: 'Please ensure Node-RED is running on the configured port',
        config: NODE_RED_CONFIG
      }), 
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// 处理所有 Node-RED 路由
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/eventflow', '') || '/';
  
  return proxyToNodeRed(request, path);
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/eventflow', '') || '/';
  
  return proxyToNodeRed(request, path);
}

export async function PUT(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/eventflow', '') || '/';
  
  return proxyToNodeRed(request, path);
}

export async function DELETE(request: NextRequest) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/eventflow', '') || '/';
  
  return proxyToNodeRed(request, path);
}
