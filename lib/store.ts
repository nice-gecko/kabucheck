/**
 * Simple in-memory store.
 * On Vercel, each serverless function gets its own instance so state resets
 * on cold starts. For production swap this with Vercel KV / PlanetScale / Supabase.
 * The structure is designed so swapping is a one-file change.
 */

import type { XUser, StockPost, RankedUser, CurrentPrice, AIAnalysis } from "@/types";

// ── Initial candidate users (editable from admin UI) ──────────────────────────
const defaultUsers: XUser[] = [
  { id:"u1",  handle:"kabu_master_jp",      name:"株マスター",          followers:84200, avatarColor:"#3b7dd8", addedAt:"2025-01-01", isActive:true },
  { id:"u2",  handle:"nikkei_analyst",       name:"日経アナリスト",      followers:61500, avatarColor:"#1e9e6a", addedAt:"2025-01-01", isActive:true },
  { id:"u3",  handle:"toushi_sensei",        name:"投資先生",            followers:52300, avatarColor:"#7c3aed", addedAt:"2025-01-01", isActive:true },
  { id:"u4",  handle:"bulls_market99",       name:"BullsMarket",        followers:38700, avatarColor:"#d97706", addedAt:"2025-01-01", isActive:true },
  { id:"u5",  handle:"yuriko_invest",        name:"ゆりこ@主婦投資家",  followers:29100, avatarColor:"#e11d7a", addedAt:"2025-01-01", isActive:true },
  { id:"u6",  handle:"short_hunter_fx",      name:"ショートハンター",    followers:24600, avatarColor:"#dc2626", addedAt:"2025-01-01", isActive:true },
  { id:"u7",  handle:"ai_kabu_bot",          name:"AI株分析bot",         followers:19800, avatarColor:"#0891b2", addedAt:"2025-01-01", isActive:true },
  { id:"u8",  handle:"value_trap_jp",        name:"バリュートラップ",    followers:16200, avatarColor:"#16a34a", addedAt:"2025-01-01", isActive:true },
  { id:"u9",  handle:"makoto_kabu",          name:"マコト株道場",        followers:12400, avatarColor:"#7c3aed", addedAt:"2025-01-01", isActive:true },
  { id:"u10", handle:"growth_seeker",        name:"グロース株ハンター",  followers:9800,  avatarColor:"#db2777", addedAt:"2025-01-01", isActive:true },
  { id:"u11", handle:"pension_trader",       name:"年金運用マン",        followers:31800, avatarColor:"#475569", addedAt:"2025-01-01", isActive:true },
  { id:"u12", handle:"semiconductor_w",      name:"半導体ウォッチャー",  followers:27400, avatarColor:"#0f766e", addedAt:"2025-01-01", isActive:true },
  { id:"u13", handle:"dividend_queen",       name:"配当女王",            followers:22100, avatarColor:"#be185d", addedAt:"2025-01-01", isActive:true },
  { id:"u14", handle:"intraday_king",        name:"デイトレ王",          followers:18600, avatarColor:"#b45309", addedAt:"2025-01-01", isActive:true },
  { id:"u15", handle:"macro_bear_jp",        name:"マクロベア",          followers:15300, avatarColor:"#991b1b", addedAt:"2025-01-01", isActive:true },
  { id:"u16", handle:"esg_investor_jp",      name:"ESG投資家",           followers:11700, avatarColor:"#15803d", addedAt:"2025-01-01", isActive:true },
  { id:"u17", handle:"real_estate_eye",      name:"不動産眼",            followers:8900,  avatarColor:"#0369a1", addedAt:"2025-01-01", isActive:true },
  { id:"u18", handle:"fx_and_stocks",        name:"FX兼業トレーダー",    followers:7200,  avatarColor:"#7e22ce", addedAt:"2025-01-01", isActive:true },
  { id:"u19", handle:"tenbagger_hunter",     name:"10倍株ハンター",      followers:6100,  avatarColor:"#c2410c", addedAt:"2025-01-01", isActive:true },
  { id:"u20", handle:"quiet_compounder",     name:"静かな複利家",        followers:4800,  avatarColor:"#334155", addedAt:"2025-01-01", isActive:true },
  // Extra candidates (not in top-20 initially)
  { id:"u21", handle:"kabu_rookie2025",      name:"株初心者2025",        followers:3200,  avatarColor:"#0ea5e9", addedAt:"2025-01-01", isActive:false },
  { id:"u22", handle:"nisa_hajime",          name:"NISA始めました",      followers:2800,  avatarColor:"#84cc16", addedAt:"2025-01-01", isActive:false },
  { id:"u23", handle:"options_master_jp",    name:"オプション職人",      followers:41000, avatarColor:"#f43f5e", addedAt:"2025-01-01", isActive:false },
  { id:"u24", handle:"etf_collector",        name:"ETFコレクター",       followers:18000, avatarColor:"#14b8a6", addedAt:"2025-01-01", isActive:false },
];

