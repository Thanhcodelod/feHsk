import { FunctionLevelPicker } from "@/components/practice/FunctionLevelPicker";

export const metadata = { title: "Hỏi đáp · HSK Master" };

export default function Page() {
  return <FunctionLevelPicker type="LISTEN_CONVERSATION_QA" basePath="/hoi-dap" />;
}
