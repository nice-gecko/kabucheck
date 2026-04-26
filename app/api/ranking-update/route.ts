import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import { fetchAllUsers } from "@/lib/nitter";
import { fetchPricesForTickers } from "@/lib/yahoo-finance";
import { buildRanking } from "@/lib/ranking";

export const maxDuration = 60;

// Store last result for GET polling
let lastResult = { rankingCount: 0, postsFound: 0 };

export async function POST() {
  if (store.getIsUpdating()) {
    return NextResponse.json({ error: "Already updating" }, { status: 409 });
  }
  store.setIsUpdating(true);
  try {
    const users = store.getUsers();
    const sinceDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000); // 3ヶ月

    // platform フィールドを渡す
    const newPosts = await fetchAllUsers(
      users.map(u => ({ id: u.id, handle: u.handle, platform: u.platform ?? "x" })),
      sinceDate
    );
    store.upsertPosts(newPosts);

    const allPosts = store.getPosts();
    const tickerSet = new Set(allPosts.map(p => p.ticker));
    const tickers = Array.from(tickerSet);
    const prices = await fetchPricesForTickers(tickers);
    store.setPrices(prices);

    const priceMap: Record<string, number> = {};
    for (const [ticker, cp] of Object.entries(prices)) {
      priceMap[`${ticker}_current`] = cp.price;
    }

    const postsByUser: Record<string, typeof allPosts> = {};
    for (const u of users) {
      postsByUser[u.id] = allPosts.filter(p => p.userId === u.id);
    }

    const ranking = buildRanking(users, postsByUser, priceMap, 20);
    store.setRanking(ranking);

    const activeIdSet = new Set(ranking.map(u => u.id));
    for (const u of users) {
      store.updateUser(u.id, { isActive: activeIdSet.has(u.id) });
    }

    lastResult = { rankingCount: ranking.length, postsFound: newPosts.length };

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
    rankingCount: lastResult.rankingCount,
    postsFound: lastResult.postsFound,
  });
}
