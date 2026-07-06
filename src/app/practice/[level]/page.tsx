import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Headphones,
  BookOpen,
  PenLine,
  Mic,
  Languages,
  ChevronLeft,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HSK_LEVELS, type HSKLevel, type QuestionCategory } from "@/lib/types";
import {
  CATEGORY_HANZI,
  CATEGORY_LABELS,
  LEVEL_LABELS,
} from "@/lib/labels";

const ICONS = {
  LISTENING: Headphones,
  READING: BookOpen,
  WRITING: PenLine,
  SPEAKING: Mic,
  VOCAB_PRONUNCIATION: Languages,
} as const;

const CATEGORY_DESC: Record<QuestionCategory, string> = {
  LISTENING: "Nghe hiểu: chọn hình, đúng/sai, hội thoại, đoạn văn.",
  READING: "Đọc hiểu: nối hình, điền từ, sắp xếp, tìm câu sai.",
  WRITING: "Viết & ngữ pháp: sắp xếp câu, sửa lỗi, viết đoạn văn.",
  SPEAKING: "Luyện nói: nhắc lại, tả tranh, trình bày quan điểm.",
  VOCAB_PRONUNCIATION: "Từ vựng: nghe viết, bộ thủ, phân biệt từ gần nghĩa.",
};

const ORDER: QuestionCategory[] = [
  "LISTENING",
  "READING",
  "WRITING",
  "SPEAKING",
  "VOCAB_PRONUNCIATION",
];

export function generateStaticParams() {
  return HSK_LEVELS.map((level) => ({ level }));
}

export default async function CategoryPickerPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  if (!HSK_LEVELS.includes(level as HSKLevel)) notFound();
  const lvl = level as HSKLevel;

  return (
    <div className="space-y-6">
      <Link
        href="/practice"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" /> Đổi cấp độ
      </Link>

      <div className="flex items-center gap-3">
        <Badge className="text-base">{LEVEL_LABELS[lvl]}</Badge>
        <h1 className="text-2xl font-bold">Chọn kỹ năng luyện tập</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ORDER.map((cat) => {
          const Icon = ICONS[cat];
          return (
            <Link key={cat} href={`/practice/${lvl}/${cat}`}>
              <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
                <CardContent className="flex items-start gap-4 p-5">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{CATEGORY_LABELS[cat]}</h3>
                      <span className="hanzi text-sm text-muted-foreground">
                        {CATEGORY_HANZI[cat]}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {CATEGORY_DESC[cat]}
                    </p>
                  </div>
                  <ArrowRight className="size-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
