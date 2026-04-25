// ── Core types ────────────────────────────────────────────────────────────────

export interface XUser {
  id: string;
  handle: string;
  name: string;
  followers: number;
  avatarColor: string;
  addedAt: string;
  isActive: boolean;
  prevRank?: number;
  platform?: "x" | "threads";  // default: x
}

export interface StockPost {
  id: string;
  userId: string;
  postUrl: string;
  rawText: string;
  date: string;            // ISO date of post
  ticker: string;          // e.g. "7203.T"
  company: string;
  direction: "up" | "down";
  targetPrice: number | null;
  likes: number;
  retweets: number;
  replies: number;
  isLatest: boolean;
  predictionDate: string;
  resultDate: string;      // 30 days after prediction
}

export interface PredictionResult {
  postId: string;
  result: "hit" | "miss" | "pending";
  startPrice: number | null;
  endPrice: number | null;
  changePct: string | null;
}

export interface RankedUser extends XUser {
  rank: number;
  prevRank: number | null;
  rankChange: number | null;  // positive = moved up
  engScore: number;
  hitRate: number | null;
  hitCount: number;
  totalCount: number;
  posts: StockPost[];
  latestPost: StockPost | null;
}

export interface AppState {
  users: XUser[];                    // All candidate users
  posts: StockPost[];                // All fetched posts
  ranking: RankedUser[];             // Current top-20
  lastUpdated: string | null;        // ISO datetime
  isUpdating: boolean;
}

export interface CurrentPrice {
  ticker: string;
  price: number;
  change: number;
  updatedAt: string;
}

export interface AIAnalysis {
  summary: string;
  buyZone: string;
  timing: string;
  risk: string;
  confidence: "high" | "medium" | "low";
}
