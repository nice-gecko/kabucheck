"use client";
import { useState, useEffect } from "react";

function useWindowWidth() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
}

const C = {
  bg:"#f7f6f3", card:"#ffffff", border:"#e8e4db",
  accent:"#3b7dd8", accentSoft:"#eaf1fd",
  green:"#1e9e6a", greenSoft:"#e6f7f0",
  red:"#d14f4f", redSoft:"#fceaea",
  amber:"#c97a08", amberSoft:"#fef3dc",
  text:"#18160f", textMid:"#6b6558", textLight:"#a8a098",
  shadow:"0 2px 12px rgba(0,0,0,0.055)",
  shadowHover:"0 6px 24px rgba(0,0,0,0.10)",
};

const CURRENT_PRICES: Record<string, {price:number, change:number}> = {
  "6861.T":{ price:68400, change:+1.82 },
  "8306.T":{ price:1924,  change:+0.54 },
  "4063.T":{ price:6020,  change:+0.67 },
  "6857.T":{ price:7420,  change:+2.11 },
  "2914.T":{ price:4480,  change:-0.22 },
  "9983.T":{ price:41200, change:-1.03 },
  "6920.T":{ price:18800, change:+3.40 },
  "8058.T":{ price:2920,  change:+0.83 },
  "9020.T":{ price:2680,  change:+0.30 },
  "4385.T":{ price:2240,  change:-0.88 },
  "8031.T":{ price:3180,  change:+1.12 },
  "6146.T":{ price:43800, change:+2.56 },
  "9434.T":{ price:2080,  change:+0.48 },
  "6758.T":{ price:4820,  change:-0.41 },
  "4689.T":{ price:372,   change:-3.12 },
  "7735.T":{ price:12800, change:+1.98 },
  "8830.T":{ price:4720,  change:+0.64 },
  "6098.T":{ price:9100,  change:-4.19 },
  "4565.T":{ price:2580,  change:+1.57 },
  "7974.T":{ price:8760,  change:+0.92 },
};

interface Post {
  id: string; date: string; ticker: string; company: string;
  direction: "up"|"down"; targetPrice: number; predictionDate: string;
  resultDate: string; likes: number; retweets: number; replies: number;
  text: string; isLatest?: boolean;
}
interface User {
  id: number; handle: string; name: string; avatar: string;
  avatarColor: string; followers: number; posts: Post[];
}

