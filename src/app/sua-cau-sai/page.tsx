import { FunctionLessonLanding } from "@/components/practice/FunctionLessonLanding";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Sửa câu sai · HSK Master" };

export default function Page() {
  return (
    <FunctionLessonLanding
      config={FUNCTION_EXERCISES["sua-cau-sai"]}
      levelParam="1"
    />
  );
}
