"use client";
import { useState, useEffect, useCallback } from "react";
import type { RankedUser, CurrentPrice, AIAnalysis } from "@/types";

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:"#f7f6f3", card:"#ffffff", border:"#e8e4db",
  accent:"#3b7dd8", accentSoft:"#eaf1fd",
  green:"#1e9e6a", greenSoft:"#e6f7f0",
  red:"#d14f4f",   redSoft:"#fceaea",
  amber:"#c97a08", amberSoft:"#fef3dc",
  text:"#18160f",  textMid:"#6b6558", textLight:"#a8a098",
  shadow:"0 2px 12px rgba(0,0,0,0.055)",
  shadowHover:"0 6px 24px rgba(0,0,0,0.10)",
};

// ── Price panel ───────────────────────────────────────────────────────────────
function PricePanel({ post, currentPrice }: {
  post: RankedUser["latestPost"];
  currentPrice: CurrentPrice | null;
}) {
  if (!post) return null;
  const cp  = currentPrice?.price ?? null;
  const tp  = post.targetPrice;
  const isUp = post.direction === "up";
  const dipBuy   = cp ? (isUp ? Math.round(cp * 0.962) : Math.round(cp * 1.038)) : null;
  const stopLoss = cp ? (isUp ? Math.round(cp * 0.925) : Math.round(cp * 1.075)) : null;
  const upsidePct = cp && tp ? (((tp - cp) / cp) * 100).toFixed(1) : null;

  const cols = [
    { icon:"📊", label:"現在値",
      value: cp ? `¥${cp.toLocaleString()}` : "取得中",
      sub: currentPrice ? `${currentPrice.change >= 0 ? "+" : ""}${currentPrice.change}%` : "",
      subColor: currentPrice ? (currentPrice.change >= 0 ? C.green : C.red) : C.textLight,
      bg:"#f8f8f6", border:C.border, labelColor:C.textMid, valueColor:C.text },
    { icon:"🎯", label:"目標価格",
      value: tp ? `¥${tp.toLocaleString()}` : "—",
      sub: upsidePct ? `${isUp ? "+" : ""}${upsidePct}%` : "",
      subColor: isUp ? C.green : C.red,
      bg: isUp ? C.greenSoft : C.redSoft,
      border: isUp ? `${C.green}40` : `${C.red}40`,
      labelColor: isUp ? C.green : C.red, valueColor: isUp ? C.green : C.red },
    { icon: isUp ? "📉" : "📈", label: isUp ? "押し目買い" : "戻り売り",
      value: dipBuy ? `¥${dipBuy.toLocaleString()}` : "—",
      sub: cp && dipBuy ? `現在比 ${((dipBuy - cp) / cp * 100).toFixed(1)}%` : "",
      subColor: C.accent,
      bg: C.accentSoft, border:`${C.accent}40`, labelColor:C.accent, valueColor:C.accent },
    { icon:"🛑", label:"撤退価格",
      value: stopLoss ? `¥${stopLoss.toLocaleString()}` : "—",
      sub: cp && stopLoss ? `現在比 ${((stopLoss - cp) / cp * 100).toFixed(1)}%` : "",
      subColor: C.red,
      bg:"#fff8f8", border:`${C.red}30`, labelColor:C.red, valueColor:C.red },
  ];

  return (
    <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:8, margin:"12px 0 4px"}}>
      {cols.map((col, i) => (
        <div key={i} style={{background:col.bg, border:`1px solid ${col.border}`, borderRadius:10, padding:"10px 12px", textAlign:"center"}}>
          <div style={{fontSize:14, marginBottom:4}}>{col.icon}</div>
          <div style={{fontSize:10, color:col.labelColor, fontWeight:700, letterSpacing:.5, marginBottom:5}}>{col.label}</div>
          <div style={{fontFamily:"'DM Sans',sans-serif", fontSize:15, fontWeight:800, color:col.valueColor, lineHeight:1}}>{col.value}</div>
          {col.sub && <div style={{fontSize:10, color:col.subColor, marginTop:4, fontWeight:600}}>{col.sub}</div>}
        </div>
      ))}
    </div>
  );
}

