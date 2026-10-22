import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "冒冒 · 我们的手账", description: "朋友一起记录的小日子" };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="zh-CN"><body>{children}</body></html>}
