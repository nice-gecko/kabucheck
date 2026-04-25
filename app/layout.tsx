import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KabuCheck — 株予想インフルエンサー 的中率ランキング",
  description: "X(旧Twitter)の株予想インフルエンサーを的中率でランキング。Claude AIが最新ピックを分析し、買いゾーン・タイミング・リスクをお届けします。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;600;700;800&family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet"/>
      </head>
      <body>{children}</body>
    </html>
  );
}
