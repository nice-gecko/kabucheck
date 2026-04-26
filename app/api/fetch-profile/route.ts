import { NextRequest, NextResponse } from "next/server";
import { XMLParser } from "fast-xml-parser";

const RSSHUB_BASE = process.env.RSSHUB_URL ?? "https://rss-hub-drab-five.vercel.app";
const parser = new XMLParser({ ignoreAttributes: false });

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  const platform = req.nextUrl.searchParams.get("platform") ?? "x";
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const cleanHandle = handle.replace(/^@/, "");

  try {
    // Fetch RSS feed to extract profile info
    const url = platform === "threads"
      ? `${RSSHUB_BASE}/threads/user/${cleanHandle}`
      : `${RSSHUB_BASE}/twitter/user/${cleanHandle}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; KabuCheck/1.0)" },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const xml = await res.text();
    const parsed = parser.parse(xml);
    const channel = parsed?.rss?.channel;

    if (!channel) {
      return NextResponse.json({ error: "Invalid RSS" }, { status: 404 });
    }

    // Extract profile info from RSS channel
    const title: string = channel.title ?? cleanHandle;
    const description: string = channel.description ?? "";

    // Extract display name (remove "Twitter @" prefix if present)
    const displayName = title
      .replace(/^Twitter\s+@\S+\s*/i, "")
      .replace(/^Threads\s+@\S+\s*/i, "")
      .trim() || cleanHandle;

    // Extract follower count from description if available
    // RSSHub includes it in some formats like "X followers"
    const followerMatch = description.match(/([\d,]+)\s*(?:followers|フォロワー)/i);
    const followers = followerMatch
      ? parseInt(followerMatch[1].replace(/,/g, ""), 10)
      : null;

    return NextResponse.json({
      handle: cleanHandle,
      name: displayName,
      followers,
      platform,
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
