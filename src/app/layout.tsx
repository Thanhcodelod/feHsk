import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "HSK Master — Luyện thi tiếng Trung cho người Việt",
  description:
    "Nền tảng luyện thi HSK 1–6: Nghe, Đọc, Viết, Nói, Từ vựng & Phát âm. Chấm bài tức thì, giải thích bằng tiếng Việt.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className="min-h-screen bg-background antialiased">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 sm:px-6">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
