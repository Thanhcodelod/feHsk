import { FunctionLevelPicker } from "@/components/practice/FunctionLevelPicker";

export const metadata = { title: "Sửa câu sai · HSK Master" };

export default function Page() {
  return <FunctionLevelPicker type="WRITE_CORRECT_ERROR" basePath="/sua-cau-sai" />;
}
