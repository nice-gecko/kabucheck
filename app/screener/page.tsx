'use client';

import { useState, useEffect } from 'react';

const API_BASE = process.env.NEXT_PUBLIC_SCREENER_API_URL || 'https://screener-api-i6pi.onrender.com';

// ─────────────────────────────────────────────
// 型定義
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// ユーティリティ
// ─────────────────────────────────────────────
function fmtPrice(r: ScreenerResult) {
  return r.currency === 'JPY'
    ? `¥${r.price.toLocaleString()}`
    : `$${r.price.toFixed(2)}`;
}

function getRsiColor(rsi: number) {
  if (rsi >= 70) return 'text-red-500 bg-red-50';
  if (rsi >= 55) return 'text-yellow-600 bg-yellow-50';
  return 'text-green-600 bg-green-50';
}

function getRakutenUrl(r: ScreenerResult) {
  if (r.market === '東証') {
    return `https://www.rakuten-sec.co.jp/web/market/search/ipmenu_stock.html?ID=${r.ticker.replace('.T', '')}`;
  }
  return `https://www.rakuten-sec.co.jp/web/market/search/ipmenu_us_stock.html?ID=${r.ticker}`;
}

// ─────────────────────────────────────────────
// メインページ
// ─────────────────────────────────────────────
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

  // 個別分析
  const [analyzeInput, setAnalyzeInput] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState<ScreenerResult | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  // ─── スクリーニング実行 ───
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
    } catch (e) {
      setError('データ取得に失敗しました。しばらく経ってから再試行してください。');
    } finally {
      setLoading(false);
    }
  }

  // ─── 個別銘柄分析 ───
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
    } catch (e) {
      setAnalyzeError('データを取得できませんでした。銘柄コードを確認してください。');
    } finally {
      setAnalyzeLoading(false);
    }
  }

  // ─── フィルタリング ───
  const filtered = results
    .filter(r => filterMkt === 'すべて' || r.market === filterMkt)
    .filter(r => filterPat === 'すべて' || r.pattern === filterPat)
    .filter(r => !searchQ ||
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

  const patterns = ['すべて', ...Array.from(new Set(results.map(r => r.pattern)))];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-900 text-white px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                📈 新高値ブレイク スクリーナー
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                ヘッジファンドが使う新高値フィルター｜東証 ＋ 米国株（日米対応）
              </p>
            </div>
            {updatedAt && (
              <div className="text-slate-400 text-xs font-mono">
                最終更新: {updatedAt}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* メインタブ */}
        <div className="flex gap-0 border-b-2 border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('screen')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-0.5 transition-colors ${
              activeTab === 'screen'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📊 スクリーニング結果
          </button>
          <button
            onClick={() => setActiveTab('analyze')}
            className={`px-5 py-3 text-sm font-semibold border-b-2 -mb-0.5 transition-colors ${
              activeTab === 'analyze'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            🔍 個別銘柄 詳細分析
          </button>
        </div>

        {/* ─── スクリーニング結果タブ ─── */}
        {activeTab === 'screen' && (
          <div>
            {/* 実行ボタン */}
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <button
                onClick={runScreening}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-6 py-3 rounded-lg transition-colors flex items-center gap-2"
              >
                {loading ? '⏳ スクリーニング中...' : '🚀 スクリーニング実行'}
              </button>
              {!isPremium && results.length > 0 && (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  無料プラン：上位5銘柄を表示中
                </div>
              )}
              {loading && (
                <div className="text-sm text-gray-500">
                  5〜10分かかります。しばらくお待ちください...
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
                {error}
              </div>
            )}

            {results.length > 0 && (
              <>
                {/* 統計カード */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
                  {[
                    ['通過銘柄', results.length, 'text-blue-600'],
                    ['🚀 ブレイク中', results.filter(r => r.pattern.includes('ブレイク中')).length, 'text-green-600'],
                    ['📉 押し目', results.filter(r => r.pattern.includes('押し目')).length, 'text-yellow-600'],
                    ['🇯🇵 東証', results.filter(r => r.market === '東証').length, 'text-blue-600'],
                    ['🇺🇸 米国', results.filter(r => r.market === '米国').length, 'text-blue-600'],
                  ].map(([label, val, color]) => (
                    <div key={label as string} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
                      <div className={`text-2xl font-black font-mono ${color}`}>{val}</div>
                    </div>
                  ))}
                </div>

                {/* フィルター */}
                <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-sm">
                  <div className="flex flex-wrap gap-3 items-center">
                    <input
                      value={searchQ}
                      onChange={e => setSearchQ(e.target.value)}
                      placeholder="銘柄名 / コードで検索..."
                      className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex gap-1">
                      {['すべて', '東証', '米国'].map(m => (
                        <button key={m} onClick={() => setFilterMkt(m)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                            filterMkt === m ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>{m}</button>
                      ))}
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {patterns.slice(0, 4).map(p => (
                        <button key={p} onClick={() => setFilterPat(p)}
                          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                            filterPat === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}>{p}</button>
                      ))}
                    </div>
                    <select
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="ml-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
                    >
                      <option value="score">スコア順</option>
                      <option value="rsi">RSI順</option>
                      <option value="vol">出来高比率順</option>
                      <option value="pullback">押し目浅い順</option>
                    </select>
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-2 font-mono">{filtered.length} 銘柄表示中</div>

                {/* テーブル */}
                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                  <table className="w-full text-sm min-w-[1000px]">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        {['銘柄 / 業種', '市場', 'パターン', 'スコア', '現在値', '52W高値比', 'RSI(14)', '出来高比(5D)', '財務', '楽天'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((r, i) => (
                        <tr key={r.ticker} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-gray-900">{r.flag} {r.name}</div>
                            <div className="text-xs text-blue-600 font-mono">{r.ticker}</div>
                            <div className="text-xs text-gray-400">🏭 {r.sector}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded font-semibold ${
                              r.market === '東証' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>{r.market}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs px-2 py-1 rounded bg-yellow-50 border border-yellow-200 text-yellow-800 whitespace-nowrap">
                              {r.pattern}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`font-black font-mono text-sm ${
                                r.score >= 80 ? 'text-purple-600' : r.score >= 65 ? 'text-blue-600' : 'text-gray-500'
                              }`}>{r.score}</span>
                              <div className="h-1.5 bg-gray-200 rounded flex-1 min-w-[40px]">
                                <div
                                  className="h-1.5 rounded bg-gradient-to-r from-blue-500 to-purple-500"
                                  style={{ width: `${Math.min(100, r.score)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-bold font-mono">{fmtPrice(r)}</div>
                            <div className="text-xs text-gray-400">
                              52W高 {r.currency === 'JPY' ? `¥${r.high_52w.toLocaleString()}` : `$${r.high_52w.toFixed(2)}`}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {r.pullback === 0
                              ? <span className="text-green-600 font-bold">AT HIGH</span>
                              : <span className="text-yellow-600 font-semibold">-{r.pullback}%</span>
                            }
                          </td>
                          <td className="px-4 py-3">
                            <span className={`font-mono font-bold text-xs px-2 py-1 rounded ${getRsiColor(r.rsi)}`}>
                              {r.rsi}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className={`font-mono text-xs font-semibold ${
                              r.vol_5d >= 3 ? 'text-orange-500' : r.vol_5d >= 2 ? 'text-yellow-600' : 'text-gray-500'
                            }`}>×{r.vol_5d}</div>
                            <div className="text-xs text-gray-400">今日×{r.vol_ratio}</div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-xs">{r.per ? `PER ${r.per}倍` : '—'}</div>
                            <div className={`text-xs ${r.earn_growth && r.earn_growth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                              {r.earn_growth != null ? `${r.earn_growth > 0 ? '+' : ''}${r.earn_growth}%` : '—'}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <a
                              href={getRakutenUrl(r)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-2 py-1 rounded"
                            >
                              楽天
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {results.length === 0 && !loading && (
              <div className="bg-white border border-gray-200 rounded-xl p-12 text-center text-gray-500 shadow-sm">
                <div className="text-4xl mb-3">📊</div>
                <div className="text-lg font-semibold mb-2">スクリーニングを実行してください</div>
                <div className="text-sm">「スクリーニング実行」ボタンを押すと、日米5,000銘柄を自動分析します</div>
                <div className="text-xs text-gray-400 mt-2">※ 初回は5〜10分かかります</div>
              </div>
            )}
          </div>
        )}

        {/* ─── 個別銘柄分析タブ ─── */}
        {activeTab === 'analyze' && (
          <div>
            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5 shadow-sm">
              <p className="text-sm text-gray-500 mb-3">
                スクリーニング非通過の銘柄も分析できます。日本株は4桁コード（例：7203）、米国株はティッカー（例：AAPL）を入力してください。
              </p>
              <div className="flex gap-3">
                <input
                  value={analyzeInput}
                  onChange={e => setAnalyzeInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && runAnalyze()}
                  placeholder="例: 7203 / 9984 / AAPL / NVDA"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={runAnalyze}
                  disabled={analyzeLoading}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold px-6 py-3 rounded-lg transition-colors whitespace-nowrap"
                >
                  {analyzeLoading ? '⏳ 分析中...' : '📊 分析する'}
                </button>
              </div>
            </div>

            {analyzeError && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 mb-4">
                ⚠️ {analyzeError}
              </div>
            )}

            {analyzeResult && (
              <div>
                {/* 銘柄ヘッダー */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <span className="text-xl font-black text-gray-900">
                      {analyzeResult.flag} {analyzeResult.name}
                    </span>
                    <span className="text-blue-600 font-mono text-sm">{analyzeResult.ticker}</span>
                    <span className={`text-xs px-2 py-1 rounded font-semibold ${
                      analyzeResult.passed
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {analyzeResult.passed ? '✅ スクリーニング通過' : '📋 参考分析（未通過）'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded bg-yellow-50 border border-yellow-200 text-yellow-800">
                      {analyzeResult.pattern}
                    </span>
                    <a href={getRakutenUrl(analyzeResult)} target="_blank" rel="noopener noreferrer"
                      className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold px-3 py-1.5 rounded">
                      楽天証券で確認
                    </a>
                  </div>
                  <div className="text-sm text-gray-500">
                    🏭 {analyzeResult.sector}　|　現在値 <b>{fmtPrice(analyzeResult)}</b>　|　{analyzeResult.risk}
                  </div>
                </div>

                {/* スコア */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 mb-4 shadow-sm">
                  <div className="text-xs text-gray-400 uppercase tracking-wide mb-2">総合スコア</div>
                  <div className="flex items-center gap-4">
                    <span className={`text-5xl font-black font-mono ${
                      analyzeResult.score >= 80 ? 'text-purple-600' : analyzeResult.score >= 60 ? 'text-blue-600' : 'text-gray-500'
                    }`}>{analyzeResult.score}</span>
                    <div className="flex-1">
                      <div className="h-3 bg-gray-200 rounded-full">
                        <div
                          className="h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"
                          style={{ width: `${Math.min(100, analyzeResult.score)}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mt-1">60点以上でスクリーニング通過</div>
                    </div>
                  </div>
                </div>

                {/* 指標グリッド */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    ['現在値', fmtPrice(analyzeResult)],
                    ['52W高値比', analyzeResult.pullback === 0 ? 'AT HIGH' : `-${analyzeResult.pullback}%`],
                    ['RSI(14)', `${analyzeResult.rsi}`],
                    ['出来高比(5D)', `×${analyzeResult.vol_5d}`],
                    ['週足トレンド', analyzeResult.weekly_trend],
                    ['ATR(%)', `${analyzeResult.atr}%`],
                    ['20日MA', analyzeResult.currency === 'JPY' ? `¥${analyzeResult.ma20.toLocaleString()}` : `$${analyzeResult.ma20}`],
                    ['50日MA', analyzeResult.currency === 'JPY' ? `¥${analyzeResult.ma50.toLocaleString()}` : `$${analyzeResult.ma50}`],
                  ].map(([label, val]) => (
                    <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">{label}</div>
                      <div className="text-base font-bold font-mono text-gray-900">{val}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-700">
                  ⚠️ このツールは情報提供のみを目的としています。投資の最終判断はご自身の責任で行ってください。
                </div>
              </div>
            )}
          </div>
        )}

        {/* 免責事項 */}
        <div className="mt-8 text-xs text-gray-400 text-center">
          このツールは情報提供のみを目的としています。投資助言ではありません。
          データはYahoo Financeから取得しており、遅延・誤りが生じる場合があります。
        </div>
      </div>
    </div>
  );
}
