import Link from "next/link";
import { ArrowRight, Dumbbell } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  LEVEL_DESCRIPTIONS,
  LEVEL_LABELS,
  TYPE_DESC,
  TYPE_HANZI,
  TYPE_LABELS,
} from "@/lib/labels";
import { HSK_LEVELS, type QuestionType } from "@/lib/types";

/**
 * Dedicated landing for one practice function (e.g. "Sắp xếp câu"). Shows a
 * tailored header + HSK level cards linking to `${basePath}/${level}`.
 */
export function FunctionLevelPicker({
  type,
  basePath,
}: {
  type: QuestionType;
  basePath: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Dumbbell className="size-6" />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold">{TYPE_LABELS[type]}</h1>
            <span className="hanzi text-lg text-muted-foreground">
              {TYPE_HANZI[type]}
            </span>
          </div>
          <p className="mt-1 text-muted-foreground">
            {TYPE_DESC[type]} Chọn cấp độ để bắt đầu.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {HSK_LEVELS.map((level) => (
          <Link key={level} href={`${basePath}/${level}`}>
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
