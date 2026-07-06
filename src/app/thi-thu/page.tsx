import Link from "next/link";
import { FileText, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HSK_LEVELS } from "@/lib/types";
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS } from "@/lib/labels";

export const metadata = { title: "Thi thử HSK · HSK Master" };

export default function ExamPickerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <FileText className="size-6 text-primary" /> Thi thử HSK
        </h1>
        <p className="mt-1 text-muted-foreground">
          Làm một đề mô phỏng có <strong>tính giờ</strong>, tự động chấm điểm và{" "}
          <strong>phân tích theo từng phần</strong>. Chọn cấp độ để bắt đầu.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
        <Clock className="size-4 shrink-0 text-accent" />
        Đề gồm các phần Nghe / Đọc (và Viết ở cấp cao). Bạn có thể đánh dấu câu,
        chuyển câu tự do, và nộp bất cứ lúc nào. Điểm đạt: <strong>≥ 60%</strong>.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HSK_LEVELS.map((level) => (
          <Link key={level} href={`/thi-thu/${level}`}>
            <Card className="group h-full transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md">
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <Badge variant="secondary" className="text-sm">
                    {LEVEL_LABELS[level]}
                  </Badge>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {LEVEL_DESCRIPTIONS[level]}
                  </p>
                </div>
                <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
