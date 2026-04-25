"use client";
import { useState, useEffect } from "react";
import type { XUser } from "@/types";

const C = {
  bg:"#f7f6f3", card:"#ffffff", border:"#e8e4db",
  accent:"#3b7dd8", accentSoft:"#eaf1fd",
  green:"#1e9e6a", greenSoft:"#e6f7f0",
  red:"#d14f4f", redSoft:"#fceaea",
  amber:"#c97a08", amberSoft:"#fef3dc",
  text:"#18160f", textMid:"#6b6558", textLight:"#a8a098",
  shadow:"0 2px 12px rgba(0,0,0,0.055)",
};

const AVATAR_COLORS = [
  "#3b7dd8","#1e9e6a","#7c3aed","#d97706","#e11d7a",
  "#dc2626","#0891b2","#16a34a","#be185d","#b45309",
  "#991b1b","#15803d","#0369a1","#7e22ce","#c2410c","#334155",
];

export default function AdminPage() {
  const [users,      setUsers]      = useState<XUser[]>([]);
  const [handle,     setHandle]     = useState("");
  const [name,       setName]       = useState("");
  const [followers,  setFollowers]  = useState("");
  const [color,      setColor]      = useState(AVATAR_COLORS[0]);
  const [adding,     setAdding]     = useState(false);
  const [updating,   setUpdating]   = useState(false);
  const [lastUpdated,setLastUpdated]= useState<string|null>(null);
  const [log,        setLog]        = useState<string[]>([]);
  const [tab,        setTab]        = useState<"users"|"log">("users");

  async function loadUsers() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }

  async function loadStatus() {
    const res = await fetch("/api/ranking-update");
    if (res.ok) {
      const d = await res.json();
      setLastUpdated(d.lastUpdated);
      setUpdating(d.isUpdating);
    }
  }

  useEffect(() => { loadUsers(); loadStatus(); }, []);

  async function handleAdd() {
    if (!handle) return;
    setAdding(true);
    await fetch("/api/users", {
      method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ handle: handle.replace(/^@/,""), name: name||handle, followers: parseInt(followers)||0, avatarColor: color }),
    });
    setHandle(""); setName(""); setFollowers("");
    await loadUsers();
    setAdding(false);
  }

  async function handleRemove(id: string) {
    if (!confirm("このユーザーを削除しますか？")) return;
    await fetch(`/api/users?id=${id}`, { method:"DELETE" });
    await loadUsers();
  }

  async function handleUpdate() {
    setUpdating(true);
    setTab("log");
    setLog(["🔄 ランキング更新を開始します..."]);

    const res = await fetch("/api/ranking-update", { method:"POST" });
    if (!res.ok) { setLog(l=>[...l,"❌ 更新に失敗しました"]); setUpdating(false); return; }

    setLog(l=>[...l,"📡 Nitter RSSからデータ取得中..."]);
    const poll = setInterval(async () => {
      const r = await fetch("/api/ranking-update");
      const d = await r.json();
      if (!d.isUpdating) {
        clearInterval(poll);
        setUpdating(false);
        setLastUpdated(d.lastUpdated);
        setLog(l=>[...l,
          `✅ 完了！ランキング${d.rankingCount}名を生成`,
          `📌 新規ポスト ${d.postsFound}件を取得`,
          `🕐 更新時刻: ${new Date(d.lastUpdated).toLocaleString("ja-JP")}`,
        ]);
        await loadUsers();
      }
    }, 3000);
  }

  const activeUsers   = users.filter(u => u.isActive);
  const inactiveUsers = users.filter(u => !u.isActive);

  return (
    <div style={{minHeight:"100vh", background:C.bg, fontFamily:"'Noto Sans JP',sans-serif", color:C.text}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>

      {/* Nav */}
      <div style={{background:C.card, borderBottom:`1px solid ${C.border}`, padding:"0 24px"}}>
        <div style={{maxWidth:860, margin:"0 auto", height:54, display:"flex", alignItems:"center", justifyContent:"space-between"}}>
          <div style={{display:"flex", alignItems:"center", gap:10}}>
            <a href="/" style={{display:"flex",alignItems:"center",gap:10,textDecoration:"none"}}>
              <div style={{width:30,height:30,borderRadius:8,background:"#3b7dd8",display:"flex",alignItems:"center",justifyContent:"center"}}><span style={{fontSize:15}}>📈</span></div>
              <span style={{fontFamily:"'DM Sans',sans-serif",fontWeight:800,fontSize:17,color:C.text}}>KabuCheck</span>
            </a>
            <span style={{fontSize:12, color:C.textLight, background:"#f0f0ec", padding:"2px 10px", borderRadius:10}}>管理画面</span>
          </div>
          <div style={{fontSize:12, color:C.textLight}}>
            {lastUpdated ? `最終更新: ${new Date(lastUpdated).toLocaleString("ja-JP")}` : "未更新"}
          </div>
        </div>
      </div>

      <div style={{maxWidth:860, margin:"0 auto", padding:"28px 16px 60px"}}>

        {/* Update button */}
        <div style={{background:C.card, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.shadow, padding:"20px 24px", marginBottom:20}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12}}>
            <div>
              <h2 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:800, fontSize:18, color:C.text, marginBottom:4}}>ランキング更新</h2>
              <p style={{fontSize:13, color:C.textMid}}>
                全候補ユーザーのRSSを取得し、エンゲージメントスコアで上位20名を自動選定します。
              </p>
            </div>
            <button onClick={handleUpdate} disabled={updating} style={{
              background:updating?C.accentSoft:C.accent, color:updating?C.accent:"#fff",
              border:`1px solid ${updating?C.accent+"40":"transparent"}`,
              borderRadius:10, padding:"12px 24px", fontSize:14, fontWeight:700,
              cursor:updating?"default":"pointer", whiteSpace:"nowrap",
            }}>
              {updating ? "🔄 更新中…" : "🔄 今すぐランキングを更新"}
            </button>
          </div>
          <div style={{marginTop:12, fontSize:12, color:C.textLight, display:"flex", gap:16, flexWrap:"wrap"}}>
            <span>候補ユーザー: <strong style={{color:C.text}}>{users.length}名</strong></span>
            <span>現在のランキング: <strong style={{color:C.text}}>{activeUsers.length}名</strong></span>
            <span>圏外: <strong style={{color:C.text}}>{inactiveUsers.length}名</strong></span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:"flex", gap:8, marginBottom:16}}>
          {(["users","log"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{
              background:tab===t?C.accent:"transparent", color:tab===t?"#fff":C.textMid,
              border:`1px solid ${tab===t?C.accent:C.border}`, borderRadius:8,
              padding:"7px 18px", fontSize:12, fontWeight:600, cursor:"pointer",
            }}>{t==="users"?"👥 ユーザー管理":"📋 更新ログ"}</button>
          ))}
        </div>

        {/* User management tab */}
        {tab === "users" && (
          <>
            {/* Add user form */}
            <div style={{background:C.card, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.shadow, padding:"20px 24px", marginBottom:16}}>
              <h3 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:C.text, marginBottom:14}}>➕ 候補ユーザーを追加</h3>
              <div style={{display:"grid", gridTemplateColumns:"1fr 1fr 120px", gap:10, marginBottom:10}}>
                <input value={handle} onChange={e=>setHandle(e.target.value)} placeholder="@handle (必須)"
                  style={{padding:"9px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, color:C.text, background:"#fafaf8", outline:"none"}}/>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="表示名"
                  style={{padding:"9px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, color:C.text, background:"#fafaf8", outline:"none"}}/>
                <input value={followers} onChange={e=>setFollowers(e.target.value)} placeholder="フォロワー数" type="number"
                  style={{padding:"9px 12px", borderRadius:8, border:`1px solid ${C.border}`, fontSize:13, color:C.text, background:"#fafaf8", outline:"none"}}/>
              </div>
              <div style={{display:"flex", alignItems:"center", gap:10}}>
                <span style={{fontSize:12, color:C.textMid}}>カラー:</span>
                <div style={{display:"flex", gap:6, flexWrap:"wrap"}}>
                  {AVATAR_COLORS.map(c=>(
                    <div key={c} onClick={()=>setColor(c)} style={{width:22, height:22, borderRadius:"50%", background:c, cursor:"pointer", border:color===c?"3px solid #18160f":"2px solid transparent", transition:"border 0.15s"}}/>
                  ))}
                </div>
                <button onClick={handleAdd} disabled={adding||!handle} style={{marginLeft:"auto", background:handle?C.accent:"#e0ddd8", color:handle?"#fff":C.textLight, border:"none", borderRadius:8, padding:"9px 20px", fontSize:13, fontWeight:700, cursor:handle?"pointer":"default"}}>
                  {adding ? "追加中…" : "追加"}
                </button>
              </div>
            </div>

            {/* Active (top-20) */}
            <div style={{background:C.card, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.shadow, padding:"20px 24px", marginBottom:16}}>
              <h3 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:C.text, marginBottom:4}}>
                🏆 現在のランキング上位 ({activeUsers.length}名)
              </h3>
              <p style={{fontSize:12, color:C.textLight, marginBottom:14}}>ランキング更新時に自動で入れ替わります</p>
              {activeUsers.length === 0 && <p style={{fontSize:13, color:C.textLight}}>まだランキングがありません。「ランキング更新」を実行してください。</p>}
              {activeUsers.map((u,i) => (
                <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<activeUsers.length-1?`1px solid ${C.border}`:"none"}}>
                  <div style={{width:32, height:32, borderRadius:8, background:`${u.avatarColor}18`, border:`2px solid ${u.avatarColor}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:u.avatarColor, flexShrink:0}}>
                    {u.handle.slice(0,2).toUpperCase()}
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:700, color:C.text}}>{u.name}</div>
                    <div style={{fontSize:11, color:C.textLight}}>@{u.handle} · {u.followers.toLocaleString()}フォロワー</div>
                  </div>
                  <span style={{fontSize:11, background:C.greenSoft, color:C.green, padding:"2px 8px", borderRadius:10, fontWeight:700, flexShrink:0}}>ランキング中</span>
                  <button onClick={()=>handleRemove(u.id)} style={{background:C.redSoft, color:C.red, border:`1px solid ${C.red}30`, borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer"}}>削除</button>
                </div>
              ))}
            </div>

            {/* Inactive candidates */}
            {inactiveUsers.length > 0 && (
              <div style={{background:C.card, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.shadow, padding:"20px 24px"}}>
                <h3 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:C.text, marginBottom:4}}>
                  📋 圏外の候補ユーザー ({inactiveUsers.length}名)
                </h3>
                <p style={{fontSize:12, color:C.textLight, marginBottom:14}}>次回更新時にスコアが高ければ自動でランキング入りします</p>
                {inactiveUsers.map((u,i) => (
                  <div key={u.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:i<inactiveUsers.length-1?`1px solid ${C.border}`:"none"}}>
                    <div style={{width:32, height:32, borderRadius:8, background:`${u.avatarColor}18`, border:`2px solid ${u.avatarColor}40`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:800, color:u.avatarColor, flexShrink:0}}>
                      {u.handle.slice(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1, minWidth:0}}>
                      <div style={{fontSize:13, fontWeight:700, color:C.text}}>{u.name}</div>
                      <div style={{fontSize:11, color:C.textLight}}>@{u.handle} · {u.followers.toLocaleString()}フォロワー</div>
                    </div>
                    <span style={{fontSize:11, background:"#f4f3f0", color:C.textLight, padding:"2px 8px", borderRadius:10, flexShrink:0}}>圏外</span>
                    <button onClick={()=>handleRemove(u.id)} style={{background:C.redSoft, color:C.red, border:`1px solid ${C.red}30`, borderRadius:6, padding:"4px 10px", fontSize:11, cursor:"pointer"}}>削除</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Log tab */}
        {tab === "log" && (
          <div style={{background:C.card, borderRadius:14, border:`1px solid ${C.border}`, boxShadow:C.shadow, padding:"20px 24px"}}>
            <h3 style={{fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:15, color:C.text, marginBottom:14}}>📋 更新ログ</h3>
            {log.length === 0
              ? <p style={{fontSize:13, color:C.textLight}}>まだログがありません。「ランキングを更新」を実行してください。</p>
              : log.map((l,i) => (
                <div key={i} style={{fontSize:13, color:C.textMid, padding:"6px 0", borderBottom:`1px solid ${C.border}`}}>
                  {l}
                </div>
              ))
            }
          </div>
        )}

        <div style={{marginTop:24, padding:"16px", background:C.amberSoft, borderRadius:12, border:`1px solid ${C.amber}30`}}>
          <p style={{fontSize:12, color:C.amber, fontWeight:700, marginBottom:4}}>⚠️ 注意事項</p>
          <ul style={{fontSize:12, color:C.textMid, paddingLeft:16, lineHeight:1.8}}>
            <li>Nitter RSSは非公式サービスです。X社の方針変更により突然使用不可になる場合があります。</li>
            <li>取得できるエンゲージメント情報（いいね数等）は制限されます。フォロワー数が主なスコア要素になります。</li>
            <li>株価予想の自動抽出にはClaude AIを使用します。ANTHROPIC_API_KEYの設定が必要です。</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
