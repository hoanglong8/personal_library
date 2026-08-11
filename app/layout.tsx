import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import ThemeToggle from "@/components/ThemeToggle";
import AuthWidget from "@/components/AuthWidget";
import TuSachLink from "@/components/TuSachLink";
import AdminLink from "@/components/AdminLink";
import { SITE_TITLE } from "@/lib/content";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
});

export const metadata: Metadata = {
  title: "Thư viện số",
  description: "Portal học tập tương tác, sinh bởi foxai-learning-portal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("portal-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light");document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col antialiased">
        <header className="sticky top-0 z-10 border-b border-border bg-surface/90 backdrop-blur print:hidden">
          <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
            <Link href="/" className="font-mono text-sm font-medium text-ink">
              {SITE_TITLE}
            </Link>
            <div className="flex items-center gap-4">
              <TuSachLink />
              <AdminLink />
              <Link
                href="/chen-anh"
                className="text-xs text-paper-400 hover:text-accent transition-colors"
              >
                Chèn ảnh
              </Link>
              <AuthWidget />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-border py-8 text-center text-xs text-paper-400 print:hidden">
          Tạo bằng foxai-learning-portal · Nội dung tổng hợp từ tài liệu nguồn.
        </footer>
      </body>
    </html>
  );
}