const DEMO_USERS: User[] = [
  { id:1, handle:"@kabu_master_jp", name:"株マスター", avatar:"KM", avatarColor:"#3b7dd8", followers:84200, posts:[
    {id:"p1",date:"2025-02-20",ticker:"7203.T",company:"トヨタ自動車",direction:"up",targetPrice:3200,predictionDate:"2025-02-20",resultDate:"2025-03-31",likes:1840,retweets:620,replies:210,text:"トヨタ、決算好調で3月末までに3,200円到達！半導体不足解消＋EV好調💹"},
    {id:"p2",date:"2025-03-05",ticker:"6758.T",company:"ソニーグループ",direction:"up",targetPrice:4800,predictionDate:"2025-03-05",resultDate:"2025-04-05",likes:2100,retweets:880,replies:340,text:"ソニー、PS5供給改善で年度末4,800円へ"},
    {id:"p3",date:"2025-03-18",ticker:"9984.T",company:"ソフトバンクG",direction:"down",targetPrice:8000,predictionDate:"2025-03-18",resultDate:"2025-04-18",likes:980,retweets:310,replies:150,text:"ソフトバンクG、AI投資過熱で一時調整"},
    {id:"p4",date:"2025-04-20",ticker:"6861.T",company:"キーエンス",direction:"up",targetPrice:72000,predictionDate:"2025-04-20",resultDate:"2025-05-20",likes:2400,retweets:940,replies:380,text:"キーエンス、FA需要回復鮮明。製造業設備投資拡大で72,000円へ。今なら68,000円台が絶好の買い場📈",isLatest:true},
  ]},
  { id:2, handle:"@nikkei_analyst", name:"日経アナリスト", avatar:"NA", avatarColor:"#1e9e6a", followers:61500, posts:[
    {id:"p5",date:"2025-02-25",ticker:"6501.T",company:"日立製作所",direction:"up",targetPrice:10500,predictionDate:"2025-02-25",resultDate:"2025-03-25",likes:1320,retweets:490,replies:180,text:"日立、インフラDX需要で3月中に10,500円到達"},
    {id:"p6",date:"2025-03-10",ticker:"8306.T",company:"三菱UFJ",direction:"up",targetPrice:1800,predictionDate:"2025-03-10",resultDate:"2025-04-10",likes:2800,retweets:1100,replies:420,text:"三菱UFJ、金利上昇で銀行株に追い風。1,800円超えも視野"},
    {id:"p7",date:"2025-03-22",ticker:"7267.T",company:"ホンダ",direction:"down",targetPrice:1400,predictionDate:"2025-03-22",resultDate:"2025-04-22",likes:670,retweets:240,replies:130,text:"ホンダ、EV遅れで短期調整。1,400円まで下落リスク"},
    {id:"p8",date:"2025-04-18",ticker:"8306.T",company:"三菱UFJ",direction:"up",targetPrice:2000,predictionDate:"2025-04-18",resultDate:"2025-05-18",likes:3100,retweets:1280,replies:510,text:"三菱UFJ再び注目。日銀追加利上げ観測で1,880円以下は強い買い場💰",isLatest:true},
  ]},
  { id:3, handle:"@toushi_sensei", name:"投資先生🎓", avatar:"TS", avatarColor:"#7c3aed", followers:52300, posts:[
    {id:"p9",date:"2025-02-28",ticker:"6367.T",company:"ダイキン工業",direction:"up",targetPrice:24000,predictionDate:"2025-02-28",resultDate:"2025-03-28",likes:890,retweets:310,replies:97,text:"ダイキン、空調世界需要で24,000円予想！"},
    {id:"p10",date:"2025-03-15",ticker:"4063.T",company:"信越化学工業",direction:"up",targetPrice:6000,predictionDate:"2025-03-15",resultDate:"2025-04-15",likes:1540,retweets:560,replies:200,text:"信越化学、半導体シリコン需要回復で6,000円へ反発"},
    {id:"p11",date:"2025-04-01",ticker:"2413.T",company:"エムスリー",direction:"down",targetPrice:1800,predictionDate:"2025-04-01",resultDate:"2025-04-25",likes:430,retweets:140,replies:72,text:"エムスリー、医療DX鈍化で1,800円割れリスク"},
    {id:"p12",date:"2025-04-22",ticker:"4063.T",company:"信越化学工業",direction:"up",targetPrice:6500,predictionDate:"2025-04-22",resultDate:"2025-05-22",likes:1980,retweets:720,replies:290,text:"信越化学、AI向け半導体材料の需要爆発中。5,800円台が仕込みチャンス。6,500円目標🔬",isLatest:true},
  ]},
  { id:4, handle:"@bulls_market99", name:"BullsMarket", avatar:"BM", avatarColor:"#d97706", followers:38700, posts:[
    {id:"p13",date:"2025-03-01",ticker:"9432.T",company:"NTT",direction:"up",targetPrice:190,predictionDate:"2025-03-01",resultDate:"2025-04-01",likes:1100,retweets:380,replies:140,text:"NTT、通信インフラ強化で190円到達予想📡"},
    {id:"p14",date:"2025-03-20",ticker:"6902.T",company:"デンソー",direction:"up",targetPrice:2500,predictionDate:"2025-03-20",resultDate:"2025-04-20",likes:760,retweets:290,replies:88,text:"デンソー、車載半導体回復で2,500円超え"},
    {id:"p15",date:"2025-04-19",ticker:"6857.T",company:"アドバンテスト",direction:"up",targetPrice:8000,predictionDate:"2025-04-19",resultDate:"2025-05-19",likes:2200,retweets:860,replies:340,text:"アドバンテスト、AI半導体テスト受注残が過去最高水準。7,200円以下は押し目買い🎯",isLatest:true},
  ]},
  { id:5, handle:"@yuriko_invest", name:"ゆりこ@主婦投資家", avatar:"YI", avatarColor:"#e11d7a", followers:29100, posts:[
    {id:"p16",date:"2025-03-03",ticker:"8411.T",company:"みずほFG",direction:"up",targetPrice:3600,predictionDate:"2025-03-03",resultDate:"2025-04-03",likes:2200,retweets:940,replies:380,text:"みずほFG、配当利回り高く割安。3,600円まで上昇余地あり💰"},
    {id:"p17",date:"2025-03-25",ticker:"7751.T",company:"キヤノン",direction:"up",targetPrice:4500,predictionDate:"2025-03-25",resultDate:"2025-04-25",likes:880,retweets:310,replies:120,text:"キヤノン、カメラ需要回復で4,500円予想"},
    {id:"p18",date:"2025-04-21",ticker:"2914.T",company:"JT（日本たばこ）",direction:"up",targetPrice:4800,predictionDate:"2025-04-21",resultDate:"2025-05-21",likes:1640,retweets:580,replies:230,text:"JT、円安メリット＋高配当の安定感。4,400円台での仕込みが正解。長期でも◎💐",isLatest:true},
  ]},
  { id:6, handle:"@short_hunter_fx", name:"ショートハンター", avatar:"SH", avatarColor:"#dc2626", followers:24600, posts:[
    {id:"p19",date:"2025-02-22",ticker:"4689.T",company:"LINEヤフー",direction:"down",targetPrice:400,predictionDate:"2025-02-22",resultDate:"2025-03-22",likes:1680,retweets:720,replies:290,text:"LINEヤフー、個人情報問題長期化で400円台へ下落"},
    {id:"p20",date:"2025-03-12",ticker:"6098.T",company:"リクルートHD",direction:"down",targetPrice:9000,predictionDate:"2025-03-12",resultDate:"2025-04-12",likes:920,retweets:340,replies:160,text:"リクルート、人材市場鈍化で9,000円まで調整リスク"},
    {id:"p21",date:"2025-04-20",ticker:"9983.T",company:"ファーストリテイリング",direction:"down",targetPrice:38000,predictionDate:"2025-04-20",resultDate:"2025-05-20",likes:1880,retweets:760,replies:320,text:"ユニクロ、中国消費低迷＋円高反転リスクで調整必至。42,000円超えはショートのチャンス⚠️",isLatest:true},
  ]},
  { id:7, handle:"@ai_kabu_bot", name:"AI株分析bot🤖", avatar:"AI", avatarColor:"#0891b2", followers:19800, posts:[
    {id:"p22",date:"2025-03-08",ticker:"6723.T",company:"ルネサス",direction:"up",targetPrice:3000,predictionDate:"2025-03-08",resultDate:"2025-04-08",likes:540,retweets:180,replies:60,text:"ルネサス、車載MCU好調で3,000円到達"},
    {id:"p23",date:"2025-03-28",ticker:"6857.T",company:"アドバンテスト",direction:"up",targetPrice:7500,predictionDate:"2025-03-28",resultDate:"2025-04-25",likes:1200,retweets:460,replies:190,text:"アドバンテスト、AI半導体テスト需要で7,500円超え予想"},
    {id:"p24",date:"2025-04-23",ticker:"6920.T",company:"レーザーテック",direction:"up",targetPrice:22000,predictionDate:"2025-04-23",resultDate:"2025-05-23",likes:1340,retweets:510,replies:200,text:"レーザーテック、EUV関連受注が急回復。18,000円台は支持帯。22,000円まで上昇余力あり📊",isLatest:true},
  ]},
  { id:8, handle:"@value_trap_jp", name:"バリュートラップ", avatar:"VT", avatarColor:"#16a34a", followers:16200, posts:[
    {id:"p25",date:"2025-03-05",ticker:"5108.T",company:"ブリヂストン",direction:"up",targetPrice:5800,predictionDate:"2025-03-05",resultDate:"2025-04-05",likes:430,retweets:150,replies:55,text:"ブリヂストン、タイヤ需要安定で5,500円割れで買い場"},
    {id:"p26",date:"2025-04-05",ticker:"7270.T",company:"SUBARU",direction:"up",targetPrice:4000,predictionDate:"2025-04-05",resultDate:"2025-04-25",likes:310,retweets:100,replies:40,text:"SUBARU、SUV需要で4,000円台回復へ"},
    {id:"p27",date:"2025-04-22",ticker:"8058.T",company:"三菱商事",direction:"up",targetPrice:3200,predictionDate:"2025-04-22",resultDate:"2025-05-22",likes:980,retweets:340,replies:140,text:"三菱商事、バフェット効果継続＋資源高で2,800円台は長期バリュー買い。3,200円中期目標🏢",isLatest:true},
  ]},
  { id:9, handle:"@makoto_kabu", name:"マコト株道場", avatar:"MK", avatarColor:"#7c3aed", followers:12400, posts:[
    {id:"p28",date:"2025-03-15",ticker:"9022.T",company:"JR東海",direction:"up",targetPrice:4500,predictionDate:"2025-03-15",resultDate:"2025-04-15",likes:680,retweets:240,replies:90,text:"JR東海、インバウンド回復で4,500円超え予想🚄"},
    {id:"p29",date:"2025-04-21",ticker:"9020.T",company:"JR東日本",direction:"up",targetPrice:3000,predictionDate:"2025-04-21",resultDate:"2025-05-21",likes:820,retweets:290,replies:110,text:"JR東日本、外国人観光客過去最高水準。2,600円台は押し目。Suica拡大も材料に🚃",isLatest:true},
  ]},
  { id:10, handle:"@growth_seeker", name:"グロース株ハンター", avatar:"GS", avatarColor:"#db2777", followers:9800, posts:[
    {id:"p30",date:"2025-03-18",ticker:"4478.T",company:"フリー",direction:"up",targetPrice:2000,predictionDate:"2025-03-18",resultDate:"2025-04-18",likes:380,retweets:120,replies:48,text:"フリー、中小DX加速で2,000円回復と予想"},
    {id:"p31",date:"2025-04-24",ticker:"4385.T",company:"メルカリ",direction:"up",targetPrice:2800,predictionDate:"2025-04-24",resultDate:"2025-05-24",likes:1100,retweets:420,replies:170,text:"メルカリ、US事業黒字化が現実味。2,200円台は絶好の仕込み場。2,800円を目指す🛍️",isLatest:true},
  ]},
  { id:11, handle:"@pension_trader", name:"年金運用マン", avatar:"PM", avatarColor:"#475569", followers:31800, posts:[
    {id:"p32",date:"2025-02-18",ticker:"8316.T",company:"三井住友FG",direction:"up",targetPrice:9500,predictionDate:"2025-02-18",resultDate:"2025-03-18",likes:1240,retweets:460,replies:180,text:"三井住友FG、金利上昇メリット継続。配当も魅力。9,500円へ"},
    {id:"p33",date:"2025-03-12",ticker:"4502.T",company:"武田薬品工業",direction:"up",targetPrice:4700,predictionDate:"2025-03-12",resultDate:"2025-04-12",likes:890,retweets:310,replies:120,text:"武田薬品、パイプライン充実で4,700円目標"},
    {id:"p34",date:"2025-04-17",ticker:"8031.T",company:"三井物産",direction:"up",targetPrice:3600,predictionDate:"2025-04-17",resultDate:"2025-05-17",likes:1580,retweets:610,replies:240,text:"三井物産、LNG事業拡大と資源価格高止まりで3,600円へ。3,200円割れは強い買い場💼",isLatest:true},
  ]},
  { id:12, handle:"@semiconductor_w", name:"半導体ウォッチャー", avatar:"SC", avatarColor:"#0f766e", followers:27400, posts:[
    {id:"p35",date:"2025-02-20",ticker:"6857.T",company:"アドバンテスト",direction:"up",targetPrice:7000,predictionDate:"2025-02-20",resultDate:"2025-03-20",likes:1780,retweets:680,replies:270,text:"アドバンテスト、HBMテスト需要急増で7,000円射程に"},
    {id:"p36",date:"2025-03-25",ticker:"6723.T",company:"ルネサス",direction:"up",targetPrice:2900,predictionDate:"2025-03-25",resultDate:"2025-04-25",likes:920,retweets:340,replies:130,text:"ルネサス、車載マイコン回復で2,900円目標"},
    {id:"p37",date:"2025-04-21",ticker:"6146.T",company:"ディスコ",direction:"up",targetPrice:50000,predictionDate:"2025-04-21",resultDate:"2025-05-21",likes:2100,retweets:820,replies:340,text:"ディスコ、ダイシング装置の受注が爆増。AI半導体製造に必須。43,000円台は買い場。50,000円へ🔧",isLatest:true},
  ]},
  { id:13, handle:"@dividend_queen", name:"配当女王👑", avatar:"DQ", avatarColor:"#be185d", followers:22100, posts:[
    {id:"p38",date:"2025-02-25",ticker:"9433.T",company:"KDDI",direction:"up",targetPrice:5000,predictionDate:"2025-02-25",resultDate:"2025-03-25",likes:1640,retweets:590,replies:220,text:"KDDI、安定配当＋通信料値上げで5,000円へ"},
    {id:"p39",date:"2025-03-20",ticker:"8591.T",company:"オリックス",direction:"up",targetPrice:3400,predictionDate:"2025-03-20",resultDate:"2025-04-20",likes:1100,retweets:410,replies:160,text:"オリックス、多角化経営で安定。3,400円へ"},
    {id:"p40",date:"2025-04-20",ticker:"9434.T",company:"ソフトバンク(通信)",direction:"up",targetPrice:2200,predictionDate:"2025-04-20",resultDate:"2025-05-20",likes:1820,retweets:680,replies:270,text:"ソフトバンク(通信)、配当利回り5%超え継続。2,000円割れは長期保有の絶好機💎",isLatest:true},
  ]},
  { id:14, handle:"@intraday_king", name:"デイトレ王", avatar:"DK", avatarColor:"#b45309", followers:18600, posts:[
    {id:"p41",date:"2025-03-03",ticker:"7203.T",company:"トヨタ自動車",direction:"up",targetPrice:3100,predictionDate:"2025-03-03",resultDate:"2025-03-17",likes:2300,retweets:890,replies:340,text:"トヨタ、決算発表前の仕込み。3,100円で利確予定"},
    {id:"p42",date:"2025-03-28",ticker:"9984.T",company:"ソフトバンクG",direction:"up",targetPrice:9200,predictionDate:"2025-03-28",resultDate:"2025-04-11",likes:1800,retweets:690,replies:260,text:"ソフトバンクG、ARM上昇で連動。9,200円を短期目標"},
    {id:"p43",date:"2025-04-23",ticker:"6758.T",company:"ソニーグループ",direction:"up",targetPrice:5200,predictionDate:"2025-04-23",resultDate:"2025-05-07",likes:2600,retweets:1020,replies:410,text:"ソニー決算前の仕込み。PS5＋映画好調で5,200円へ短期狙い。4,700円台が買い場📺",isLatest:true},
  ]},
  { id:15, handle:"@macro_bear_jp", name:"マクロベア🐻", avatar:"MB", avatarColor:"#991b1b", followers:15300, posts:[
    {id:"p44",date:"2025-02-28",ticker:"9984.T",company:"ソフトバンクG",direction:"down",targetPrice:7500,predictionDate:"2025-02-28",resultDate:"2025-03-28",likes:1120,retweets:430,replies:180,text:"ソフトバンクG、過大評価。AIバブル崩壊で7,500円まで調整"},
    {id:"p45",date:"2025-03-18",ticker:"6861.T",company:"キーエンス",direction:"down",targetPrice:60000,predictionDate:"2025-03-18",resultDate:"2025-04-18",likes:780,retweets:290,replies:120,text:"キーエンス、PER割高感。60,000円まで調整余地"},
    {id:"p46",date:"2025-04-22",ticker:"4689.T",company:"LINEヤフー",direction:"down",targetPrice:340,predictionDate:"2025-04-22",resultDate:"2025-05-22",likes:1340,retweets:530,replies:220,text:"LINEヤフー、規制リスク継続で第2波下落。400円台からさらに340円へ。戻り売り推奨🐻",isLatest:true},
  ]},
  { id:16, handle:"@esg_investor_jp", name:"ESG投資家🌱", avatar:"EG", avatarColor:"#15803d", followers:11700, posts:[
    {id:"p47",date:"2025-03-05",ticker:"6981.T",company:"村田製作所",direction:"up",targetPrice:3200,predictionDate:"2025-03-05",resultDate:"2025-04-05",likes:620,retweets:210,replies:80,text:"村田製作所、EV向け積層セラミックコンデンサ需要増で3,200円目標"},
    {id:"p48",date:"2025-04-10",ticker:"7735.T",company:"SCREENホールディングス",direction:"up",targetPrice:14000,predictionDate:"2025-04-10",resultDate:"2025-05-10",likes:840,retweets:300,replies:110,text:"SCREEN、洗浄装置の受注回復と脱炭素製造ラインで12,500円台は買い場。14,000円へ🌱",isLatest:true},
  ]},
  { id:17, handle:"@real_estate_eye", name:"不動産眼👁", avatar:"RE", avatarColor:"#0369a1", followers:8900, posts:[
    {id:"p49",date:"2025-03-10",ticker:"8802.T",company:"三菱地所",direction:"up",targetPrice:2400,predictionDate:"2025-03-10",resultDate:"2025-04-10",likes:540,retweets:180,replies:68,text:"三菱地所、インバウンド需要＋オフィス回帰で2,400円へ"},
    {id:"p50",date:"2025-04-18",ticker:"8830.T",company:"住友不動産",direction:"up",targetPrice:5200,predictionDate:"2025-04-18",resultDate:"2025-05-18",likes:720,retweets:240,replies:90,text:"住友不動産、都心高級マンション好調継続。4,700円台は割安水準。5,200円を中期目標に🏙️",isLatest:true},
  ]},
  { id:18, handle:"@fx_and_stocks", name:"FX兼業トレーダー", avatar:"FX", avatarColor:"#7e22ce", followers:7200, posts:[
    {id:"p51",date:"2025-03-15",ticker:"8411.T",company:"みずほFG",direction:"up",targetPrice:3800,predictionDate:"2025-03-15",resultDate:"2025-04-15",likes:410,retweets:140,replies:54,text:"円安継続でみずほFG、外貨収益拡大で3,800円へ"},
    {id:"p52",date:"2025-04-20",ticker:"6098.T",company:"リクルートHD",direction:"up",targetPrice:11000,predictionDate:"2025-04-20",resultDate:"2025-05-20",likes:880,retweets:320,replies:130,text:"リクルート、Indeed＋AIマッチング事業が急拡大。9,500円台は押し目買い。11,000円へ📊",isLatest:true},
  ]},
  { id:19, handle:"@tenbagger_hunter", name:"10倍株ハンター", avatar:"TH", avatarColor:"#c2410c", followers:6100, posts:[
    {id:"p53",date:"2025-03-08",ticker:"4385.T",company:"メルカリ",direction:"up",targetPrice:3000,predictionDate:"2025-03-08",resultDate:"2025-04-08",likes:690,retweets:240,replies:98,text:"メルカリ、フィンテック拡大で3,000円超えへ"},
    {id:"p54",date:"2025-04-22",ticker:"4565.T",company:"そーせいグループ",direction:"up",targetPrice:3200,predictionDate:"2025-04-22",resultDate:"2025-05-22",likes:760,retweets:280,replies:110,text:"そーせいグループ、欧州パートナーとの新薬提携で大化け期待。2,500円台が仕込み場🚀",isLatest:true},
  ]},
  { id:20, handle:"@quiet_compounder", name:"静かな複利家", avatar:"QC", avatarColor:"#334155", followers:4800, posts:[
    {id:"p55",date:"2025-03-01",ticker:"4502.T",company:"武田薬品工業",direction:"up",targetPrice:4900,predictionDate:"2025-03-01",resultDate:"2025-04-01",likes:280,retweets:90,replies:34,text:"武田薬品、海外収益比率高く円安メリット。長期保有推奨"},
    {id:"p56",date:"2025-04-19",ticker:"7974.T",company:"任天堂",direction:"up",targetPrice:10000,predictionDate:"2025-04-19",resultDate:"2025-05-19",likes:1240,retweets:480,replies:190,text:"任天堂、Switch2発表効果が本格化。8,500円台は長期仕込みの好機。10,000円まで待てる人向け🎮",isLatest:true},
  ]},
];

