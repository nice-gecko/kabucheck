import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentPriceWithATR } from "@/lib/yahoo-finance";
import * as store from "@/lib/store";

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker");
  if (!ticker) return NextResponse.json({ error: "ticker required" }, { status: 400 });

  // Return cached if fresh (< 5 min)
  const cached = store.getPrice(ticker);
  if (cached) {
    const age = Date.now() - new Date(cached.updatedAt).getTime();
    if (age < 5 * 60 * 1000) return NextResponse.json(cached);
  }

  const price = await fetchCurrentPriceWithATR(ticker);
  if (!price) return NextResponse.json({ error: "Price not found" }, { status: 404 });

  store.setPrices({ [ticker]: price });
  return NextResponse.json(price);
}
