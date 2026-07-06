import { VocabPractice } from "@/components/vocab/VocabPractice";

export default async function Page({
  params,
}: {
  params: Promise<{ group: string; lesson: string; mode: string }>;
}) {
  const { group, lesson, mode } = await params;
  return (
    <VocabPractice
      source="HSK"
      basePath="/vocab-hsk"
      group={decodeURIComponent(group)}
      lesson={Number(lesson)}
      mode={mode}
    />
  );
}
