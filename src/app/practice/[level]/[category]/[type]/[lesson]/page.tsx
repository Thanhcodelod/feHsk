import { notFound } from "next/navigation";
import { FunctionLessonExercise } from "@/components/practice/FunctionLessonExercise";
import { buildPracticeConfig } from "@/lib/function-exercises";
import { CATEGORY_TYPES } from "@/lib/labels";
import {
  HSK_LEVELS,
  QUESTION_CATEGORIES,
  type HSKLevel,
  type QuestionCategory,
  type QuestionType,
} from "@/lib/types";

export default async function PracticeTypeLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{
    level: string;
    category: string;
    type: string;
    lesson: string;
  }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { level, category, type, lesson } = await params;
  if (!HSK_LEVELS.includes(level as HSKLevel)) notFound();
  if (!QUESTION_CATEGORIES.includes(category as QuestionCategory)) notFound();
  const validTypes = CATEGORY_TYPES[category as QuestionCategory];
  if (type !== "all" && !validTypes.includes(type as QuestionType)) notFound();

  const { c } = await searchParams;
  const n = c ? Number(c) : NaN;
  const config = buildPracticeConfig(
    level as HSKLevel,
    category as QuestionCategory,
    type
  );
  return (
    <FunctionLessonExercise
      config={config}
      fixedLevel={level as HSKLevel}
      lessonParam={lesson}
      startAt={Number.isFinite(n) ? n : undefined}
    />
  );
}
