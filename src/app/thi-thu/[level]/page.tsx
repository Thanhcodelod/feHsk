import { notFound } from "next/navigation";
import { ExamRunner } from "@/components/exam/ExamRunner";
import { HSK_LEVELS, type HSKLevel } from "@/lib/types";

export default async function ExamPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  if (!HSK_LEVELS.includes(level as HSKLevel)) notFound();
  return <ExamRunner level={level as HSKLevel} />;
}
