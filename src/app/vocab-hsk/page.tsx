import { VocabSourceLanding } from "@/components/vocab/VocabSourceLanding";

export const metadata = { title: "Từ vựng HSK · HSK Master" };

export default function Page() {
  return <VocabSourceLanding source="HSK" basePath="/vocab-hsk" />;
}