const SIM: Record<string, Record<string, number>> = {
  "7203.T":{"2025-02-20":2980,"2025-03-17":3050,"2025-03-31":3185},
  "6758.T":{"2025-03-05":4520,"2025-04-05":4930},
  "9984.T":{"2025-02-28":8900,"2025-03-18":8740,"2025-03-28":8320,"2025-04-11":8980,"2025-04-18":7820},
  "6501.T":{"2025-02-25":9800,"2025-03-25":10620},
  "8306.T":{"2025-03-10":1640,"2025-04-10":1890},
  "7267.T":{"2025-03-22":1560,"2025-04-22":1390},
  "6367.T":{"2025-02-28":22400,"2025-03-28":23100},
  "4063.T":{"2025-03-15":5620,"2025-04-15":5980},
  "2413.T":{"2025-04-01":1920,"2025-04-25":1740},
  "9432.T":{"2025-03-01":175,"2025-04-01":183},
  "6902.T":{"2025-03-20":2310,"2025-04-20":2480},
  "8411.T":{"2025-03-03":3420,"2025-03-15":3480,"2025-04-03":3580,"2025-04-15":3720},
  "7751.T":{"2025-03-25":4200,"2025-04-25":4380},
  "4689.T":{"2025-02-22":460,"2025-03-22":388},
  "6098.T":{"2025-03-12":9800,"2025-04-12":8750},
  "6723.T":{"2025-03-08":2760,"2025-03-25":2840,"2025-04-08":2920,"2025-04-25":2880},
  "6857.T":{"2025-02-20":6400,"2025-03-20":6980,"2025-03-28":6980,"2025-04-25":7420},
  "5108.T":{"2025-03-05":5480,"2025-04-05":5650},
  "7270.T":{"2025-04-05":3780,"2025-04-25":3940},
  "9022.T":{"2025-03-15":4180,"2025-04-15":4380},
  "4478.T":{"2025-03-18":1680,"2025-04-18":1940},
  "8316.T":{"2025-02-18":8900,"2025-03-18":9240},
  "4502.T":{"2025-03-01":4380,"2025-03-12":4520,"2025-04-01":4610,"2025-04-12":4690},
  "9433.T":{"2025-02-25":4700,"2025-03-25":4880},
  "8591.T":{"2025-03-20":3180,"2025-04-20":3310},
  "6981.T":{"2025-03-05":2840,"2025-04-05":2980},
  "8802.T":{"2025-03-10":2180,"2025-04-10":2320},
  "4385.T":{"2025-03-08":2100,"2025-04-08":2350},
  "6861.T":{"2025-03-18":67200,"2025-04-18":65800},
};

