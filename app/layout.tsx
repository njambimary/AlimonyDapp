import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "AlimonyPay – Secure On-Chain Alimony Payments | Stacks",
  description:
    "Transparent, trustless alimony payment agreements deployed as smart contracts on the Stacks blockchain. Automated periodic payments, auditable history, and zero middlemen.",
  keywords: [
    "alimony",
    "stacks",
    "blockchain",
    "smart contract",
    "clarity",
    "decentralized",
    "payments",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
