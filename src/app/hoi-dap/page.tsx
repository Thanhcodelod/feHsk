import { FunctionLessonLanding } from "@/components/practice/FunctionLessonLanding";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Hỏi đáp · HSK Master" };

export default function Page() {
  return (
    <FunctionLessonLanding
      config={FUNCTION_EXERCISES["hoi-dap"]}
      levelParam="1"
    />
  );
}
