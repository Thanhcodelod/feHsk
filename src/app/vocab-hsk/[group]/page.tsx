import { VocabLevelLessons } from "@/components/vocab/VocabLevelLessons";

export default async function Page({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  return (
    <VocabLevelLessons source="HSK" basePath="/vocab-hsk" group={decodeURIComponent(group)} />
  );
}
