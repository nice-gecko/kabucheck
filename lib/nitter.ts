/**
 * Fetches recent posts from RSSHub (X/Twitter and Threads).
 * RSSHub is self-hosted on Vercel and uses auth_token for X access.
 */

import { XMLParser } from "fast-xml-parser";
import type { StockPost } from "@/types";

// Your RSSHub instance URL
const RSSHUB_BASE = process.env.RSSHUB_URL ?? "https://rss-hub-drab-five.vercel.app";

const parser = new XMLParser({ ignoreAttributes: false });

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  author?: string;
}

async function fetchRSS(url: string): Promise<RSSItem[]> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KabuCheck/1.0)" },
    });
    if (!res.ok) {
      console.error(`RSS fetch failed: ${url} → ${res.status}`);
      return [];
    }
    const xml = await res.text();
    const parsed = parser.parse(xml);
    const items: RSSItem[] = parsed?.rss?.channel?.item ?? [];
    return Array.isArray(items) ? items : [items];
  } catch (err) {
    console.error(`RSS fetch error: ${url}`, err);
    return [];
  }
}

// ── Stock prediction extraction ───────────────────────────────────────────────
function extractPrediction(text: string): {
  ticker: string | null;
  company: string | null;
  direction: "up" | "down" | null;
  targetPrice: number | null;
} {
  // Match JP ticker: $7203.T  $6758  ＄7203
  const tickerMatch = text.match(/[$＄](\d{4,5}(?:\.T)?)/);
  const ticker = tickerMatch
    ? tickerMatch[1].replace(/\.T$/, "") + ".T"
    : null;

  // Match price targets: 3,200円  ¥3200  3200円
  const priceMatch = text.match(/[¥￥]?([\d,]+)円/);
  const targetPrice = priceMatch
    ? parseInt(priceMatch[1].replace(/,/g, ""), 10)
    : null;

  // Direction keywords
  const upWords   = ["上昇","買い","目標","強気","高値","到達","上げ","↑","💹","📈","注目","仕込み","ロング"];
  const downWords = ["下落","売り","弱気","安値","下げ","↓","空売り","ショート","調整","売り場"];
  const upScore   = upWords.filter(w => text.includes(w)).length;
  const downScore = downWords.filter(w => text.includes(w)).length;
  const direction = upScore > downScore ? "up" : downScore > upScore ? "down" : null;

  // Rough company name extraction
  const companyMatch = text.match(/[、。\s]([^\s、。]{2,10})[、\s]/);
  const company = companyMatch ? companyMatch[1] : null;

  return { ticker, company, direction, targetPrice };
}

function isStockPost(text: string): boolean {
  const keywords = [
    "#株予想","#株価予想","目標","予想","到達","円へ",
    "買い場","仕込み","上昇予想","下落予想","ショート",
    "注目銘柄","今週の注目","今日の注目","$","＄",
  ];
  return keywords.some(k => text.includes(k));
}

// ── Fetch X (Twitter) user posts via RSSHub ───────────────────────────────────
export async function fetchXUserPosts(
  userId: string,
  handle: string,
  sinceDate: Date
): Promise<StockPost[]> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `${RSSHUB_BASE}/twitter/user/${cleanHandle}`;
  const items = await fetchRSS(url);
  return parseItems(items, userId, sinceDate, "x");
}

// ── Fetch Threads user posts via RSSHub ───────────────────────────────────────
export async function fetchThreadsUserPosts(
  userId: string,
  handle: string,
  sinceDate: Date
): Promise<StockPost[]> {
  const cleanHandle = handle.replace(/^@/, "");
  const url = `${RSSHUB_BASE}/threads/user/${cleanHandle}`;
  const items = await fetchRSS(url);
  return parseItems(items, userId, sinceDate, "threads");
}

// ── Parse RSS items into StockPost ────────────────────────────────────────────
function parseItems(
  items: RSSItem[],
  userId: string,
  sinceDate: Date,
  platform: "x" | "threads"
): StockPost[] {
  const posts: StockPost[] = [];

  for (const item of items.slice(0, 30)) {
    const rawText = (item.title + " " + (item.description ?? ""))
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    const postDate = new Date(item.pubDate);
    if (isNaN(postDate.getTime()) || postDate < sinceDate) continue;
    if (!isStockPost(rawText)) continue;

    const { ticker, company, direction, targetPrice } = extractPrediction(rawText);
    if (!ticker || !direction) continue;

    const predictionDate = postDate.toISOString().split("T")[0];
    const resultDate = new Date(postDate.getTime() + 30 * 864e5)
      .toISOString().split("T")[0];

    const postId = item.link?.split("/").pop() ?? String(Date.now());

    posts.push({
      id: `${userId}_${platform}_${postId}`,
      userId,
      postUrl: item.link,
      rawText: rawText.slice(0, 280),
      date: predictionDate,
      ticker,
      company: company ?? ticker,
      direction,
      targetPrice,
      likes: 0,
      retweets: 0,
      replies: 0,
      isLatest: false,
      predictionDate,
      resultDate,
    });
  }

  // Mark newest as isLatest
  if (posts.length > 0) {
    posts.sort((a, b) => b.date.localeCompare(a.date));
    posts[0].isLatest = true;
  }

  return posts;
}

// ── Fetch all users (X + Threads) ─────────────────────────────────────────────
export async function fetchAllUsers(
  users: Array<{ id: string; handle: string; platform?: string }>,
  sinceDate: Date,
  onProgress?: (done: number, total: number) => void
): Promise<StockPost[]> {
  const all: StockPost[] = [];

  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    let posts: StockPost[] = [];

    if (u.platform === "threads") {
      posts = await fetchThreadsUserPosts(u.id, u.handle, sinceDate);
    } else {
      // default: X
      posts = await fetchXUserPosts(u.id, u.handle, sinceDate);
    }

    all.push(...posts);
    onProgress?.(i + 1, users.length);
  }

  return all;
}
