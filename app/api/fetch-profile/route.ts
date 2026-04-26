import { NextRequest, NextResponse } from "next/server";

const RSSHUB_BASE = process.env.RSSHUB_URL ?? "https://rss-hub-drab-five.vercel.app";

export async function GET(req: NextRequest) {
  const handle = req.nextUrl.searchParams.get("handle");
  const platform = req.nextUrl.searchParams.get("platform") ?? "x";
  if (!handle) return NextResponse.json({ error: "handle required" }, { status: 400 });

  const cleanHandle = handle.replace(/^@/, "");

  try {
    if (platform === "x") {
      // RSSHubのTwitterプロフィールAPIを使用
      const profileUrl = `${RSSHUB_BASE}/twitter/user/${cleanHandle}`;
      const res = await fetch(profileUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (res.ok) {
        const xml = await res.text();

        // タイトルから表示名を抽出: "Twitter @handle" または "表示名 (@handle)"
        const titleMatch = xml.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/);
        let displayName = cleanHandle;
        if (titleMatch) {
          const raw = (titleMatch[1] || titleMatch[2] || "").trim();
          // "Twitter @xxx" パターンを除去
          displayName = raw
            .replace(/^Twitter\s+@\S+/i, "")
            .replace(/^@\S+\s*/i, "")
            .trim() || cleanHandle;
        }

        // descriptionからフォロワー数を抽出
        const descMatch = xml.match(/<description><!\[CDATA\[([^\]]*)\]\]><\/description>|<description>([^<]*)<\/description>/);
        const desc = descMatch ? (descMatch[1] || descMatch[2] || "") : "";
        const followerMatch = desc.match(/([\d,]+)\s*(?:Followers|followers|フォロワー)/i);
        const followers = followerMatch
          ? parseInt(followerMatch[1].replace(/,/g, ""), 10)
          : null;

        // authorタグからも試みる
        const authorMatch = xml.match(/<webMaster>([^<]+)<\/webMaster>|<author>([^<]+)<\/author>/);

        return NextResponse.json({
          handle: cleanHandle,
          name: displayName !== cleanHandle ? displayName : `@${cleanHandle}`,
          followers,
          platform: "x",
        });
      }
    }

    if (platform === "threads") {
      const profileUrl = `${RSSHUB_BASE}/threads/user/${cleanHandle}`;
      const res = await fetch(profileUrl, {
        signal: AbortSignal.timeout(10000),
        headers: { "User-Agent": "Mozilla/5.0" },
      });

      if (res.ok) {
        const xml = await res.text();
        const titleMatch = xml.match(/<title><!\[CDATA\[([^\]]+)\]\]><\/title>|<title>([^<]+)<\/title>/);
        let displayName = cleanHandle;
        if (titleMatch) {
          const raw = (titleMatch[1] || titleMatch[2] || "").trim();
          displayName = raw.replace(/^Threads\s+@\S+/i, "").trim() || cleanHandle;
        }
        return NextResponse.json({
          handle: cleanHandle,
          name: displayName !== cleanHandle ? displayName : `@${cleanHandle}`,
          followers: null,
          platform: "threads",
        });
      }
    }

    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
