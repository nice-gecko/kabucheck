'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_SCREENER_API_URL || 'https://screener-api-i6pi.onrender.com';

interface ScreenerResult {
  ticker: string;
  name: string;
  flag: string;
  market: string;
  sector: string;
  pattern: string;
  risk: string;
  score: number;
  price: number;
  currency: string;
  sym: string;
  high_52w: number;
  pullback: number;
  rsi: number;
  vol_5d: number;
  vol_ratio: number;
  weekly_trend: string;
  ma20: number;
  ma50: number;
  wma13: number;
  wma26: number;
  atr: number;
  surge_4w: number;
  per: number | null;
  earn_growth: number | null;
  div_yield: number | null;
  next_earnings: string | null;
  market_cap: string;
  price_group: string;
  passed: boolean;
}

interface ApiResponse {
  success: boolean;
  count: number;
  is_premium: boolean;
  cached: boolean;
  updated_at: string | null;
  results: ScreenerResult[];
}

// ─── スタイル定数 ───────────────────────────────────────────────

const card: React.CSSProperties = {
  backgroundColor: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
};

const premiumOverlayOuter: React.CSSProperties = {
  position: 'relative',
  marginTop: 0,
};

const blurredRowStyle: React.CSSProperties = {
  filter: 'blur(5px)',
  userSelect: 'none',
  pointerEvents: 'none',
};

const premiumBannerStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(to bottom, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.97) 40%)',
  zIndex: 10,
  gap: 12,
};

const premiumButtonStyle: React.CSSProperties = {
  backgroundColor: '#2563eb',
  color: '#fff',
  fontWeight: 700,
  padding: '12px 28px',
  borderRadius: 8,
  border: 'none',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
  textDecoration: 'none',
  display: 'inline-block',
};

// ─── ユーティリティ関数 ──────────────────────────────────────────

function fmtPrice(r: ScreenerResult) {
  return r.currency === 'JPY'
    ? `¥${r.price.toLocaleString()}`
    : `$${r.price.toFixed(2)}`;
}

function getRsiStyle(rsi: number): React.CSSProperties {
  if (rsi >= 70) return { color: '#ef4444', backgroundColor: '#fef2f2' };
  if (rsi >= 55) return { color: '#ca8a04', backgroundColor: '#fefce8' };
  return { color: '#16a34a', backgroundColor: '#f0fdf4' };
}

function getRakutenUrl(r: ScreenerResult) {
  if (r.market === '東証') {
    return `https://www.rakuten-sec.co.jp/web/market/search/ipmenu_stock.html?ID=${r.ticker.replace('.T', '')}`;
  }
  return `https://www.rakuten-sec.co.jp/web/market/search/ipmenu_us_stock.html?ID=${r.ticker}`;
}

// ─── スコア「？」ツールチップ コンポーネント ───────────────────

function ScoreTooltip() {
  const [visible, setVisible] = useState(false);

  return (
    <span
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 15,
        height: 15,
        borderRadius: '50%',
        border: '1px solid #9ca3af',
        color: '#9ca3af',
        fontSize: 10,
        fontWeight: 700,
        cursor: 'default',
        lineHeight: 1,
        flexShrink: 0,
      }}>?</span>
      {visible && (
        <span style={{
          position: 'absolute',
          bottom: '110%',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#1e293b',
          color: '#f1f5f9',
          fontSize: 11,
          borderRadius: 6,
          padding: '6px 10px',
          whiteSpace: 'nowrap',
          zIndex: 100,
          boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
          pointerEvents: 'none',
        }}>
          モメンタム・ボラティリティ・財務健全性を<br />独自ロジックで数値化（満点100）
          <span style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            borderWidth: 5,
            borderStyle: 'solid',
            borderColor: '#1e293b transparent transparent transparent',
          }} />
        </span>
      )}
    </span>
  );
}

// ─── 銘柄名ホバーUI コンポーネント ──────────────────────────────

