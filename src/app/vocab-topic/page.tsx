import { VocabSourceLanding } from "@/components/vocab/VocabSourceLanding";

export const metadata = { title: "Từ vựng chủ đề · HSK Master" };

export default function Page() {
  return <VocabSourceLanding source="THEME" basePath="/vocab-topic" />;
}
