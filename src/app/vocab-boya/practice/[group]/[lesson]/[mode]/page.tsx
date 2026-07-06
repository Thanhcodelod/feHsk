import { VocabPractice } from "@/components/vocab/VocabPractice";

export default async function Page({
  params,
}: {
  params: Promise<{ group: string; lesson: string; mode: string }>;
}) {
  const { group, lesson, mode } = await params;
  return (
    <VocabPractice
      source="BOYA"
      basePath="/vocab-boya"
      group={decodeURIComponent(group)}
      lesson={Number(lesson)}
      mode={mode}
    />
  );
}
