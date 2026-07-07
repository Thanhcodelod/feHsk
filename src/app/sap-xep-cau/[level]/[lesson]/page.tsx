import { FunctionLessonExercise } from "@/components/practice/FunctionLessonExercise";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Sắp xếp câu · HSK Master" };

export default async function SapXepCauLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ level: string; lesson: string }>;
  searchParams: Promise<{ c?: string }>;
}) {
  const { level, lesson } = await params;
  const { c } = await searchParams;
  const n = c ? Number(c) : NaN;
  return (
    <FunctionLessonExercise
      config={FUNCTION_EXERCISES["sap-xep-cau"]}
      levelParam={level}
      lessonParam={lesson}
      startAt={Number.isFinite(n) ? n : undefined}
    />
  );
}