// ── Rank medal ────────────────────────────────────────────────────────────────
function RankMedal({ rank, change }: { rank: number; change: number | null }) {
  const medal = rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;
  const bg = rank===1?"linear-gradient(135deg,#fef3c7,#fde68a)":rank===2?"linear-gradient(135deg,#f1f5f9,#e2e8f0)":rank===3?"linear-gradient(135deg,#fef3e2,#fde8c0)":"#f4f3f0";
  const border = rank===1?"#f59e0b60":rank===2?"#94a3b860":rank===3?"#b4530960":"transparent";
  return (
    <div style={{position:"relative", width:44, height:44, flexShrink:0}}>
      <div style={{width:44, height:44, borderRadius:12, background:bg, border:`1.5px solid ${border}`, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center"}}>
        {medal
          ? <span style={{fontSize:20, lineHeight:1}}>{medal}</span>
          : <span style={{fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:15, color:C.textLight}}>#{rank}</span>
        }
      </div>
      {change !== null && change !== 0 && (
        <div style={{position:"absolute", top:-6, right:-6, background:change>0?C.green:C.red, color:"#fff", borderRadius:10, fontSize:9, fontWeight:700, padding:"1px 5px", lineHeight:1.4}}>
          {change > 0 ? `▲${change}` : `▼${Math.abs(change)}`}
        </div>
      )}
    </div>
  );
}

// ── Hit rate bar ──────────────────────────────────────────────────────────────
function HitBar({ rate, hits, total }: { rate: number | null; hits: number; total: number }) {
  if (rate === null) return <span style={{fontSize:11, color:C.textLight}}>実績なし</span>;
  const color = rate >= 70 ? C.green : rate >= 50 ? C.amber : C.red;
  const bg    = rate >= 70 ? C.greenSoft : rate >= 50 ? C.amberSoft : C.redSoft;
  return (
    <div style={{display:"flex", alignItems:"center", gap:8}}>
      <div style={{background:bg, color, fontWeight:800, fontSize:13, padding:"3px 12px", borderRadius:20, fontFamily:"'DM Sans',sans-serif", border:`1.5px solid ${color}40`, minWidth:56, textAlign:"center"}}>{rate}%</div>
      <div style={{flex:1, height:5, background:C.border, borderRadius:3, overflow:"hidden", minWidth:50}}>
        <div style={{width:`${rate}%`, height:"100%", background:color, borderRadius:3}}/>
      </div>
      <span style={{fontSize:11, color:C.textLight, whiteSpace:"nowrap"}}>{hits}/{total}件</span>
    </div>
  );
}

// ── Direction tag ─────────────────────────────────────────────────────────────
function DirectionTag({ dir }: { dir: "up" | "down" }) {
  return (
    <span style={{background:dir==="up"?C.greenSoft:C.redSoft, color:dir==="up"?C.green:C.red, fontSize:11, fontWeight:700, padding:"2px 9px", borderRadius:16, border:`1px solid ${dir==="up"?C.green:C.red}30`}}>
      {dir==="up" ? "↑ 強気" : "↓ 弱気"}
    </span>
  );
}

// ── Pick card ─────────────────────────────────────────────────────────────────
function PickCard({ user }: { user: RankedUser }) {
  const [aiOpen,   setAiOpen]   = useState(false);
  const [aiData,   setAiData]   = useState<AIAnalysis | null>(null);
  const [aiLoad,   setAiLoad]   = useState(false);
  const [price,    setPrice]    = useState<CurrentPrice | null>(null);
  const [showPast, setShowPast] = useState(false);

  const latest   = user.latestPost;
  const pastPosts = user.posts.filter(p => !p.isLatest);

  // Fetch current price on mount
  useEffect(() => {
    if (!latest?.ticker) return;
    fetch(`/api/stock-price?ticker=${latest.ticker}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => d && setPrice(d))
      .catch(() => {});
  }, [latest?.ticker]);

  async function handleAI() {
    if (!latest) return;
    if (aiData) { setAiOpen(o => !o); return; }
    setAiLoad(true); setAiOpen(true);
    try {
      const res = await fetch("/api/analyze", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ postId: latest.id, userId: user.id }),
      });
      if (res.ok) setAiData(await res.json());
    } catch {}
    setAiLoad(false);
  }

  const borderTop = user.rank===1?"3px solid #f59e0b":user.rank===2?"3px solid #94a3b8":user.rank===3?"3px solid #b45309":"3px solid transparent";

  return (
    <div style={{background:C.card, borderRadius:14, border:`1px solid ${C.border}`, borderTop, boxShadow:C.shadow, marginBottom:12, transition:"box-shadow 0.2s,transform 0.15s"}}
      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=C.shadowHover;(e.currentTarget as HTMLDivElement).style.transform="translateY(-1px)";}}
      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.boxShadow=C.shadow;(e.currentTarget as HTMLDivElement).style.transform="translateY(0)";}}>
      <div style={{padding:"16px 18px"}}>

        {/* Header */}
        <div style={{display:"flex", alignItems:"flex-start", gap:12, marginBottom:12}}>
          <RankMedal rank={user.rank} change={user.rankChange}/>
          {/* avatar */}
          <div style={{width:42,height:42,borderRadius:"50%",background:`${user.avatarColor}18`,border:`2px solid ${user.avatarColor}40`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:user.avatarColor,fontFamily:"'DM Sans',sans-serif",flexShrink:0}}>
            {user.handle.slice(0,2).toUpperCase()}
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:3}}>
              <span style={{fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:15, color:C.text}}>{user.name}</span>
              <span style={{fontSize:11, color:C.textLight}}>@{user.handle}</span>
            </div>
            <HitBar rate={user.hitRate} hits={user.hitCount} total={user.totalCount}/>
            <div style={{fontSize:11, color:C.textLight, marginTop:4}}>
              フォロワー {user.followers.toLocaleString()} · Engスコア {user.engScore.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Latest pick */}
        {latest && (
          <div style={{background:"linear-gradient(135deg,#f0f7ff,#f5f0ff)", borderRadius:12, padding:"14px 14px 12px", border:`1px solid ${C.accent}20`}}>
            <div style={{display:"flex", alignItems:"center", gap:6, marginBottom:8, flexWrap:"wrap"}}>
              <span style={{fontSize:10, fontWeight:700, letterSpacing:.8, color:C.accent, background:C.accentSoft, padding:"2px 10px", borderRadius:12, border:`1px solid ${C.accent}30`}}>📌 最新ピック · {latest.date}</span>
              <DirectionTag dir={latest.direction}/>
            </div>
            {/* Company + live price chip */}
            <div style={{display:"flex", alignItems:"center", gap:8, flexWrap:"wrap", marginBottom:2}}>
              <span style={{fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:18, color:C.text}}>{latest.company}</span>
              <span style={{fontSize:11, color:C.textLight, background:"#e8e4db", padding:"1px 8px", borderRadius:8}}>{latest.ticker}</span>
              {price && (
                <div style={{display:"flex", alignItems:"center", gap:5, background:price.change>=0?C.greenSoft:C.redSoft, border:`1px solid ${price.change>=0?C.green:C.red}40`, borderRadius:20, padding:"3px 10px"}}>
                  <span style={{fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:14, color:price.change>=0?C.green:C.red}}>¥{price.price.toLocaleString()}</span>
                  <span style={{fontSize:11, fontWeight:700, color:price.change>=0?C.green:C.red}}>{price.change>=0?"+":""}{price.change}%</span>
                </div>
              )}
              {!price && <span style={{fontSize:11, color:C.textLight}}>株価取得中…</span>}
            </div>

            {/* 4-col price panel */}
            <PricePanel post={latest} currentPrice={price}/>

            <p style={{fontSize:13, color:C.textMid, lineHeight:1.65, margin:"10px 0 8px"}}>{latest.rawText}</p>
            <div style={{display:"flex", gap:12, fontSize:11, color:C.textLight}}>
              <span>❤ {latest.likes}</span><span>🔁 {latest.retweets}</span><span>💬 {latest.replies}</span>
              {latest.postUrl && <a href={latest.postUrl} target="_blank" rel="noopener noreferrer" style={{color:C.accent, marginLeft:"auto", fontSize:11}}>Xで見る →</a>}
            </div>
          </div>
        )}

        {/* AI panel */}
        {aiOpen && (
          <div style={{marginTop:10}}>
            {aiLoad ? (
              <div style={{textAlign:"center", padding:"22px", background:"#fafaf8", borderRadius:10, border:`1px solid ${C.border}`, color:C.textLight, fontSize:13}}>✨ Claude AIが分析中です…</div>
            ) : aiData && (
              <div style={{background:"#fafaf8", borderRadius:10, border:`1px solid ${C.border}`, padding:"14px 16px"}}>
                <div style={{fontSize:10, fontWeight:700, letterSpacing:1, color:C.textMid, marginBottom:10}}>🤖 AI分析レポート</div>
                <p style={{fontSize:13, color:C.text, lineHeight:1.72, margin:"0 0 12px"}}>{aiData.summary}</p>
                <div style={{background:latest?.direction==="up"?C.greenSoft:C.redSoft, border:`1px solid ${latest?.direction==="up"?C.green:C.red}30`, borderRadius:8, padding:"10px 14px", marginBottom:8}}>
                  <div style={{fontSize:10, color:C.textMid, marginBottom:3}}>{latest?.direction==="up"?"💚 AI推奨買いゾーン":"🔴 AI推奨売りゾーン"}</div>
                  <div style={{fontFamily:"'DM Sans',sans-serif", fontSize:17, fontWeight:800, color:latest?.direction==="up"?C.green:C.red}}>{aiData.buyZone}</div>
                  <div style={{fontSize:12, color:C.textMid, marginTop:3}}>{aiData.timing}</div>
                </div>
                <div style={{background:C.amberSoft, border:`1px solid ${C.amber}30`, borderRadius:8, padding:"8px 12px", marginBottom:8, fontSize:12, color:C.textMid}}>⚠️ <strong>リスク:</strong> {aiData.risk}</div>
                {(() => {
                  const mp:{[k:string]:{w:string;c:string;l:string}} = {high:{w:"85%",c:C.green,l:"信頼度 高"},medium:{w:"55%",c:C.amber,l:"信頼度 中"},low:{w:"28%",c:C.red,l:"信頼度 低"}};
                  const m = mp[aiData.confidence] || mp.medium;
                  return <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{flex:1,height:4,background:C.border,borderRadius:2,overflow:"hidden"}}><div style={{width:m.w,height:"100%",background:m.c,borderRadius:2}}/></div><span style={{fontSize:11,color:m.c,fontWeight:700}}>{m.l}</span></div>;
                })()}
              </div>
            )}
          </div>
        )}

        {/* Past posts */}
        {showPast && pastPosts.length > 0 && (
          <div style={{marginTop:10}}>
            <div style={{fontSize:11, color:C.textMid, fontWeight:700, marginBottom:6}}>過去の予想実績</div>
            {pastPosts.map(p => (
              <div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",background:"#f8f8f6",borderRadius:7,marginBottom:5,border:`1px solid ${C.border}`,flexWrap:"wrap"}}>
                <span style={{fontSize:10,color:C.textLight,flexShrink:0}}>{p.date}</span>
                <span style={{fontSize:12,color:C.text,fontWeight:600,flex:1,minWidth:80}}>{p.company}</span>
                <DirectionTag dir={p.direction}/>
                {p.postUrl && <a href={p.postUrl} target="_blank" rel="noopener noreferrer" style={{fontSize:10,color:C.accent}}>Xで見る</a>}
              </div>
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          {latest && (
            <button onClick={handleAI} disabled={aiLoad} style={{background:aiLoad?"#e8f1fd":C.accent,color:aiLoad?C.accent:"#fff",border:`1px solid ${aiLoad?C.accent+"40":"transparent"}`,borderRadius:8,padding:"8px 16px",fontSize:12,fontWeight:700,transition:"all 0.15s"}}>
              {aiLoad?"分析中…":aiData&&aiOpen?"✕ AI分析を閉じる":"✨ AI分析・買い時を見る"}
            </button>
          )}
          {pastPosts.length > 0 && (
            <button onClick={()=>setShowPast(s=>!s)} style={{background:"transparent",color:C.textMid,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px",fontSize:12}}>
              {showPast?"▲ 実績を隠す":`▼ 過去${pastPosts.length}件の実績`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Live ticker ───────────────────────────────────────────────────────────────
function LiveTicker({ lastUpdated, userCount }: { lastUpdated: string | null; userCount: number }) {
  const [ts, setTs] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTs(new Date()), 1000); return () => clearInterval(id); }, []);
  return (
    <div style={{background:"linear-gradient(90deg,#1e293b,#0f172a)",color:"#94a3b8",fontSize:11,padding:"6px 24px",display:"flex",alignItems:"center",gap:20,overflow:"hidden"}}>
      <span style={{color:"#64ffda",fontFamily:"'DM Sans',sans-serif",fontWeight:700,whiteSpace:"nowrap"}}>🟢 LIVE {ts.toLocaleTimeString("ja-JP")}</span>
      <span>候補ユーザー <strong style={{color:"#fff"}}>{userCount}名</strong></span>
      {lastUpdated && <span>最終更新 <strong style={{color:"#fff"}}>{new Date(lastUpdated).toLocaleString("ja-JP")}</strong></span>}
      <span style={{color:"#475569",marginLeft:"auto",whiteSpace:"nowrap"}}>投資判断への使用不可</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  const [ranking,     setRanking]     = useState<RankedUser[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isUpdating,  setIsUpdating]  = useState(false);
  const [userCount,   setUserCount]   = useState(0);
  const [filter,      setFilter]      = useState<"all"|"up"|"down">("all");

  const loadRanking = useCallback(async () => {
    const res = await fetch("/api/ranking-update");
    if (!res.ok) return;
    const d = await res.json();
    setRanking(d.ranking ?? []);
    setLastUpdated(d.lastUpdated);
    setIsUpdating(d.isUpdating);
    setUserCount(d.userCount ?? 0);
  }, []);

  useEffect(() => { loadRanking(); }, [loadRanking]);

  async function handleUpdate() {
    setIsUpdating(true);
    await fetch("/api/ranking-update", { method:"POST" });
    // Poll until done
    const poll = setInterval(async () => {
      const res = await fetch("/api/ranking-update");
      const d   = await res.json();
      if (!d.isUpdating) {
        clearInterval(poll);
        setRanking(d.ranking ?? []);
        setLastUpdated(d.lastUpdated);
        setIsUpdating(false);
      }
    }, 3000);
  }

  const displayed = filter === "all" ? ranking : ranking.filter(u => u.latestPost?.direction === filter);

  const upCount   = ranking.filter(u => u.latestPost?.direction === "up").length;
  const downCount = ranking.filter(u => u.latestPost?.direction === "down").length;
  const avgRate   = ranking.filter(u => u.hitRate !== null).reduce((s,u,_,a) => s + (u.hitRate??0)/a.length, 0);

  return (
    <div style={{minHeight:"100vh", background:C.bg}}>
      <LiveTicker lastUpdated={lastUpdated} userCount={userCount}/>

      {/* Nav */}
      <div style={{background:C.card, borderBottom:`1px solid ${C.border}`, padding:"0 24px"}}>
        <div style={{maxWidth:860, margin:"0 auto", height:54, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <div style={{width:30, height:30, borderRadius:8, background:C.accent, display:"flex", alignItems:"center", justifyContent:"center"}}><span style={{fontSize:15}}>📈</span></div>
            <span style={{fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:17, color:C.text}}>KabuCheck</span>
          </div>
          <div style={{display:"flex", gap:10, alignItems:"center"}}>
            <a href="/admin" style={{fontSize:12, color:C.textMid, textDecoration:"none", padding:"6px 12px", border:`1px solid ${C.border}`, borderRadius:8}}>⚙ 管理画面</a>
            <button onClick={handleUpdate} disabled={isUpdating} style={{background:isUpdating?"#e8f1fd":C.accent, color:isUpdating?C.accent:"#fff", border:`1px solid ${isUpdating?C.accent+"40":"transparent"}`, borderRadius:8, padding:"8px 16px", fontSize:13, fontWeight:700}}>
              {isUpdating ? "🔄 更新中…" : "🔄 ランキング更新"}
            </button>
          </div>
        </div>
      </div>

      <div style={{maxWidth:860, margin:"0 auto", padding:"28px 16px 60px"}}>
        {/* Hero */}
        <div style={{marginBottom:22}}>
          <h1 style={{fontFamily:"'DM Sans',sans-serif", fontSize:"clamp(22px,4.5vw,36px)", fontWeight:800, color:C.text, margin:"0 0 8px", lineHeight:1.2, letterSpacing:-0.5}}>
            株予想インフルエンサー<br/>的中率ランキング TOP 20
          </h1>
          <p style={{fontSize:13, color:C.textMid, margin:0, lineHeight:1.7}}>
            NitterのRSSから直近60日の#株予想ポストを自動収集。Claude AIが銘柄・方向・目標を抽出し、Yahoo Financeの実価格と照合して的中率を算出します。
          </p>
        </div>

        {/* Stats */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:20}}>
          {[
            {icon:"🎯", label:"平均的中率", val: ranking.length ? `${Math.round(avgRate)}%` : "—", sub:"上位20名"},
            {icon:"👥", label:"ランキング人数", val:`${ranking.length}名`, sub:`候補${userCount}名から選定`},
            {icon:"📈", label:"強気ピック", val:`${upCount}銘柄`, sub:"最新予想"},
            {icon:"📉", label:"弱気ピック", val:`${downCount}銘柄`, sub:"最新予想"},
          ].map((s,i) => (
            <div key={i} style={{background:C.card, border:`1px solid ${C.border}`, borderRadius:12, padding:"13px 15px", boxShadow:C.shadow}}>
              <div style={{fontSize:18, marginBottom:4}}>{s.icon}</div>
              <div style={{fontSize:10, color:C.textLight, marginBottom:2}}>{s.label}</div>
              <div style={{fontFamily:"'DM Sans',sans-serif", fontSize:20, fontWeight:800, color:C.text}}>{s.val}</div>
              <div style={{fontSize:10, color:C.textLight, marginTop:1}}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter */}
        <div style={{display:"flex", alignItems:"center", gap:8, marginBottom:16, flexWrap:"wrap"}}>
          {(["all","up","down"] as const).map(v => (
            <button key={v} onClick={()=>setFilter(v)} style={{background:filter===v?C.accent:"transparent", color:filter===v?"#fff":C.textMid, border:`1px solid ${filter===v?C.accent:C.border}`, borderRadius:8, padding:"6px 14px", fontSize:12, fontWeight:600, transition:"all 0.15s"}}>
              {v==="all"?"すべて":v==="up"?"↑ 強気のみ":"↓ 弱気のみ"}
            </button>
          ))}
          <span style={{marginLeft:"auto", fontSize:11, color:C.textLight, background:"#f4f3f0", padding:"4px 12px", borderRadius:20}}>的中率順（高い順）</span>
        </div>

        {/* Empty state */}
        {ranking.length === 0 && (
          <div style={{textAlign:"center", padding:"60px 20px", background:C.card, borderRadius:14, border:`1px solid ${C.border}`}}>
            <div style={{fontSize:40, marginBottom:16}}>📊</div>
            <h2 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:20, color:C.text, marginBottom:8}}>まだデータがありません</h2>
            <p style={{fontSize:13, color:C.textMid, marginBottom:20}}>「ランキング更新」ボタンを押すと、Nitter RSSからデータを取得してランキングを生成します。</p>
            <button onClick={handleUpdate} disabled={isUpdating} style={{background:C.accent, color:"#fff", border:"none", borderRadius:8, padding:"12px 24px", fontSize:14, fontWeight:700}}>
              {isUpdating ? "🔄 更新中…" : "🔄 今すぐ更新する"}
            </button>
          </div>
        )}

        {/* Cards */}
        {displayed.map(u => <PickCard key={u.id} user={u}/>)}

        <p style={{textAlign:"center", fontSize:11, color:C.textLight, marginTop:28, lineHeight:1.8}}>
          KabuCheck · 本サービスは情報提供のみを目的としており、投資勧誘ではありません
        </p>
      </div>
    </div>
  );
}
