import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { fetchAllUsers } from "@/lib/nitter";
import { fetchPricesForTickers } from "@/lib/yahoo-finance";
import { buildRanking } from "@/lib/ranking";

export const maxDuration = 60; // Vercel max for hobby plan

export async function POST() {
  if (store.getIsUpdating()) {
    return NextResponse.json({ error: "Already updating" }, { status: 409 });
  }

  store.setIsUpdating(true);

  try {
    const users = store.getUsers();
    const sinceDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000); // 60 days

    // 1. Fetch posts from Nitter RSS
    const newPosts = await fetchAllUsers(
      users.map(u => ({ id: u.id, handle: u.handle })),
      sinceDate
    );
    store.upsertPosts(newPosts);

    // 2. Fetch current prices for all tickers mentioned
    const allPosts = store.getPosts();
    const tickers  = [...new Set(allPosts.map(p => p.ticker))];
    const prices   = await fetchPricesForTickers(tickers);
    store.setPrices(prices);

    // 3. Build price map for hit/miss evaluation (current price as proxy)
    const priceMap: Record<string, number> = {};
    for (const [ticker, cp] of Object.entries(prices)) {
      priceMap[`${ticker}_current`] = cp.price;
    }

    // 4. Group posts by user
    const postsByUser: Record<string, typeof allPosts> = {};
    for (const u of users) {
      postsByUser[u.id] = allPosts.filter(p => p.userId === u.id);
    }

    // 5. Build ranking (top 20 by hit rate)
    const ranking = buildRanking(users, postsByUser, priceMap, 20);
    store.setRanking(ranking);

    // 6. Mark active/inactive users
    const activeIds = new Set(ranking.map(u => u.id));
    for (const u of users) {
      store.updateUser(u.id, { isActive: activeIds.has(u.id) });
    }

    return NextResponse.json({
      success: true,
      updatedAt: store.getLastUpdated(),
      rankingCount: ranking.length,
      postsFound: newPosts.length,
    });
  } catch (err) {
    console.error("Ranking update failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  } finally {
    store.setIsUpdating(false);
  }
}

export async function GET() {
  return NextResponse.json({
    ranking: store.getRanking(),
    lastUpdated: store.getLastUpdated(),
    isUpdating: store.getIsUpdating(),
    userCount: store.getUsers().length,
  });
}
