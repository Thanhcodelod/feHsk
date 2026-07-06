import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { CATEGORY_TYPES } from "@/lib/labels";
import {
  HSK_LEVELS,
  QUESTION_CATEGORIES,
  type HSKLevel,
  type QuestionCategory,
  type QuestionType,
} from "@/lib/types";

export default async function PracticeSessionPage({
  params,
}: {
  params: Promise<{ level: string; category: string; type: string }>;
}) {
  const { level, category, type } = await params;
  if (!HSK_LEVELS.includes(level as HSKLevel)) notFound();
  if (!QUESTION_CATEGORIES.includes(category as QuestionCategory)) notFound();

  // `all` = mixed practice; otherwise must be a valid type of this category.
  const validTypes = CATEGORY_TYPES[category as QuestionCategory];
  if (type !== "all" && !validTypes.includes(type as QuestionType)) notFound();

  return (
    <PracticeSession
      level={level as HSKLevel}
      category={category as QuestionCategory}
      type={type === "all" ? undefined : (type as QuestionType)}
    />
  );
}
