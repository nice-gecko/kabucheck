/**
 * Fetches recent posts from Nitter RSS feeds.
 * Falls back through multiple instances if one is down.
 */

import { XMLParser } from "fast-xml-parser";
import type { StockPost } from "@/types";

// Public Nitter instances — ordered by reliability
const INSTANCES = [
  "https://nitter.privacydev.net",
  "https://nitter.poast.org",
  "https://nitter.adminforge.de",
  "https://nitter.woodland.cafe",
];

const parser = new XMLParser({ ignoreAttributes: false });

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  "dc:creator"?: string;
}

async function fetchRSS(handle: string): Promise<RSSItem[]> {
  for (const instance of INSTANCES) {
    try {
      const url = `${instance}/${handle}/rss`;
      const res = await fetch(url, {
        signal: AbortSignal.timeout(6000),
        headers: { "User-Agent": "Mozilla/5.0 (compatible; KabuCheck/1.0)" },
      });
      if (!res.ok) continue;
      const xml = await res.text();
      const parsed = parser.parse(xml);
      const items: RSSItem[] = parsed?.rss?.channel?.item ?? [];
      return Array.isArray(items) ? items : [items];
    } catch {
      // try next instance
    }
  }
  return [];
}

// ── Extract stock prediction from post text ───────────────────────────────────
// Looks for Japanese stock tickers, price targets, and direction keywords.
function extractPrediction(text: string): {
  ticker: string | null;
  company: string | null;
  direction: "up" | "down" | null;
  targetPrice: number | null;
} {
  // Match JP ticker patterns: $7203.T  $6758  ＄7203.T
  const tickerMatch = text.match(/[$＄](\d{4,5}(?:\.T)?)/);
  const ticker = tickerMatch ? tickerMatch[1].replace(".T", "") + ".T" : null;

  // Match price targets: 3,200円  ¥3200  3200円
  const priceMatch = text.match(/[¥￥]?([\d,]+)円/);
  const targetPrice = priceMatch
    ? parseInt(priceMatch[1].replace(/,/g, ""), 10)
    : null;

  // Direction keywords
  const upWords = ["上昇", "買い", "目標", "強気", "高値", "到達", "上げ", "↑", "💹", "📈"];
  const downWords = ["下落", "売り", "弱気", "安値", "下げ", "↓", "空売り", "ショート", "調整"];
  const upScore = upWords.filter(w => text.includes(w)).length;
  const downScore = downWords.filter(w => text.includes(w)).length;
  const direction =
    upScore > downScore ? "up" : downScore > upScore ? "down" : null;

  // Very rough company name extraction (after $ ticker mention)
  const companyMatch = text.match(/[、。\s]([^\s、。]{2,10})[、\s]/);
  const company = companyMatch ? companyMatch[1] : null;

  return { ticker, company, direction, targetPrice };
}

function isStockPredictionPost(text: string): boolean {
  const keywords = [
    "#株予想", "#株価予想", "目標", "予想", "到達", "円へ",
    "買い場", "仕込み", "上昇予想", "下落予想", "ショート",
  ];
  return keywords.some(k => text.includes(k));
}

// ── Main export ───────────────────────────────────────────────────────────────
export async function fetchUserPosts(
  userId: string,
  handle: string,
  sinceDate: Date
): Promise<StockPost[]> {
  const items = await fetchRSS(handle);
  const posts: StockPost[] = [];

  for (const item of items.slice(0, 30)) {
    const rawText = item.title + " " + (item.description ?? "");
    const cleanText = rawText.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const postDate = new Date(item.pubDate);

    if (postDate < sinceDate) continue;
    if (!isStockPredictionPost(cleanText)) continue;

    const { ticker, company, direction, targetPrice } = extractPrediction(cleanText);
    if (!ticker || !direction) continue;

    const predictionDate = postDate.toISOString().split("T")[0];
    const resultDate = new Date(postDate.getTime() + 30 * 864e5)
      .toISOString()
      .split("T")[0];

    posts.push({
      id: `${userId}_${item.link.split("/").pop() ?? Date.now()}`,
      userId,
      postUrl: item.link,
      rawText: cleanText.slice(0, 280),
      date: predictionDate,
      ticker,
      company: company ?? ticker,
      direction,
      targetPrice,
      likes: 0,      // Nitter RSS doesn't expose engagement metrics
      retweets: 0,
      replies: 0,
      isLatest: false,  // will be set after sorting
      predictionDate,
      resultDate,
    });
  }

  // Mark newest post as isLatest
  if (posts.length > 0) {
    posts.sort((a, b) => b.date.localeCompare(a.date));
    posts[0].isLatest = true;
  }

  return posts;
}

export async function fetchAllUsers(
  users: Array<{ id: string; handle: string }>,
  sinceDate: Date,
  onProgress?: (done: number, total: number) => void
): Promise<StockPost[]> {
  const all: StockPost[] = [];
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    const posts = await fetchUserPosts(u.id, u.handle, sinceDate);
    all.push(...posts);
    onProgress?.(i + 1, users.length);
  }
  return all;
}
