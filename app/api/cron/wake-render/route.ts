import { NextResponse } from 'next/server';

const RENDER_API = process.env.NEXT_PUBLIC_SCREENER_API_URL || 'https://screener-api-i6pi.onrender.com';

export async function GET() {
  try {
    // Renderをウォームアップ（スリープ解除）＋キャッシュを温める
    const res = await fetch(`${RENDER_API}/api/screen`, {
      headers: {
        'X-Api-Key': process.env.PREMIUM_API_KEY || '',
      },
      // タイムアウト設定（Vercel cron は最大60秒）
      signal: AbortSignal.timeout(55000),
    });

    const data = await res.json();

    return NextResponse.json({
      success: true,
      cached: data.cached,
      count: data.count,
      updated_at: data.updated_at,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Wake-render cron failed:', error);
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    );
  }
}