function getPriceAt(ticker: string, date: string): number | null {
  const map = SIM[ticker]; if (!map) return null;
  if (map[date]) return map[date];
  const keys = Object.keys(map).sort();
  let best: number | null = null, bestDiff = Infinity;
  const target = new Date(date).getTime();
  for (const k of keys) { const d = Math.abs(new Date(k).getTime() - target); if (d < bestDiff) { bestDiff = d; best = map[k]; } }
  return best;
}
function evaluatePrediction(post: Post) {
  const s = getPriceAt(post.ticker, post.predictionDate), e = getPriceAt(post.ticker, post.resultDate);
  if (!s || !e) return { result: "pending" as const };
  return { result: ((e > s ? "up" : "down") === post.direction ? "hit" : "miss") as "hit"|"miss", startPrice: s, endPrice: e, changePct: ((e - s) / s * 100).toFixed(2) };
}
function calcHitRate(user: User) {
  const evs = user.posts.filter(p => !p.isLatest).map(evaluatePrediction).filter(e => e.result !== "pending");
  if (!evs.length) return null;
  const hits = evs.filter(e => e.result === "hit").length;
  return { rate: Math.round(hits / evs.length * 100), hits, total: evs.length };
}
function calcEngScore(user: User) {
  return Math.round(user.posts.reduce((s, p) => s + p.likes + p.retweets * 2 + p.replies * 1.5, 0) + Math.log10(user.followers + 1) * 800);
}

