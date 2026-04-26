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

// ── Company name → ticker mapping ────────────────────────────────────────────
const COMPANY_TO_TICKER: Record<string, string> = {
  "トヨタ":"7203.T","トヨタ自動車":"7203.T",
  "ソニー":"6758.T","ソニーグループ":"6758.T",
  "任天堂":"7974.T",
  "ソフトバンクG":"9984.T","ソフトバンクグループ":"9984.T",
  "キーエンス":"6861.T",
  "ファナック":"6954.T",
  "三菱UFJ":"8306.T","三菱UFJフィナンシャル":"8306.T",
  "みずほ":"8411.T","みずほFG":"8411.T",
  "三井住友":"8316.T","三井住友FG":"8316.T",
  "信越化学":"4063.T",
  "レーザーテック":"6920.T",
  "アドバンテスト":"6857.T",
  "ディスコ":"6146.T",
  "東京エレクトロン":"8035.T",
  "ルネサス":"6723.T",
  "村田製作所":"6981.T",
  "日立":"6501.T",
  "NTT":"9432.T",
  "KDDI":"9433.T",
  "リクルート":"6098.T",
  "メルカリ":"4385.T",
  "ファーストリテイリング":"9983.T","ユニクロ":"9983.T",
  "三菱商事":"8058.T",
  "三井物産":"8031.T",
  "武田薬品":"4502.T",
  "JT":"2914.T","日本たばこ":"2914.T",
  "ホンダ":"7267.T","本田技研":"7267.T",
  "デンソー":"6902.T",
  "ダイキン":"6367.T",
  "キヤノン":"7751.T",
  "ブリヂストン":"5108.T",
  "SUBARU":"7270.T",
  "JR東日本":"9020.T",
  "JR東海":"9022.T",
  "住友不動産":"8830.T",
  "三菱地所":"8802.T",
  "LINEヤフー":"4689.T",
  "サイバーエージェント":"4751.T",
  "エムスリー":"2413.T",
};

// ── Stock prediction extraction ───────────────────────────────────────────────
function extractPrediction(text: string): {
  ticker: string | null;
  company: string | null;
  direction: "up" | "down" | null;
  targetPrice: number | null;
} {
  // Match JP ticker: $7203.T  $6758  ＄7203
  const tickerMatch = text.match(/[$＄](\d{4,5}(?:\.T)?)/);
  let ticker = tickerMatch
    ? tickerMatch[1].replace(/\.T$/, "") + ".T"
    : null;

  // If no ticker code found, try to match from company name
  let company: string | null = null;
  if (!ticker) {
    for (const [name, code] of Object.entries(COMPANY_TO_TICKER)) {
      if (text.includes(name)) {
        ticker = code;
        company = name;
        break;
      }
    }
  }

  // Also try plain 4-digit code (e.g. "6857が...")
  if (!ticker) {
    const codeMatch = text.match(/\b(\d{4})(?:\.T)?\b/);
    if (codeMatch) ticker = codeMatch[1] + ".T";
  }

  // Match price targets: 3,200円  ¥3200  3200円
  const priceMatch = text.match(/[¥￥]?([\d,]+)円/);
  const targetPrice = priceMatch
    ? parseInt(priceMatch[1].replace(/,/g, ""), 10)
    : null;

  // Direction keywords
  const upWords   = ["上昇","買い","目標","強気","高値","到達","上げ","↑","💹","📈","注目","仕込み","ロング","期待"];
  const downWords = ["下落","売り","弱気","安値","下げ","↓","空売り","ショート","調整","売り場","警戒"];
  const upScore   = upWords.filter(w => text.includes(w)).length;
  const downScore = downWords.filter(w => text.includes(w)).length;
  const direction = upScore > downScore ? "up" : downScore > upScore ? "down" : null;

  // Company name from context if not already found
  if (!company && ticker) {
    const found = Object.entries(COMPANY_TO_TICKER).find(([, t]) => t === ticker);
    company = found ? found[0] : null;
  }

  return { ticker, company, direction, targetPrice };
}

// 主要銘柄名リスト（銘柄名でも検出できるように）
const KNOWN_STOCKS = [
  "トヨタ","ソニー","任天堂","ソフトバンク","キーエンス","ファナック",
  "三菱UFJ","みずほ","三井住友","住友商事","三菱商事","伊藤忠",
  "信越化学","レーザーテック","アドバンテスト","ディスコ","東京エレクトロン",
  "ルネサス","村田製作所","TDK","日本電産","オムロン","ダイキン",
  "日立","富士通","NEC","パナソニック","シャープ","京セラ",
  "NTT","KDDI","ドコモ","楽天","メルカリ","サイバーエージェント",
  "リクルート","エムスリー","塩野義","武田薬品","第一三共","アステラス",
  "ファーストリテイリング","ユニクロ","イオン","セブン","ローソン",
  "トヨタ自動車","ホンダ","日産","スバル","マツダ","スズキ","デンソー",
  "JR東日本","JR東海","JR西日本","ANAホールディングス","日本航空",
  "三井不動産","住友不動産","三菱地所","野村","大和証券","SBI",
  "ソフトバンクG","ARM","Zホールディングス","LINEヤフー",
  "キャノン","リコー","コニカミノルタ","ブラザー工業",
  "JT","花王","資生堂","コーセー","ライオン",
  "日本製鉄","神戸製鋼","JFE","住友電工","古河電工",
  "コマツ","クボタ","日立建機","三菱重工","川崎重工","IHI",
  "AGC","旭化成","東レ","帝人","クラレ","住友化学",
  "ENEOSホールディングス","出光興産","コスモエネルギー",
  "オリエンタルランド","リゾートトラスト","エイチ・アイ・エス",
];

function isStockPost(text: string): boolean {
  // 必須条件①：銘柄コードが含まれている（$7203.T, ＄6758 など）
  const hasTickerCode = /[$＄]\d{4,5}/.test(text);
  if (hasTickerCode) return true;

  // 必須条件②：4桁の証券コードが含まれている（6857, 7203 など）
  const hasStockCode = /\b\d{4}(?:\.T)?\b/.test(text) &&
    (text.includes("円") || text.includes("株") || text.includes("銘柄") ||
     text.includes("注目") || text.includes("買い") || text.includes("売り"));
  if (hasStockCode) return true;

  // 必須条件③：既知の銘柄名が含まれている + 株関連キーワード
  const hasKnownStock = KNOWN_STOCKS.some(s => text.includes(s));
  const hasStockKeyword = [
    "注目","買い場","仕込み","上昇","下落","目標株価",
    "今週","今日","強気","弱気","ショート","ロング",
    "決算","増益","減益","上方修正","下方修正",
  ].some(k => text.includes(k));

  return hasKnownStock && hasStockKeyword;
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