function TickerCell({ r }: { r: ScreenerResult }) {
  const [hovered, setHovered] = useState(false);

  const chartUrl = r.market === '東証'
    ? `https://finance.yahoo.co.jp/quote/${r.ticker.replace('.T', '')}.T/chart`
    : `https://finance.yahoo.com/chart/${r.ticker}`;

  return (
    <td style={{ padding: '12px 16px', position: 'relative' }}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{ display: 'inline-block', cursor: 'default' }}
      >
        <div style={{ fontWeight: 700, color: '#111827' }}>
          {r.flag} {r.name}
        </div>
        <div style={{ fontSize: 11, color: '#2563eb', fontFamily: 'monospace' }}>{r.ticker}</div>
        <div style={{ fontSize: 11, color: '#9ca3af' }}>🏭 {r.sector}</div>

        {hovered && (
          <div style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 50,
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
            padding: 14,
            minWidth: 220,
            pointerEvents: 'auto',
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 8 }}>
              {r.flag} {r.name}
            </div>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column', fontSize: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                <span>現在値</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111827' }}>{fmtPrice(r)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                <span>52W高値比</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: r.pullback === 0 ? '#16a34a' : '#ca8a04' }}>
                  {r.pullback === 0 ? 'AT HIGH' : `-${r.pullback}%`}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                <span>RSI(14)</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#111827' }}>{r.rsi}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#6b7280' }}>
                <span>週足トレンド</span>
                <span style={{ fontWeight: 700, color: r.weekly_trend === '上昇' ? '#16a34a' : '#ef4444' }}>{r.weekly_trend}</span>
              </div>
            </div>
            <a
              href={chartUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block',
                marginTop: 10,
                textAlign: 'center',
                backgroundColor: '#2563eb',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '6px 0',
                borderRadius: 6,
                textDecoration: 'none',
              }}
            >
              📈 チャートを確認する →
            </a>
          </div>
        )}
      </div>
    </td>
  );
}

// ─── メインコンポーネント ────────────────────────────────────────

