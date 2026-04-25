import type { XUser, StockPost, RankedUser, PredictionResult } from "@/types";

// ── Engagement score ──────────────────────────────────────────────────────────
// Nitter RSS doesn't expose likes/RT so we weight followers heavily.
// When real engagement data is available (via future API), just pass it through.
export function calcEngScore(user: XUser, posts: StockPost[]): number {
  const engFromPosts = posts.reduce(
    (s, p) => s + p.likes * 1 + p.retweets * 2 + p.replies * 1.5,
    0
  );
  const followerScore = Math.log10(user.followers + 1) * 1000;
  return Math.round(engFromPosts + followerScore);
}

// ── Prediction evaluation ─────────────────────────────────────────────────────
export function evaluatePrediction(
  post: StockPost,
  priceMap: Record<string, number>   // ticker → price at resultDate
): PredictionResult {
  const startPrice = priceMap[`${post.ticker}_${post.predictionDate}`] ?? null;
  const endPrice   = priceMap[`${post.ticker}_${post.resultDate}`] ?? null;

  if (!startPrice || !endPrice) {
    return { postId: post.id, result: "pending", startPrice, endPrice, changePct: null };
  }

  const actualDir = endPrice > startPrice ? "up" : "down";
  const changePct = ((endPrice - startPrice) / startPrice * 100).toFixed(2);
  return {
    postId: post.id,
    result: actualDir === post.direction ? "hit" : "miss",
    startPrice, endPrice, changePct,
  };
}

// ── Hit rate ──────────────────────────────────────────────────────────────────
export function calcHitRate(
  posts: StockPost[],
  priceMap: Record<string, number>
): { rate: number; hits: number; total: number } | null {
  const past = posts.filter(p => !p.isLatest);
  const evs  = past.map(p => evaluatePrediction(p, priceMap)).filter(e => e.result !== "pending");
  if (!evs.length) return null;
  const hits = evs.filter(e => e.result === "hit").length;
  return { rate: Math.round(hits / evs.length * 100), hits, total: evs.length };
}

// ── Build ranking ─────────────────────────────────────────────────────────────
export function buildRanking(
  users: XUser[],
  postsByUser: Record<string, StockPost[]>,
  priceMap: Record<string, number>,
  topN = 20
): RankedUser[] {
  const scored = users.map(user => {
    const posts   = postsByUser[user.id] ?? [];
    const hitInfo = calcHitRate(posts, priceMap);
    const engScore = calcEngScore(user, posts);
    const latestPost = posts.find(p => p.isLatest) ?? null;

    return {
      ...user,
      rank: 0,
      prevRank: user.prevRank ?? null,
      rankChange: null,
      engScore,
      hitRate: hitInfo?.rate ?? null,
      hitCount: hitInfo?.hits ?? 0,
      totalCount: hitInfo?.total ?? 0,
      posts,
      latestPost,
    } as RankedUser;
  });

  // Sort: hitRate desc → engScore desc as tiebreaker
  scored.sort((a, b) => {
    if (a.hitRate === null && b.hitRate === null) return b.engScore - a.engScore;
    if (a.hitRate === null) return 1;
    if (b.hitRate === null) return -1;
    if (b.hitRate !== a.hitRate) return b.hitRate - a.hitRate;
    return b.engScore - a.engScore;
  });

  return scored.slice(0, topN).map((u, i) => ({ ...u, rank: i + 1 }));
}
