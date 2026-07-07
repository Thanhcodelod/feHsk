import { FunctionLessonLanding } from "@/components/practice/FunctionLessonLanding";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Đọc hiểu · HSK Master" };

export default function Page() {
  return (
    <FunctionLessonLanding
      config={FUNCTION_EXERCISES["doc-hieu"]}
      levelParam="1"
    />
  );
}
