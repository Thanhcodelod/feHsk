import { FunctionLessonLanding } from "@/components/practice/FunctionLessonLanding";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Sắp xếp câu · HSK Master" };

export default async function SapXepCauLevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  return (
    <FunctionLessonLanding
      config={FUNCTION_EXERCISES["sap-xep-cau"]}
      levelParam={level}
    />
  );
}
