"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  GraduationCap,
  ChevronDown,
  LogIn,
  Languages,
  ArrowDownUp,
  XCircle,
  Baseline,
  MessageSquare,
  Flame,
  Briefcase,
  BookOpen,
  Book,
  Trophy,
  Library,
  MessageSquareQuote,
  FileText,
  BookText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

type Tone = "blue" | "violet" | "red" | "green" | "amber" | "cyan" | "pink" | "orange";
const TONE: Record<Tone, string> = {
  blue: "bg-blue-100 text-blue-600",
  violet: "bg-violet-100 text-violet-600",
  red: "bg-rose-100 text-rose-600",
  green: "bg-emerald-100 text-emerald-600",
  amber: "bg-amber-100 text-amber-600",
  cyan: "bg-cyan-100 text-cyan-600",
  pink: "bg-pink-100 text-pink-600",
  orange: "bg-orange-100 text-orange-600",
};

interface Item {
  icon: React.ElementType;
  title: string;
  desc: string;
  href: string;
  tone: Tone;
}

const PRACTICE: Item[] = [
  { icon: Languages, title: "Luyện dịch", desc: "Dịch câu Trung - Việt", href: "/luyen-dich", tone: "amber" },
  { icon: ArrowDownUp, title: "Sắp xếp câu", desc: "Sắp xếp từ thành câu đúng", href: "/sap-xep-cau", tone: "violet" },
  { icon: XCircle, title: "Sửa câu sai", desc: "Tìm và sửa lỗi ngữ pháp", href: "/sua-cau-sai", tone: "red" },
  { icon: Baseline, title: "Điền từ", desc: "Điền từ còn thiếu vào câu", href: "/dien-tu", tone: "cyan" },
  { icon: MessageSquare, title: "Hỏi đáp", desc: "Luyện phản xạ hội thoại Q&A", href: "/hoi-dap", tone: "green" },
];

const VOCAB: Item[] = [
  { icon: Flame, title: "Từ vựng HSK 3.0", desc: "Bộ lesson mới chuẩn HSK 3.0", href: "/vocab-hsk30", tone: "orange" },
  { icon: Briefcase, title: "Từ vựng chuyên ngành", desc: "Chia theo chuyên ngành, 15 từ một bài", href: "/vocab-major", tone: "green" },
  { icon: BookOpen, title: "Từ vựng HSK", desc: "Học từ vựng theo bài và cấp độ", href: "/vocab-hsk", tone: "red" },
  { icon: Book, title: "Từ vựng Boya", desc: "Học từ vựng giáo trình Boya", href: "/vocab-boya", tone: "green" },
  { icon: Trophy, title: "Từ vựng TOCFL", desc: "Học từ vựng phồn thể thi TOCFL", href: "/vocab-tocfl", tone: "violet" },
  { icon: Library, title: "Từ vựng chủ đề", desc: "Học từ vựng theo chủ đề giao tiếp", href: "/vocab-topic", tone: "blue" },
  { icon: MessageSquareQuote, title: "Mẫu câu", desc: "Học mẫu câu tiếng Trung theo chủ đề", href: "/mau-cau", tone: "cyan" },
];

const READING: Item[] = [
  { icon: FileText, title: "Đọc hiểu HSK", desc: "Đọc hiểu theo bài của giáo trình cũ", href: "/doc-hieu", tone: "green" },
  { icon: BookText, title: "Đọc hiểu HSK 3.0", desc: "Đọc hiểu theo lesson chuẩn HSK 3.0", href: "/doc-hieu", tone: "blue" },
];

function ItemRow({ item }: { item: Item }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-secondary"
    >
      <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", TONE[item.tone])}>
        <Icon className="size-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{item.title}</span>
        <span className="block text-xs text-muted-foreground">{item.desc}</span>
      </span>
    </Link>
  );
}

function Dropdown({
  label,
  children,
  width,
}: {
  label: string;
  children: React.ReactNode;
  width: string;
}) {
  return (
    <div className="group relative">
      <button
        type="button"
        className="inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground group-hover:text-primary"
      >
        {label}
        <ChevronDown className="size-3.5 transition-transform group-hover:rotate-180" />
      </button>
      {/* pt-2 bridges the hover gap so the panel stays open */}
      <div
        className={cn(
          "invisible absolute left-0 top-full z-50 pt-2 opacity-0 transition-all duration-150",
          "group-hover:visible group-hover:opacity-100",
          width
        )}
      >
        <div className="rounded-xl border bg-card p-2 shadow-xl">{children}</div>
      </div>
    </div>
  );
}

const TOP_LINKS = [
  { href: "/", label: "Trang chủ" },
  { href: "/practice", label: "GT hán ngữ" },
  { href: "/tu-vung/HSK30", label: "HSK 3.0" },
];
const AFTER_LINKS = [{ href: "/hoi-dap", label: "Hội thoại" }];
const END_LINKS = [
  { href: "/bo-thu", label: "Bộ thủ" },
  { href: "/thi-thu", label: "Luyện thi" },
  { href: "/thi-thu", label: "Luyện thi HSK 3.0" },
  { href: "/thi-thu", label: "Luyện thi mới" },
  { href: "/luyen-dich", label: "Dịch" },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  const linkCls = (href: string) =>
    cn(
      "whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition-colors",
      (href === "/" ? pathname === "/" : pathname.startsWith(href))
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    );

  return (
    <header className="sticky top-0 z-40 border-b bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      {/* Row 1: brand + account */}
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <GraduationCap className="size-5" />
          </span>
          <div className="leading-tight">
            <span className="block text-base font-bold">HSK Master</span>
            <span className="hidden text-xs text-muted-foreground sm:block">
              Học tiếng Trung · Luyện thi HSK
            </span>
          </div>
        </Link>

        <Link
          href="/tai-khoan"
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            pathname.startsWith("/tai-khoan")
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          {user ? (
            <>
              <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {(user.name || user.email)[0]?.toUpperCase()}
              </span>
              <span className="hidden max-w-[9rem] truncate sm:inline">
                {user.name || user.email}
              </span>
            </>
          ) : (
            <>
              <LogIn className="size-4" />
              <span className="hidden sm:inline">Đăng nhập</span>
            </>
          )}
        </Link>
      </div>

      {/* Row 2: mega-menu nav (flex-wrap so dropdowns aren't clipped) */}
      <div className="border-t">
        <nav className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-0.5 px-2 py-1 sm:px-4">
          {TOP_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}

          <Dropdown label="Luyện tập" width="w-[640px]">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  HSK cũ
                </p>
                {PRACTICE.map((it) => (
                  <ItemRow key={it.title} item={it} />
                ))}
              </div>
              <div className="border-l pl-2">
                <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-primary">
                  HSK 3.0
                </p>
                {PRACTICE.map((it) => (
                  <ItemRow key={it.title} item={{ ...it, title: it.title + " HSK 3.0" }} />
                ))}
              </div>
            </div>
          </Dropdown>

          <Dropdown label="Từ vựng" width="w-[360px]">
            {VOCAB.map((it) => (
              <ItemRow key={it.title} item={it} />
            ))}
          </Dropdown>

          {AFTER_LINKS.map((l) => (
            <Link key={l.label} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}

          <Dropdown label="Đọc hiểu" width="w-[340px]">
            {READING.map((it) => (
              <ItemRow key={it.title} item={it} />
            ))}
          </Dropdown>

          {END_LINKS.map((l, i) => (
            <Link key={l.label + i} href={l.href} className={linkCls(l.href)}>
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
