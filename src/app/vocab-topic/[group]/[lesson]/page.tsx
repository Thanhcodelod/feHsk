import { VocabLesson } from "@/components/vocab/VocabLesson";

export default async function Page({
  params,
}: {
  params: Promise<{ group: string; lesson: string }>;
}) {
  const { group, lesson } = await params;
  return (
    <VocabLesson source="THEME" basePath="/vocab-topic" group={decodeURIComponent(group)} lesson={Number(lesson)} />
  );
}
