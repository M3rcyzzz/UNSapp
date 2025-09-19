import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory storage for demo purposes
// In production, you'd want to use a database like Vercel KV, Supabase, or PlanetScale
let stats = {
  totalVisits: 0,
  totalImports: 0,
  lastVisit: null as Date | null,
  lastImport: null as Date | null,
  dailyVisits: {} as Record<string, number>,
  dailyImports: {} as Record<string, number>,
};

export async function GET() {
  return NextResponse.json({
    success: true,
    data: stats
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, userAgent, ip } = body;
    
    const today = new Date().toISOString().split('T')[0];
    
    if (action === 'visit') {
      stats.totalVisits++;
      stats.lastVisit = new Date();
      stats.dailyVisits[today] = (stats.dailyVisits[today] || 0) + 1;
    } else if (action === 'import') {
      stats.totalImports++;
      stats.lastImport = new Date();
      stats.dailyImports[today] = (stats.dailyImports[today] || 0) + 1;
    }
    
    return NextResponse.json({
      success: true,
      message: `Stats updated for ${action}`,
      data: stats
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Invalid request' },
      { status: 400 }
    );
  }
}
