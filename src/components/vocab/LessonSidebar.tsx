import Link from "next/link";
import {
  BookOpen,
  Languages,
  Baseline,
  Type as TypeIcon,
  PenLine,
  Headphones,
  Layers,
  Keyboard,
  PencilLine,
  Link2,
  Grid3x3,
  Shuffle,
  ChevronRight,
  Lock,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { MODES } from "@/lib/vocab-modes";
import { cn } from "@/lib/utils";

const MODE_ICON: Record<string, React.ElementType> = {
  vocab: BookOpen,
  meaning: Languages,
  pinyin: Baseline,
  word: TypeIcon,
  "fill-blank": PenLine,
  listening: Headphones,
  flashcard: Layers,
  typing: Keyboard,
  stroke: PencilLine,
  matching: Link2,
  radical: Grid3x3,
  mixed: Shuffle,
};

export interface SidebarLesson {
  num: number;
  count: number;
}

export function LessonSidebar({
  basePath,
  group,
  levelLabel,
  currentLesson,
  currentMode,
  lessons,
}: {
  basePath: string;
  group: string;
  levelLabel: string;
  currentLesson: number;
  currentMode: string; // "vocab" on the word list, else the mode slug
  lessons: SidebarLesson[];
}) {
  const groupPath = `${basePath}/${encodeURIComponent(group)}`;
  return (
    <aside className="space-y-3 lg:sticky lg:top-32 lg:self-start">
      <div className="flex items-center justify-between rounded-t-xl bg-primary px-4 py-3 text-primary-foreground">
        <span className="font-bold">{levelLabel}</span>
        <span className="text-xs opacity-90">{lessons.length} bài</span>
      </div>

      <div className="scroll-thin max-h-[70vh] space-y-2 overflow-y-auto pr-1">
        {lessons.map((l) => {
          const active = l.num === currentLesson;
          return (
            <Card key={l.num} className={cn(active && "border-primary/50")}>
              <CardContent className="p-2">
                <Link
                  href={`${groupPath}/${l.num}`}
                  className={cn(
                    "flex items-center justify-between rounded-lg px-2 py-1.5 text-sm",
                    active ? "font-semibold text-primary" : "hover:bg-secondary"
                  )}
                >
                  <span>
                    Bài {l.num}
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                      {l.count} từ
                    </span>
                  </span>
                </Link>

                {active ? (
                  <div className="mt-1 space-y-0.5">
                    {MODES.map((m) => {
                      const Icon = MODE_ICON[m.slug] ?? BookOpen;
                      const href =
                        m.kind === "list"
                          ? `${groupPath}/${l.num}`
                          : `${basePath}/practice/${encodeURIComponent(group)}/${l.num}/${m.slug}`;
                      const isCurrent = m.slug === currentMode;
                      const soon = m.kind === "soon";
                      return (
                        <Link
                          key={m.slug}
                          href={soon ? "#" : href}
                          aria-disabled={soon}
                          className={cn(
                            "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm transition-colors",
                            isCurrent
                              ? "bg-primary/10 font-medium text-primary"
                              : soon
                                ? "cursor-not-allowed text-muted-foreground/60"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          )}
                          onClick={soon ? (e) => e.preventDefault() : undefined}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="flex-1">{m.label}</span>
                          {soon ? (
                            <Lock className="size-3" />
                          ) : (
                            <ChevronRight className="size-3.5 opacity-60" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </aside>
  );
}