async function analyzeLatest(user: User, hitInfo: ReturnType<typeof calcHitRate>) {
  const latest = user.posts.find(p => p.isLatest); if (!latest) return null;
  const cur = CURRENT_PRICES[latest.ticker];
  const pastSummary = user.posts.filter(p => !p.isLatest).map(p => {
    const ev = evaluatePrediction(p);
    return `${p.date} [${p.company}] ${p.direction === "up" ? "↑" : "↓"} → ${ev.result === "hit" ? "的中" : ev.result === "miss" ? "外れ" : "不明"}`;
  }).join("\n");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514", max_tokens: 700,
      system: `あなたは株式投資アドバイザーです。以下のJSON形式のみで返答（マークダウン・コードブロック不要）:\n{"summary":"予想根拠と注目ポイント2文","buyZone":"推奨買い価格帯（例: ¥67,500〜¥68,500）","timing":"買いタイミング・条件1文","risk":"主なリスク1文","confidence":"high/medium/low"}`,
      messages: [{ role: "user", content: `ユーザー: ${user.name} / 的中率: ${hitInfo ? `${hitInfo.rate}% (${hitInfo.hits}/${hitInfo.total}件)` : "不明"}\n\n過去:\n${pastSummary}\n\n最新予想:\n銘柄: ${latest.company}(${latest.ticker})\n方向: ${latest.direction === "up" ? "↑強気" : "↓弱気"}\n目標: ¥${latest.targetPrice?.toLocaleString()}\n現在値: ${cur ? `¥${cur.price.toLocaleString()} (${cur.change >= 0 ? "+" : ""}${cur.change}%)` : "不明"}\n内容: "${latest.text}"\n\n買い時・タイミング・リスクを分析してください。` }]
    })
  });
  const d = await res.json();
  const raw = d.content?.[0]?.text ?? "{}";
  try { return JSON.parse(raw.replace(/```json|```/g, "").trim()); }
  catch { return { summary: raw, buyZone: "—", timing: "—", risk: "—", confidence: "medium" }; }
}

