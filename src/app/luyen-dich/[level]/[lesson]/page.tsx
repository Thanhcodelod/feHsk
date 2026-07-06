import { LuyenDichExercise } from "@/components/practice/LuyenDichExercise";

export const metadata = { title: "Luyện dịch · HSK Master" };

export default async function LuyenDichLessonPage({
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
    <LuyenDichExercise
      levelParam={level}
      lessonParam={lesson}
      startAt={Number.isFinite(n) ? n : undefined}
    />
  );
}