// ── Global store (module-level singleton) ─────────────────────────────────────
interface Store {
  users: XUser[];
  posts: StockPost[];
  ranking: RankedUser[];
  lastUpdated: string | null;
  isUpdating: boolean;
  prices: Record<string, CurrentPrice>;
  aiCache: Record<string, AIAnalysis>;  // postId → analysis
}

const store: Store = {
  users: defaultUsers,
  posts: [],
  ranking: [],
  lastUpdated: null,
  isUpdating: false,
  prices: {},
  aiCache: {},
};

// ── User CRUD ─────────────────────────────────────────────────────────────────
export function getUsers(): XUser[] { return store.users; }

export function addUser(user: Omit<XUser, "id" | "addedAt">): XUser {
  const newUser: XUser = {
    ...user,
    id: `u${Date.now()}`,
    addedAt: new Date().toISOString(),
  };
  store.users.push(newUser);
  return newUser;
}

export function removeUser(id: string): void {
  store.users = store.users.filter(u => u.id !== id);
  store.posts = store.posts.filter(p => p.userId !== id);
}

export function updateUser(id: string, patch: Partial<XUser>): void {
  store.users = store.users.map(u => u.id === id ? { ...u, ...patch } : u);
}

// ── Posts ─────────────────────────────────────────────────────────────────────
export function getPosts(): StockPost[] { return store.posts; }

export function upsertPosts(incoming: StockPost[]): void {
  const existing = new Set(store.posts.map(p => p.id));
  for (const p of incoming) {
    if (!existing.has(p.id)) store.posts.push(p);
  }
}

export function getPostsByUser(userId: string): StockPost[] {
  return store.posts.filter(p => p.userId === userId);
}

// ── Ranking ───────────────────────────────────────────────────────────────────
export function getRanking(): RankedUser[] { return store.ranking; }

export function setRanking(ranked: RankedUser[]): void {
  // Save prevRank before overwriting
  const oldRankMap = new Map(store.ranking.map(u => [u.id, u.rank]));
  store.ranking = ranked.map(u => ({
    ...u,
    prevRank: oldRankMap.get(u.id) ?? null,
    rankChange: oldRankMap.has(u.id) ? (oldRankMap.get(u.id)! - u.rank) : null,
  }));
  store.lastUpdated = new Date().toISOString();
}

export function getLastUpdated(): string | null { return store.lastUpdated; }
export function getIsUpdating(): boolean { return store.isUpdating; }
export function setIsUpdating(v: boolean): void { store.isUpdating = v; }

// ── Prices ────────────────────────────────────────────────────────────────────
export function getPrice(ticker: string): CurrentPrice | null {
  return store.prices[ticker] ?? null;
}
export function setPrices(prices: Record<string, CurrentPrice>): void {
  store.prices = { ...store.prices, ...prices };
}

// ── AI cache ──────────────────────────────────────────────────────────────────
export function getAICache(postId: string): AIAnalysis | null {
  return store.aiCache[postId] ?? null;
}
export function setAICache(postId: string, analysis: AIAnalysis): void {
  store.aiCache[postId] = analysis;
}
