import { VocabSourceLanding } from "@/components/vocab/VocabSourceLanding";

export const metadata = { title: "Từ vựng chuyên ngành · HSK Master" };

export default function Page() {
  return <VocabSourceLanding source="MAJOR" basePath="/vocab-major" />;
}
