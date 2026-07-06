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
      category="READING"
      type="READ_FILL_BLANK"
      exitHref="/dien-tu"
      exitLabel="Chọn cấp độ"
    />
  );
}
