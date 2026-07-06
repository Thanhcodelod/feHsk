import { VocabSourceLanding } from "@/components/vocab/VocabSourceLanding";

export const metadata = { title: "Từ vựng HSK 3.0 · HSK Master" };

export default function Page() {
  return <VocabSourceLanding source="HSK30" basePath="/vocab-hsk30" />;
}