export default function ScreenerPage() {
  const [results, setResults] = useState<ScreenerResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [updatedAt, setUpdatedAt] = useState('');
  const [isPremium, setIsPremium] = useState(false);
  const [activeTab, setActiveTab] = useState<'screen' | 'analyze'>('screen');
  const [filterMkt, setFilterMkt] = useState('すべて');
  const [filterPat, setFilterPat] = useState('すべて');
  const [sortBy, setSortBy] = useState('score');
  const [searchQ, setSearchQ] = useState('');

  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState<ScreenerResult | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  async function runScreening() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/screen`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ApiResponse = await res.json();
      setResults(data.results);
      setIsPremium(data.is_premium);
      setUpdatedAt(data.updated_at ? new Date(data.updated_at).toLocaleString('ja-JP') : '');
    } catch {
      setError('データ取得に失敗しました。しばらく経ってから再試行してください。');
    } finally {
      setLoading(false);
    }
  }

  async function runAnalyze() {
    if (!analyzeInput.trim()) return;
    setAnalyzeLoading(true);
    setAnalyzeError('');
    setAnalyzeResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/analyze/${encodeURIComponent(analyzeInput.trim())}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAnalyzeResult(data.result);
    } catch {
      setAnalyzeError('データを取得できませんでした。銘柄コードを確認してください。');
    } finally {
      setAnalyzeLoading(false);
    }
  }

  // ページ表示時に自動でスクリーニング実行
  useEffect(() => {
    runScreening();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ソートはクライアントサイドで即時反映
  const filtered = results
    .filter(r => filterMkt === 'すべて' || r.market === filterMkt)
    .filter(r => filterPat === 'すべて' || r.pattern === filterPat)
    .filter(r =>
      !searchQ ||
      r.ticker.toLowerCase().includes(searchQ.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQ.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'rsi') return b.rsi - a.rsi;
      if (sortBy === 'vol') return b.vol_5d - a.vol_5d;
      if (sortBy === 'pullback') return a.pullback - b.pullback;
      return 0;
    });

  // 無料：上位5件表示・6〜7件目をblur、プレミアム：上位20件表示
  const FREE_LIMIT = 5;
  const DISPLAY_LIMIT = 7;
  const PREMIUM_LIMIT = 20;
  const displayResults = isPremium ? filtered.slice(0, PREMIUM_LIMIT) : filtered.slice(0, DISPLAY_LIMIT);
  const visibleRows = displayResults.slice(0, FREE_LIMIT);
  const blurredRows = !isPremium ? displayResults.slice(FREE_LIMIT) : [];

  const patterns = ['すべて', ...Array.from(new Set(results.map(r => r.pattern)))];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: "'Noto Sans JP', sans-serif", color: '#111827' }}>

      {/* ヘッダー */}
      <div style={{ background: 'linear-gradient(to right, #0f172a, #1e3a8a)', color: '#fff', padding: '20px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <a href="/" style={{ display: 'inline-block', color: '#94a3b8', fontSize: 13, textDecoration: 'none', marginBottom: 8, fontWeight: 600 }}>← KabuCheck</a>
              <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
                📈 新高値ブレイク スクリーナー
              </h1>
              <p style={{ color: '#94a3b8', fontSize: 13, marginTop: 4, marginBottom: 0 }}>
                ヘッジファンドが使う新高値フィルター｜東証 ＋ 米国株（日米対応）
              </p>
            </div>
            {updatedAt && (
              <div style={{ color: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}>
                最終更新: {updatedAt}
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 16px' }}>

        {/* タブ */}
        <div style={{ display: 'flex', borderBottom: '2px solid #e5e7eb', marginBottom: 24 }}>
          {(['screen', 'analyze'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 20px',
                fontSize: 13,
                fontWeight: 600,
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab ? '2px solid #2563eb' : '2px solid transparent',
                marginBottom: -2,
                color: activeTab === tab ? '#2563eb' : '#6b7280',
                cursor: 'pointer',
              }}
            >
              {tab === 'screen' ? '📊 スクリーニング結果' : '🔍 個別銘柄 詳細分析'}
            </button>
          ))}
        </div>

        {/* ─── スクリーニングタブ ─── */}
        {activeTab === 'screen' && (
          <div>
            {/* 実行ボタン */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
              <button
                onClick={runScreening}
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#93c5fd' : '#2563eb',
                  color: '#fff',
                  fontWeight: 700,
                  padding: '12px 24px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontFamily: 'inherit',
                }}
              >
                {loading ? '⏳ スクリーニング中...' : '🚀 スクリーニング実行'}
              </button>
              {!isPremium && results.length > 0 && (
                <div style={{
                  fontSize: 13,
                  color: '#92400e',
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fcd34d',
                  borderRadius: 8,
                  padding: '8px 16px',
                }}>
                  無料プラン：上位5銘柄を表示中
                </div>
              )}
              {loading && (
                <div style={{ fontSize: 13, color: '#6b7280' }}>
                  約50秒かかります。しばらくお待ちください...
                </div>
              )}
            </div>

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}>
                {error}
              </div>
            )}

            {results.length > 0 && (
              <>
                {/* 統計カード */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                  {([
                    ['通過銘柄', results.length, '#2563eb'],
                    ['🚀 ブレイク中', results.filter(r => r.pattern.includes('ブレイク中')).length, '#16a34a'],
                    ['📉 押し目', results.filter(r => r.pattern.includes('押し目')).length, '#ca8a04'],
                    ['🇯🇵 東証', results.filter(r => r.market === '東証').length, '#2563eb'],
                    ['🇺🇸 米国', results.filter(r => r.market === '米国').length, '#2563eb'],
                  ] as [string, number, string][]).map(([label, val, color]) => (
                    <div key={label} style={{ ...card, padding: 16 }}>
                      <div style={{ fontSize: 11, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color }}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* フィルター */}
                <div style={{ ...card, padding: 16, marginBottom: 16 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
                    <input
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      placeholder="銘柄名 / コードで検索..."
                      style={{
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                        width: 192,
                        outline: 'none',
                        fontFamily: 'inherit',
                      }}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {['すべて', '東証', '米国'].map(m => (
                        <button key={m} onClick={() => setFilterMkt(m)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 11,
                            borderRadius: 8,
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: filterMkt === m ? '#2563eb' : '#f3f4f6',
                            color: filterMkt === m ? '#fff' : '#4b5563',
                            fontFamily: 'inherit',
                          }}>{m}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {patterns.slice(0, 4).map(p => (
                        <button key={p} onClick={() => setFilterPat(p)}
                          style={{
                            padding: '6px 12px',
                            fontSize: 11,
                            borderRadius: 8,
                            fontWeight: 500,
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: filterPat === p ? '#2563eb' : '#f3f4f6',
                            color: filterPat === p ? '#fff' : '#4b5563',
                            fontFamily: 'inherit',
                          }}>{p}</button>
                      ))}
                    </div>
                    {/* ソート選択：onChange で useState が即時更新 → filtered が再計算 */}
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      style={{
                        marginLeft: 'auto',
                        border: '1px solid #d1d5db',
                        borderRadius: 8,
                        padding: '8px 12px',
                        fontSize: 13,
                        outline: 'none',
                        fontFamily: 'inherit',
                        backgroundColor: '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="score">スコア順</option>
                      <option value="rsi">RSI順</option>
                      <option value="vol">出来高比率順</option>
                      <option value="pullback">押し目浅い順</option>
                    </select>
                  </div>
                </div>

                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 8, fontFamily: 'monospace' }}>{filtered.length} 銘柄表示中</div>

                {/* ─── テーブル（blur構造） ─── */}
                <div style={{ ...card, overflowX: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, minWidth: 1000, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                        {['銘柄 / 業種', '市場', 'パターン', 'スコア', '現在値', '52W高値比', 'RSI(14)', '出来高比(5D)', '財務', '楽天'].map(h => (
                          <th key={h} style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontSize: 11,
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                            fontWeight: 600,
                          }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {/* 無料枠：通常表示（TickerCell でホバーUI付き） */}
                      {visibleRows.map(r => (
                        <tr
                          key={r.ticker}
                          style={{ borderBottom: '1px solid #f3f4f6' }}
                          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#eff6ff')}
                          onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <TickerCell r={r} />
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 4,
                              fontWeight: 600,
                              backgroundColor: r.market === '東証' ? '#dcfce7' : '#dbeafe',
                              color: r.market === '東証' ? '#15803d' : '#1d4ed8',
                            }}>{r.market}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor: '#fefce8',
                              border: '1px solid #fef08a',
                              color: '#854d0e',
                              whiteSpace: 'nowrap',
                            }}>
                              {r.pattern}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {/* スコア表示 ＋ ？ツールチップ */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                fontSize: 13,
                                color: r.score >= 80 ? '#9333ea' : r.score >= 65 ? '#2563eb' : '#6b7280',
                              }}>{r.score}</span>
                              <ScoreTooltip />
                              <div style={{ height: 6, backgroundColor: '#e5e7eb', borderRadius: 3, flex: 1, minWidth: 40 }}>
                                <div style={{
                                  height: 6,
                                  borderRadius: 3,
                                  background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                                  width: `${Math.min(100, r.score)}%`,
                                }} />
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 700, fontFamily: 'monospace' }}>{fmtPrice(r)}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>
                              52W高 {r.currency === 'JPY' ? `¥${r.high_52w.toLocaleString()}` : `$${r.high_52w.toFixed(2)}`}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {r.pullback === 0
                              ? <span style={{ color: '#16a34a', fontWeight: 700 }}>AT HIGH</span>
                              : <span style={{ color: '#ca8a04', fontWeight: 600 }}>-{r.pullback}%</span>
                            }
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 4,
                              ...getRsiStyle(r.rsi),
                            }}>
                              {r.rsi}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{
                              fontFamily: 'monospace',
                              fontSize: 11,
                              fontWeight: 600,
                              color: r.vol_5d >= 3 ? '#f97316' : r.vol_5d >= 2 ? '#ca8a04' : '#6b7280',
                            }}>×{r.vol_5d}</div>
                            <div style={{ fontSize: 11, color: '#9ca3af' }}>今日×{r.vol_ratio}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontSize: 11 }}>{r.per ? `PER ${r.per}倍` : '—'}</div>
                            <div style={{
                              fontSize: 11,
                              color: r.earn_growth != null && r.earn_growth > 0 ? '#16a34a' : '#ef4444',
                            }}>
                              {r.earn_growth != null ? `${r.earn_growth > 0 ? '+' : ''}${r.earn_growth}%` : '—'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <a
                              href={getRakutenUrl(r)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                backgroundColor: '#b91c1c',
                                color: '#fff',
                                fontSize: 11,
                                fontWeight: 700,
                                padding: '4px 8px',
                                borderRadius: 4,
                                textDecoration: 'none',
                              }}
                            >
                              楽天
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {/* ─── blur + プレミアムバナー（6位以降） ─── */}
                  {blurredRows.length > 0 && (
                    <div style={premiumOverlayOuter}>
                      {/* blurされたダミー行 */}
                      <table style={{ width: '100%', fontSize: 13, minWidth: 1000, borderCollapse: 'collapse' }}>
                        <tbody>
                          {blurredRows.map(r => (
                            <tr key={r.ticker} style={{ ...blurredRowStyle, borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '12px 16px' }}>
                                <div style={{ fontWeight: 700 }}>{r.flag} {r.name}</div>
                                <div style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.ticker}</div>
                                <div style={{ fontSize: 11 }}>🏭 {r.sector}</div>
                              </td>
                              <td style={{ padding: '12px 16px' }}>{r.market}</td>
                              <td style={{ padding: '12px 16px' }}>{r.pattern}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 900 }}>{r.score}</td>
                              <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontWeight: 700 }}>{fmtPrice(r)}</td>
                              <td style={{ padding: '12px 16px' }}>{r.pullback === 0 ? 'AT HIGH' : `-${r.pullback}%`}</td>
                              <td style={{ padding: '12px 16px' }}>{r.rsi}</td>
                              <td style={{ padding: '12px 16px' }}>×{r.vol_5d}</td>
                              <td style={{ padding: '12px 16px' }}>{r.per ? `PER ${r.per}倍` : '—'}</td>
                              <td style={{ padding: '12px 16px' }}>楽天</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      {/* プレミアム誘導バナー */}
                      <div style={premiumBannerStyle}>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>
                          🔒 残りの銘柄をすべて解除する
                        </div>
                        <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', maxWidth: 340 }}>
                          プレミアムプランで全スクリーニング結果・リアルタイム更新・CSVエクスポートが使い放題
                        </div>
                        <a
                          href="https://buy.stripe.com/placeholder"
                          target="_blank"
                          rel="noopener noreferrer"
                          style={premiumButtonStyle}
                        >
                          💎 プレミアムプランを見る（¥980/月）
                        </a>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>いつでもキャンセル可能</div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {results.length === 0 && !loading && (
              <div style={{
                ...card,
                padding: '48px 16px',
                textAlign: 'center',
                color: '#6b7280',
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
                <div style={{ fontSize: 17, fontWeight: 600, marginBottom: 8 }}>スクリーニングを実行してください</div>
                <div style={{ fontSize: 13 }}>「スクリーニング実行」ボタンを押すと、日米5,000銘柄を自動分析します</div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 8 }}>※ 初回は約50秒かかります</div>
              </div>
            )}
          </div>
        )}

        {/* ─── 個別銘柄分析タブ ─── */}
        {activeTab === 'analyze' && (
          <div>
            <div style={{ ...card, padding: 20, marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 12, marginTop: 0 }}>
                スクリーニング非通過の銘柄も分析できます。日本株は4桁コード（例：7203）、米国株はティッカー（例：AAPL）を入力してください。
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <input
                  value={analyzeInput}
                  onChange={e => setAnalyzeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAnalyze()}
                  placeholder="例: 7203 / 9984 / AAPL / NVDA"
                  style={{
                    flex: 1,
                    border: '1px solid #d1d5db',
                    borderRadius: 8,
                    padding: '12px 16px',
                    fontSize: 13,
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  onClick={runAnalyze}
                  disabled={analyzeLoading}
                  style={{
                    backgroundColor: analyzeLoading ? '#93c5fd' : '#2563eb',
                    color: '#fff',
                    fontWeight: 700,
                    padding: '12px 24px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: analyzeLoading ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    whiteSpace: 'nowrap',
                    fontFamily: 'inherit',
                  }}
                >
                  {analyzeLoading ? '⏳ 分析中...' : '📊 分析する'}
                </button>
              </div>
            </div>

            {analyzeError && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                borderRadius: 8,
                padding: 16,
                marginBottom: 16,
              }}>
                ⚠️ {analyzeError}
              </div>
            )}

            {analyzeResult && (
              <div>
                {/* 銘柄ヘッダー */}
                <div style={{ ...card, padding: 20, marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
                    <span style={{ fontSize: 20, fontWeight: 900, color: '#111827' }}>
                      {analyzeResult.flag} {analyzeResult.name}
                    </span>
                    <span style={{ color: '#2563eb', fontFamily: 'monospace', fontSize: 13 }}>{analyzeResult.ticker}</span>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      fontWeight: 600,
                      backgroundColor: analyzeResult.passed ? '#dcfce7' : '#fefce8',
                      color: analyzeResult.passed ? '#15803d' : '#92400e',
                    }}>
                      {analyzeResult.passed ? '✅ スクリーニング通過' : '📋 参考分析（未通過）'}
                    </span>
                    <span style={{
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 4,
                      backgroundColor: '#fefce8',
                      border: '1px solid #fef08a',
                      color: '#854d0e',
                    }}>
                      {analyzeResult.pattern}
                    </span>
                    <a
                      href={getRakutenUrl(analyzeResult)}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        backgroundColor: '#b91c1c',
                        color: '#fff',
                        fontSize: 11,
                        fontWeight: 700,
                        padding: '6px 12px',
                        borderRadius: 4,
                        textDecoration: 'none',
                      }}
                    >
                      楽天証券で確認
                    </a>
                  </div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    🏭 {analyzeResult.sector}　|　現在値 <b>{fmtPrice(analyzeResult)}</b>　|　{analyzeResult.risk}
                  </div>
                </div>

                {/* スコア */}
                <div style={{ ...card, padding: 20, marginBottom: 16 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>総合スコア</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{
                      fontSize: 48,
                      fontWeight: 900,
                      fontFamily: 'monospace',
                      color: analyzeResult.score >= 80 ? '#9333ea' : analyzeResult.score >= 60 ? '#2563eb' : '#6b7280',
                    }}>{analyzeResult.score}</span>
                    <ScoreTooltip />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 12, backgroundColor: '#e5e7eb', borderRadius: 6 }}>
                        <div style={{
                          height: 12,
                          borderRadius: 6,
                          background: 'linear-gradient(to right, #3b82f6, #a855f7)',
                          width: `${Math.min(100, analyzeResult.score)}%`,
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>60点以上でスクリーニング通過</div>
                    </div>
                  </div>
                </div>

                {/* 指標グリッド */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                  {([
                    ['現在値', fmtPrice(analyzeResult)],
                    ['52W高値比', analyzeResult.pullback === 0 ? 'AT HIGH' : `-${analyzeResult.pullback}%`],
                    ['RSI(14)', `${analyzeResult.rsi}`],
                    ['出来高比(5D)', `×${analyzeResult.vol_5d}`],
                    ['週足トレンド', analyzeResult.weekly_trend],
                    ['ATR(%)', `${analyzeResult.atr}%`],
                    ['20日MA', analyzeResult.currency === 'JPY' ? `¥${analyzeResult.ma20.toLocaleString()}` : `$${analyzeResult.ma20}`],
                    ['50日MA', analyzeResult.currency === 'JPY' ? `¥${analyzeResult.ma50.toLocaleString()}` : `$${analyzeResult.ma50}`],
                  ] as [string, string][]).map(([label, val]) => (
                    <div key={label} style={{ ...card, padding: 16 }}>
                      <div style={{ fontSize: 11, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'monospace', color: '#111827' }}>{val}</div>
                    </div>
                  ))}
                </div>

                <div style={{
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 11,
                  color: '#b45309',
                }}>
                  ⚠️ このツールは情報提供のみを目的としています。投資の最終判断はご自身の責任で行ってください。
                </div>
              </div>
            )}
          </div>
        )}

        {/* 免責事項 */}
        <div style={{ marginTop: 32, fontSize: 11, color: '#9ca3af', textAlign: 'center' }}>
          このツールは情報提供のみを目的としています。投資助言ではありません。
          データはYahoo Financeから取得しており、遅延・誤りが生じる場合があります。
        </div>
      </div>
    </div>
  );
}
