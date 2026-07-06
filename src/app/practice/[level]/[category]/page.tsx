import { notFound } from "next/navigation";
import { TypePicker } from "@/components/practice/TypePicker";
import {
  HSK_LEVELS,
  QUESTION_CATEGORIES,
  type HSKLevel,
  type QuestionCategory,
} from "@/lib/types";

export default async function CategoryTypePickerPage({
  params,
}: {
  params: Promise<{ level: string; category: string }>;
}) {
  const { level, category } = await params;
  if (!HSK_LEVELS.includes(level as HSKLevel)) notFound();
  if (!QUESTION_CATEGORIES.includes(category as QuestionCategory)) notFound();

  return (
    <TypePicker
      level={level as HSKLevel}
      category={category as QuestionCategory}
    />
  );
}
