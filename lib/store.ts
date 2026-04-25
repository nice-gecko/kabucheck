/**
 * Simple in-memory store.
 * On Vercel, each serverless function gets its own instance so state resets
 * on cold starts. For production swap this with Vercel KV / PlanetScale / Supabase.
 * The structure is designed so swapping is a one-file change.
 */

import type { XUser, StockPost, RankedUser, CurrentPrice, AIAnalysis } from "@/types";

// ── Initial candidate users (editable from admin UI) ──────────────────────────
const defaultUsers: XUser[] = [
  { id:"u1",  handle:"tesuta001",           name:"テスタ",              followers:900000, avatarColor:"#3b7dd8", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u2",  handle:"imuvill",             name:"井村俊哉",            followers:180000, avatarColor:"#1e9e6a", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u3",  handle:"buffett_taro",        name:"バフェット太郎",      followers:360000, avatarColor:"#7c3aed", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u4",  handle:"kabu_master_jp",      name:"株マスター",          followers:84200,  avatarColor:"#d97706", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u5",  handle:"nikkei_analyst",      name:"日経アナリスト",      followers:61500,  avatarColor:"#e11d7a", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u6",  handle:"short_hunter_fx",     name:"ショートハンター",    followers:24600,  avatarColor:"#dc2626", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u7",  handle:"dividend_queen",      name:"配当女王",            followers:22100,  avatarColor:"#0891b2", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u8",  handle:"semiconductor_w",     name:"半導体ウォッチャー",  followers:27400,  avatarColor:"#16a34a", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u9",  handle:"pension_trader",      name:"年金運用マン",        followers:31800,  avatarColor:"#7c3aed", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u10", handle:"growth_seeker",       name:"グロース株ハンター",  followers:9800,   avatarColor:"#db2777", addedAt:"2026-01-01", isActive:true,  platform:"x" },
  { id:"u11", handle:"value_trap_jp",       name:"バリュートラップ",    followers:16200,  avatarColor:"#475569", addedAt:"2026-01-01", isActive:false, platform:"x" },
  { id:"u12", handle:"macro_bear_jp",       name:"マクロベア",          followers:15300,  avatarColor:"#0f766e", addedAt:"2026-01-01", isActive:false, platform:"x" },
  { id:"u13", handle:"esg_investor_jp",     name:"ESG投資家",           followers:11700,  avatarColor:"#be185d", addedAt:"2026-01-01", isActive:false, platform:"x" },
  { id:"u14", handle:"intraday_king",       name:"デイトレ王",          followers:18600,  avatarColor:"#b45309", addedAt:"2026-01-01", isActive:false, platform:"x" },
  { id:"u15", handle:"quiet_compounder",    name:"静かな複利家",        followers:4800,   avatarColor:"#991b1b", addedAt:"2026-01-01", isActive:false, platform:"x" },
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
