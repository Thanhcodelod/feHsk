import Link from "next/link";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { HSK_LEVELS } from "@/lib/types";
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS, LEVEL_TIER } from "@/lib/labels";

export const metadata = { title: "Thi thử HSK · HSK Master" };

export default function ExamPickerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header — consistent with the lesson-based pages */}
      <div className="text-center">
        <h1 className="flex items-center justify-center gap-2 text-2xl font-bold sm:text-3xl">
          <FileText className="size-7 text-primary" /> Thi thử HSK
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Làm một đề mô phỏng có tính giờ, tự động chấm điểm và phân tích theo
          từng phần. Chọn cấp độ để bắt đầu.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
        <Clock className="size-4 shrink-0 text-accent" />
        Đề gồm các phần Nghe / Đọc (và Viết ở cấp cao). Bạn có thể đánh dấu câu,
        chuyển câu tự do, và nộp bất cứ lúc nào. Điểm đạt: <strong>≥ 60%</strong>.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {HSK_LEVELS.map((level) => (
          <Link
            key={level}
            href={`/thi-thu/${level}`}
            className="group rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold">{LEVEL_LABELS[level]}</p>
                <p className="text-xs font-medium text-primary/80">
                  {LEVEL_TIER[level]}
                </p>
              </div>
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:translate-x-0.5">
                <ArrowRight className="size-5" />
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {LEVEL_DESCRIPTIONS[level]}
            </p>
            <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Bắt đầu thi <ArrowRight className="size-3.5" />
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
