import { FunctionLessonLanding } from "@/components/practice/FunctionLessonLanding";
import { FUNCTION_EXERCISES } from "@/lib/function-exercises";

export const metadata = { title: "Sắp xếp câu · HSK Master" };

export default function SapXepCauPage() {
  return (
    <FunctionLessonLanding
      config={FUNCTION_EXERCISES["sap-xep-cau"]}
      levelParam="1"
    />
  );
}
