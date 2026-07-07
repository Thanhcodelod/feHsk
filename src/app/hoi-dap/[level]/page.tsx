import { FunctionLessonLanding } from "@/components/practice/FunctionLessonLanding";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Hỏi đáp · HSK Master" };

export default async function Page({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  return (
    <FunctionLessonLanding
      config={FUNCTION_EXERCISES["hoi-dap"]}
      levelParam={level}
    />
  );
}
