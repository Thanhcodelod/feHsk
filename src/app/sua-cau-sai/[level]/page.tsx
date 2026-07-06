import { notFound } from "next/navigation";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { HSK_LEVELS, type HSKLevel } from "@/lib/types";

export default async function Page({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  if (!HSK_LEVELS.includes(level as HSKLevel)) notFound();
  return (
    <PracticeSession
      level={level as HSKLevel}
      category="WRITING"
      type="WRITE_CORRECT_ERROR"
      exitHref="/sua-cau-sai"
      exitLabel="Chọn cấp độ"
    />
  );
}
