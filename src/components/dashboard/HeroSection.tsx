"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, BookMarked, AudioLines, Flame } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { speak } from "@/lib/speech";
import { cn } from "@/lib/utils";

const FEATURED = [
  { hanzi: "你好", pinyin: "nǐ hǎo", vi: "Xin chào" },
  { hanzi: "谢谢", pinyin: "xièxie", vi: "Cảm ơn" },
  { hanzi: "学习", pinyin: "xuéxí", vi: "Học tập" },
  { hanzi: "朋友", pinyin: "péngyou", vi: "Bạn bè" },
  { hanzi: "中国", pinyin: "Zhōngguó", vi: "Trung Quốc" },
  { hanzi: "加油", pinyin: "jiāyóu", vi: "Cố lên" },
  { hanzi: "努力", pinyin: "nǔlì", vi: "Nỗ lực" },
];

const LEVELS = [1, 2, 3, 4, 5, 6];

export function HeroSection({
  streakDays,
  accuracyPct,
  name,
}: {
  streakDays: number;
  accuracyPct: number;
  name?: string | null;
}) {
  // Word of the day (deterministic by date, client-only).
  const [word, setWord] = React.useState(FEATURED[0]);
  React.useEffect(() => {
    const d = new Date();
    const dayOfYear = Math.floor(
      (d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000
    );
    setWord(FEATURED[dayOfYear % FEATURED.length]);
  }, []);

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-card to-accent/10 p-6 sm:p-8"
    >
      <div className="grid items-center gap-6 lg:grid-cols-2">
        {/* Left: greeting + CTAs */}
        <div>
          <p className="text-sm font-medium text-primary">
            你好{name ? `, ${name}` : ""} 👋
          </p>
          <h1 className="mt-1 text-2xl font-bold sm:text-3xl">
            Học tiếng Trung, chinh phục HSK mỗi ngày
          </h1>
          <p className="mt-2 max-w-lg text-muted-foreground">
            Luyện đủ 5 kỹ năng, từ vựng đa nguồn với SRS thông minh, mẫu câu, đọc
            hiểu và thi thử có chấm điểm.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/practice" className={cn(buttonVariants({ size: "lg" }))}>
              🚀 Bắt đầu học ngay
            </Link>
            <Link
              href="/tu-vung"
              className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
            >
              <BookMarked /> Khám phá khóa học
            </Link>
          </div>
        </div>

        {/* Right: featured word + level selector + streak */}
        <div className="space-y-4">
          {/* Word of the day */}
          <button
            type="button"
            onClick={() => void speak(word.hanzi, { rate: 0.8 })}
            className="group flex w-full flex-col items-center rounded-2xl border bg-card px-6 py-6 text-center shadow-sm transition-all hover:shadow-md"
          >
            <span className="hanzi text-5xl font-bold">{word.hanzi}</span>
            <span className="mt-2 text-lg text-primary">{word.pinyin}</span>
            <span className="text-sm text-muted-foreground">{word.vi}</span>
            <AudioLines className="mt-3 size-6 text-primary transition-transform group-hover:scale-110" />
          </button>

          <div className="grid grid-cols-2 gap-4">
            {/* HSK level selector */}
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex flex-wrap justify-center gap-1.5">
                {LEVELS.map((n) => (
                  <Link
                    key={n}
                    href={`/practice/HSK${n}`}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors",
                      n <= 3
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground hover:bg-primary/20 hover:text-primary"
                    )}
                  >
                    {n}
                  </Link>
                ))}
              </div>
              <p className="mt-2 text-center text-xs font-medium text-muted-foreground">
                HSK Level
              </p>
              <Progress value={accuracyPct} className="mt-1 h-1.5" />
            </div>

            {/* Streak */}
            <div className="flex flex-col items-center justify-center rounded-2xl border bg-accent/10 p-4">
              <Flame className="size-7 text-accent" />
              <span className="mt-1 text-2xl font-bold">{streakDays}</span>
              <span className="text-xs text-muted-foreground">ngày liên tiếp</span>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
