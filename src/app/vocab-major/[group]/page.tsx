import { VocabLevelLessons } from "@/components/vocab/VocabLevelLessons";

export default async function Page({
  params,
}: {
  params: Promise<{ group: string }>;
}) {
  const { group } = await params;
  return (
    <VocabLevelLessons source="MAJOR" basePath="/vocab-major" group={decodeURIComponent(group)} />
  );
}