function PricePanel({ post }: { post: Post }) {
  const w = useWindowWidth();
  const isMobile = w < 520;
  const cur = CURRENT_PRICES[post.ticker];
  const isUp = post.direction === "up";
  const cp = cur?.price;
  const tp = post.targetPrice;
  const dipBuy = cp ? (isUp ? Math.round(cp * 0.962) : Math.round(cp * 1.038)) : null;
  const stopLoss = cp ? (isUp ? Math.round(cp * 0.925) : Math.round(cp * 1.075)) : null;
  const upsidePct = cp && tp ? (((tp - cp) / cp) * 100).toFixed(1) : null;
  const cols = [
    { label: "現在値", icon: "📊", value: cp ? `¥${cp.toLocaleString()}` : "—", sub: cur ? `${cur.change >= 0 ? "+" : ""}${cur.change}%` : "", subColor: cur ? (cur.change >= 0 ? C.green : C.red) : C.textLight, bg: "#f8f8f6", border: C.border, labelColor: C.textMid, valueColor: C.text },
    { label: "目標価格", icon: "🎯", value: tp ? `¥${tp.toLocaleString()}` : "—", sub: upsidePct ? `${isUp ? "+" : ""}${upsidePct}%` : "", subColor: isUp ? C.green : C.red, bg: isUp ? C.greenSoft : C.redSoft, border: isUp ? `${C.green}40` : `${C.red}40`, labelColor: isUp ? C.green : C.red, valueColor: isUp ? C.green : C.red },
    { label: isUp ? "押し目買い" : "戻り売り", icon: isUp ? "📉" : "📈", value: dipBuy ? `¥${dipBuy.toLocaleString()}` : "—", sub: cp && dipBuy ? `現在比 ${((dipBuy - cp) / cp * 100).toFixed(1)}%` : "", subColor: C.accent, bg: C.accentSoft, border: `${C.accent}40`, labelColor: C.accent, valueColor: C.accent },
    { label: "撤退価格", icon: "🛑", value: stopLoss ? `¥${stopLoss.toLocaleString()}` : "—", sub: cp && stopLoss ? `現在比 ${((stopLoss - cp) / cp * 100).toFixed(1)}%` : "", subColor: C.red, bg: "#fff8f8", border: `${C.red}30`, labelColor: C.red, valueColor: C.red },
  ];
  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 8, marginTop: 12, marginBottom: 4 }}>
      {cols.map((col, i) => (
        <div key={i} style={{ background: col.bg, border: `1px solid ${col.border}`, borderRadius: 10, padding: isMobile ? "9px 8px" : "10px 12px", textAlign: "center" }}>
          <div style={{ fontSize: 11, marginBottom: 2 }}>{col.icon}</div>
          <div style={{ fontSize: 9, color: col.labelColor, fontWeight: 700, letterSpacing: 0.2, marginBottom: 3 }}>{col.label}</div>
          <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: isMobile ? 12 : 14, fontWeight: 800, color: col.valueColor, lineHeight: 1 }}>{col.value}</div>
          {col.sub && <div style={{ fontSize: 9, color: col.subColor, marginTop: 3, fontWeight: 600 }}>{col.sub}</div>}
        </div>
      ))}
    </div>
  );
}

function RankMedal({ rank }: { rank: number }) {
  if (rank === 1) return <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#fef3c7,#fde68a)", border: "1.5px solid #f59e0b60", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 20 }}>🥇</span></div>;
  if (rank === 2) return <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#f1f5f9,#e2e8f0)", border: "1.5px solid #94a3b860", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 20 }}>🥈</span></div>;
  if (rank === 3) return <div style={{ width: 44, height: 44, borderRadius: 12, background: "linear-gradient(135deg,#fef3e2,#fde8c0)", border: "1.5px solid #b4530960", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 20 }}>🥉</span></div>;
  return <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f4f3f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 15, color: C.textLight }}>#{rank}</div>;
}

function HitBar({ info }: { info: ReturnType<typeof calcHitRate> }) {
  if (!info) return <span style={{ fontSize: 11, color: C.textLight }}>実績なし</span>;
  const color = info.rate >= 70 ? C.green : info.rate >= 50 ? C.amber : C.red;
  const bg = info.rate >= 70 ? C.greenSoft : info.rate >= 50 ? C.amberSoft : C.redSoft;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ background: bg, color, fontWeight: 800, fontSize: 13, padding: "3px 12px", borderRadius: 20, fontFamily: "'DM Sans',sans-serif", border: `1.5px solid ${color}40`, minWidth: 56, textAlign: "center" }}>{info.rate}%</div>
      <div style={{ flex: 1, height: 5, background: C.border, borderRadius: 3, overflow: "hidden", minWidth: 50 }}><div style={{ width: `${info.rate}%`, height: "100%", background: color, borderRadius: 3 }} /></div>
      <span style={{ fontSize: 11, color: C.textLight, whiteSpace: "nowrap" }}>{info.hits}/{info.total}件</span>
    </div>
  );
}

function DirectionTag({ dir }: { dir: "up" | "down" }) {
  return <span style={{ background: dir === "up" ? C.greenSoft : C.redSoft, color: dir === "up" ? C.green : C.red, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 16, border: `1px solid ${dir === "up" ? C.green : C.red}30` }}>{dir === "up" ? "↑ 強気" : "↓ 弱気"}</span>;
}

