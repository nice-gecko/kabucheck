import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import * as store from "@/lib/store";
import type { AIAnalysis } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { postId, userId } = await req.json();

  // Return cached result if available
  const cached = store.getAICache(postId);
  if (cached) return NextResponse.json(cached);

  const ranking  = store.getRanking();
  const user     = ranking.find(u => u.id === userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const post = user.posts.find(p => p.id === postId);
  if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 });

  const price = store.getPrice(post.ticker);
  const pastSummary = user.posts
    .filter(p => !p.isLatest)
    .map(p => `${p.date} [${p.company}] ${p.direction === "up" ? "↑" : "↓"}`)
    .join("\n");

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 700,
      system: `あなたは株式投資アドバイザーです。以下のJSON形式のみで返答（マークダウン・コードブロック不要）:
{"summary":"予想根拠と注目ポイント2文","buyZone":"推奨買い価格帯（例: ¥67,500〜¥68,500）","timing":"買いタイミング・条件1文","risk":"主なリスク1文","confidence":"high/medium/low"}`,
      messages: [{
        role: "user",
        content: `ユーザー: ${user.name} / 的中率: ${user.hitRate ?? "不明"}% (${user.hitCount}/${user.totalCount}件)\n\n過去:\n${pastSummary}\n\n最新予想:\n銘柄: ${post.company}(${post.ticker})\n方向: ${post.direction === "up" ? "↑強気" : "↓弱気"}\n目標: ¥${post.targetPrice?.toLocaleString() ?? "未設定"}\n現在値: ${price ? `¥${price.price.toLocaleString()} (${price.change >= 0 ? "+" : ""}${price.change}%)` : "取得中"}\n内容: "${post.rawText}"\n\n買い時・タイミング・リスクを分析してください。`,
      }],
    });

    const raw = message.content[0].type === "text" ? message.content[0].text : "{}";
    let analysis: AIAnalysis;
    try {
      analysis = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch {
      analysis = { summary: raw, buyZone: "—", timing: "—", risk: "—", confidence: "medium" };
    }

    store.setAICache(postId, analysis);
    return NextResponse.json(analysis);
  } catch (err) {
    console.error("AI analysis error:", err);
    return NextResponse.json({ error: "AI analysis failed" }, { status: 500 });
  }
}
