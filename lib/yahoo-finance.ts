import type { CurrentPrice } from "@/types";

// Fetch current price from Yahoo Finance (unofficial, no API key needed)
export async function fetchCurrentPrice(ticker: string): Promise<CurrentPrice | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=1d&interval=1m`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const closes: number[] = result.indicators?.quote?.[0]?.close ?? [];
    const price = closes.filter(Boolean).at(-1);
    if (!price) return null;

    // Previous close for change %
    const prevClose: number = result.meta?.previousClose ?? price;
    const change = parseFloat(((price - prevClose) / prevClose * 100).toFixed(2));

    return { ticker, price: Math.round(price), change, updatedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

export async function fetchPricesForTickers(tickers: string[]): Promise<Record<string, CurrentPrice>> {
  const unique = [...new Set(tickers)];
  const results = await Promise.allSettled(unique.map(t => fetchCurrentPrice(t)));
  const map: Record<string, CurrentPrice> = {};
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value) map[unique[i]] = r.value;
  });
  return map;
}

// Historical price for prediction evaluation
export async function fetchHistoricalPrice(ticker: string, date: string): Promise<number | null> {
  try {
    const d = new Date(date);
    const from = Math.floor(d.getTime() / 1000) - 86400;
    const to   = Math.floor(d.getTime() / 1000) + 86400 * 3;
    const url  = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${from}&period2=${to}&interval=1d`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000), headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return null;
    const data = await res.json();
    const closes: number[] = data?.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    return closes.find(c => c != null) ?? null;
  } catch {
    return null;
  }
}