function PastRow({ post }: { post: Post }) {
  const ev = evaluatePrediction(post);
  const color = ev.result === "hit" ? C.green : ev.result === "miss" ? C.red : C.textLight;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "7px 10px", background: ev.result === "hit" ? C.greenSoft : ev.result === "miss" ? C.redSoft : "#f4f3f0", borderRadius: 7, marginBottom: 5, border: `1px solid ${color}20`, flexWrap: "wrap" }}>
      <span style={{ fontSize: 10, color: C.textLight, flexShrink: 0 }}>{post.date}</span>
      <a href={`https://www.rakuten-sec.co.jp/web/market/search/?q=${post.ticker.replace(".T", "")}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: C.text, fontWeight: 600, flex: 1, minWidth: 80, textDecoration: "none", borderBottom: `1px solid ${C.accent}50` }}>{post.company}</a>
      <DirectionTag dir={post.direction} />
      <span style={{ fontSize: 11, fontWeight: 700, color, background: `${color}15`, padding: "1px 8px", borderRadius: 10, flexShrink: 0 }}>{ev.result === "hit" ? "✓ 的中" : ev.result === "miss" ? "✗ 外れ" : "検証中"}</span>
      {"changePct" in ev && ev.changePct && <span style={{ fontSize: 11, color: Number(ev.changePct) >= 0 ? C.green : C.red, fontWeight: 700, flexShrink: 0 }}>{Number(ev.changePct) >= 0 ? "+" : ""}{ev.changePct}%</span>}
    </div>
  );
}

function PickCard({ user, rank }: { user: User; rank: number }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<Record<string, string> | null>(null);
  const [showPast, setShowPast] = useState(false);
  const hitInfo = calcHitRate(user);
  const latest = user.posts.find(p => p.isLatest);
  const pastPosts = user.posts.filter(p => !p.isLatest);
  const cur = latest ? CURRENT_PRICES[latest.ticker] : null;

  async function handleAI() {
    if (ai) { setOpen(o => !o); return; }
    setLoading(true); setOpen(true);
    const res = await analyzeLatest(user, hitInfo);
    setAi(res); setLoading(false);
  }

  const borderTop = rank === 1 ? "3px solid #f59e0b" : rank === 2 ? "3px solid #94a3b8" : rank === 3 ? "3px solid #b45309" : "3px solid transparent";
  return (
    <div style={{ background: C.card, borderRadius: 14, border: `1px solid ${C.border}`, borderTop, boxShadow: C.shadow, marginBottom: 12, transition: "box-shadow 0.2s,transform 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadowHover; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = C.shadow; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}>
      <div style={{ padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
          <RankMedal rank={rank} />
          <div style={{ width: 42, height: 42, borderRadius: "50%", background: `${user.avatarColor}18`, border: `2px solid ${user.avatarColor}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: user.avatarColor, fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>{user.avatar}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 3 }}>
              <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 15, color: C.text }}>{user.name}</span>
              <span style={{ fontSize: 11, color: C.textLight }}>{user.handle}</span>
            </div>
            <HitBar info={hitInfo} />
            <div style={{ fontSize: 11, color: C.textLight, marginTop: 4 }}>フォロワー {user.followers.toLocaleString()} · スコア {calcEngScore(user).toLocaleString()}</div>
          </div>
        </div>

        {latest && (
          <div style={{ background: "linear-gradient(135deg,#f0f7ff 0%,#f5f0ff 100%)", borderRadius: 12, padding: "14px 14px 12px", border: `1px solid ${C.accent}20` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: .8, color: C.accent, background: C.accentSoft, padding: "2px 10px", borderRadius: 12, border: `1px solid ${C.accent}30` }}>📌 最新ピック · {latest.date}</span>
              <DirectionTag dir={latest.direction} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 2 }}>
              <a href={`https://www.rakuten-sec.co.jp/web/market/search/?q=${latest.ticker.replace(".T", "")}`} target="_blank" rel="noopener noreferrer" title="楽天証券で見る"
                style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 19, color: C.text, lineHeight: 1, textDecoration: "none", borderBottom: `2px solid ${C.accent}60`, paddingBottom: 1 }}
                onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.accent; }}
                onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.color = C.text; }}>{latest.company}</a>
              <a href={`https://www.rakuten-sec.co.jp/web/market/search/?q=${latest.ticker.replace(".T","")}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#bf0000", background: "#fff0f0", padding: "2px 10px", borderRadius: 8, textDecoration: "none", border: "1px solid #bf000030", fontWeight: 700 }}>楽天証券 🔗</a>
              <a href={`https://jp.tradingview.com/chart/?symbol=TSE:${latest.ticker.replace(".T","")}`} target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#1c6ef3", background: "#eef3ff", padding: "2px 10px", borderRadius: 8, textDecoration: "none", border: "1px solid #1c6ef330", fontWeight: 700 }}>TradingView 📈</a>
              {cur && (
                <div style={{ display: "flex", alignItems: "center", gap: 5, background: cur.change >= 0 ? "#e6f7f0" : "#fceaea", border: `1px solid ${cur.change >= 0 ? C.green : C.red}40`, borderRadius: 20, padding: "3px 10px" }}>
                  <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 14, color: cur.change >= 0 ? C.green : C.red }}>¥{cur.price.toLocaleString()}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cur.change >= 0 ? C.green : C.red }}>{cur.change >= 0 ? "+" : ""}{cur.change}%</span>
                </div>
              )}
            </div>
            <PricePanel post={latest} />
            <p style={{ fontSize: 13, color: C.textMid, lineHeight: 1.65, margin: "10px 0 8px" }}>{latest.text}</p>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: C.textLight }}>
              <span>❤ {latest.likes.toLocaleString()}</span><span>🔁 {latest.retweets.toLocaleString()}</span><span>💬 {latest.replies.toLocaleString()}</span>
            </div>
          </div>
        )}

        {open && (
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            {loading ? (
              <div style={{ textAlign: "center", padding: "22px", background: "#fafaf8", borderRadius: 10, border: `1px solid ${C.border}`, color: C.textLight, fontSize: 13 }}>✨ Claude AIが分析中です…</div>
            ) : ai && (
              <div style={{ background: "#fafaf8", borderRadius: 10, border: `1px solid ${C.border}`, padding: "14px 16px" }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1, color: C.textMid, marginBottom: 10 }}>🤖 AI分析レポート</div>
                <p style={{ fontSize: 13, color: C.text, lineHeight: 1.72, margin: "0 0 12px" }}>{ai.summary}</p>
                <div style={{ background: latest?.direction === "up" ? C.greenSoft : C.redSoft, border: `1px solid ${latest?.direction === "up" ? C.green : C.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 8 }}>
                  <div style={{ fontSize: 10, color: C.textMid, marginBottom: 3 }}>{latest?.direction === "up" ? "💚 AI推奨買いゾーン" : "🔴 AI推奨売りゾーン"}</div>
                  <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 17, fontWeight: 800, color: latest?.direction === "up" ? C.green : C.red }}>{ai.buyZone}</div>
                  <div style={{ fontSize: 12, color: C.textMid, marginTop: 3 }}>{ai.timing}</div>
                </div>
                <div style={{ background: C.amberSoft, border: `1px solid ${C.amber}30`, borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: C.textMid }}>⚠️ <strong>リスク:</strong> {ai.risk}</div>
                {(() => { const mp: Record<string, {w:string;c:string;l:string}> = { high: { w: "85%", c: C.green, l: "信頼度 高" }, medium: { w: "55%", c: C.amber, l: "信頼度 中" }, low: { w: "28%", c: C.red, l: "信頼度 低" } }; const m = mp[ai.confidence] || mp.medium; return <div style={{ display: "flex", alignItems: "center", gap: 8 }}><div style={{ flex: 1, height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}><div style={{ width: m.w, height: "100%", background: m.c, borderRadius: 2 }} /></div><span style={{ fontSize: 11, color: m.c, fontWeight: 700 }}>{m.l}</span></div>; })()}
              </div>
            )}
          </div>
        )}

        {showPast && pastPosts.length > 0 && (
          <div style={{ marginTop: 10, marginBottom: 4 }}>
            <div style={{ fontSize: 11, color: C.textMid, fontWeight: 700, marginBottom: 6 }}>過去の予想実績</div>
            {pastPosts.map(p => <PastRow key={p.id} post={p} />)}
          </div>
        )}

        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          <button onClick={handleAI} disabled={loading} style={{ background: loading ? "#e8f1fd" : C.accent, color: loading ? C.accent : "#fff", border: `1px solid ${loading ? C.accent + "40" : "transparent"}`, borderRadius: 8, padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: loading ? "default" : "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all 0.15s" }}>
            {loading ? "分析中…" : ai && open ? "✕ AI分析を閉じる" : "✨ AI分析・詳細を見る"}
          </button>
          {pastPosts.length > 0 && <button onClick={() => setShowPast(s => !s)} style={{ background: "transparent", color: C.textMid, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" }}>{showPast ? "▲ 実績を隠す" : `▼ 過去${pastPosts.length}件の実績`}</button>}
        </div>
      </div>
    </div>
  );
}

function LiveTicker({ users }: { users: User[] }) {
  const [ts, setTs] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setTs(new Date()), 1000); return () => clearInterval(id); }, []);
  const allEvs = users.flatMap(u => u.posts.filter(p => !p.isLatest).map(evaluatePrediction)).filter(e => e.result !== "pending");
  const globalRate = allEvs.length ? Math.round(allEvs.filter(e => e.result === "hit").length / allEvs.length * 100) : 0;
  return (
    <div style={{ background: "linear-gradient(90deg,#1e293b,#0f172a)", color: "#94a3b8", fontSize: 11, padding: "6px 24px", display: "flex", alignItems: "center", gap: 20, overflow: "hidden" }}>
      <span style={{ color: "#64ffda", fontFamily: "'DM Sans',sans-serif", fontWeight: 700, whiteSpace: "nowrap" }}>🟢 LIVE {ts.toLocaleTimeString("ja-JP")}</span>
      <span>全体的中率 <strong style={{ color: "#fff" }}>{globalRate}%</strong></span>
      <span>分析対象 <strong style={{ color: "#fff" }}>20名</strong></span>
      <span style={{ color: "#475569", marginLeft: "auto", whiteSpace: "nowrap" }}>デモデータ · 投資判断への使用不可</span>
    </div>
  );
}

export default function App() {
  const w = useWindowWidth();
  const [loaded, setLoaded] = useState(false);
  const [filter, setFilter] = useState("all");
  useEffect(() => { setTimeout(() => setLoaded(true), 150); }, []);

  const ranked = [...DEMO_USERS].map(u => ({ ...u, _hit: calcHitRate(u) })).sort((a, b) => {
    if (a._hit === null && b._hit === null) return 0;
    if (a._hit === null) return 1; if (b._hit === null) return -1;
    return b._hit.rate - a._hit.rate;
  });

  const displayed = filter === "all" ? ranked : ranked.filter(u => { const l = u.posts.find(p => p.isLatest); return l && l.direction === filter; });
  const allEvs = ranked.flatMap(u => u.posts.filter(p => !p.isLatest).map(evaluatePrediction)).filter(e => e.result !== "pending");
  const globalRate = allEvs.length ? Math.round(allEvs.filter(e => e.result === "hit").length / allEvs.length * 100) : 0;
  const upCount = ranked.filter(u => u.posts.find(p => p.isLatest)?.direction === "up").length;
  const downCount = ranked.filter(u => u.posts.find(p => p.isLatest)?.direction === "down").length;

  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Noto Sans JP',sans-serif", color: C.text }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      <LiveTicker users={DEMO_USERS} />
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "0 24px" }}>
        <div style={{ maxWidth: 860, margin: "0 auto", height: 54, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ fontSize: 15 }}>📈</span></div>
            <span style={{ fontFamily: "'DM Sans',sans-serif", fontWeight: 800, fontSize: 17, color: C.text }}>KabuCheck</span>
            <span style={{ fontSize: 10, color: C.textLight, background: "#f0f0ec", padding: "2px 8px", borderRadius: 10 }}>β Demo</span>
          </div>
          <span style={{ fontSize: 12, color: C.textLight, display: w < 520 ? "none" : "inline" }}>的中率ランキング · 20名</span>
          <a href="/admin" style={{ fontSize: 12, color: "#fff", background: C.accent, padding: "7px 16px", borderRadius: 8, textDecoration: "none", fontWeight: 700, fontFamily: "'DM Sans',sans-serif" }}>🔄 ランキング更新</a>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "28px 16px 60px", opacity: loaded ? 1 : 0, transition: "opacity 0.5s" }}>
        <div style={{ marginBottom: 22 }}>
          <h1 style={{ fontFamily: "'DM Sans',sans-serif", fontSize: "clamp(22px,4.5vw,36px)", fontWeight: 800, color: C.text, margin: "0 0 8px", lineHeight: 1.2, letterSpacing: -0.5 }}>株予想インフルエンサー<br />的中率ランキング TOP 20</h1>
          <p style={{ fontSize: 13, color: C.textMid, margin: 0, lineHeight: 1.7 }}>各銘柄の現在値・目標価格・押し目買い価格・撤退価格を自動算出。Claude AIが最新ピックを分析します。</p>
        </div>

        {/* Stats バー */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14, padding: "10px 14px", background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, boxShadow: C.shadow, alignItems: "center" }}>
          {[
            { icon: "🎯", label: "的中率", val: `${globalRate}%`, sub: `${allEvs.filter(e => e.result === "hit").length}/${allEvs.length}件` },
            { icon: "👥", label: "分析", val: "20名" },
            { icon: "📈", label: "強気", val: `${upCount}銘柄` },
            { icon: "📉", label: "弱気", val: `${downCount}銘柄` },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 12, borderRight: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 15 }}>{s.icon}</span>
              <div>
                <div style={{ fontSize: 9, color: C.textLight, lineHeight: 1 }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 15, fontWeight: 800, color: C.text, lineHeight: 1.2 }}>{s.val}</div>
                {"sub" in s && s.sub && <div style={{ fontSize: 9, color: C.textLight }}>{s.sub}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Filter + 凡例 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, color: C.textMid }}>フィルター:</span>
          {[["all", "すべて"], ["up", "↑ 強気のみ"], ["down", "↓ 弱気のみ"]].map(([v, label]) => (
            <button key={v} onClick={() => setFilter(v)} style={{ background: filter === v ? C.accent : "transparent", color: filter === v ? "#fff" : C.textMid, border: `1px solid ${filter === v ? C.accent : C.border}`, borderRadius: 8, padding: "6px 14px", fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 600, transition: "all 0.15s" }}>{label}</button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontSize: 10, color: C.textMid, fontWeight: 700 }}>凡例:</span>
            {[
              { icon: "📊", label: "現在値" },
              { icon: "🎯", label: "目標" },
              { icon: "📉", label: "押し目 −4%" },
              { icon: "🛑", label: "撤退 −7.5%" },
            ].map((l, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11 }}>{l.icon}</span>
                <span style={{ fontSize: 10, color: C.textMid }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        {displayed.map(u => <PickCard key={u.id} user={u} rank={ranked.indexOf(u) + 1} />)}

        <p style={{ textAlign: "center", fontSize: 11, color: C.textLight, marginTop: 28, lineHeight: 1.8 }}>
          KabuCheck · デモ版 · 投資判断にはご利用いただけません<br />価格データはデモ用の仮データです
        </p>
      </div>
    </div>
  );
}
