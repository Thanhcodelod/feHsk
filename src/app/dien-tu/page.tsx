import { FunctionLessonLanding } from "@/components/practice/FunctionLessonLanding";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Điền từ · HSK Master" };

export default function Page() {
  return (
    <FunctionLessonLanding
      config={FUNCTION_EXERCISES["dien-tu"]}
      levelParam="1"
    />
  );
}
