import Link from "next/link";
import { BookOpen, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HSK_LEVELS } from "@/lib/types";
import { LEVEL_DESCRIPTIONS, LEVEL_LABELS } from "@/lib/labels";

export const metadata = { title: "Đọc hiểu · HSK Master" };

export default function ReadingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <BookOpen className="size-6 text-primary" /> Đọc hiểu
        </h1>
        <p className="mt-1 text-muted-foreground">
          Luyện đọc hiểu theo cấp độ: nối hình, điền từ, sắp xếp đoạn văn, đọc
          đoạn văn trả lời câu hỏi, và tìm câu sai — có bật/tắt phiên âm.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HSK_LEVELS.map((level) => (
          <Link key={level} href={`/practice/${level}/READING`}>
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
