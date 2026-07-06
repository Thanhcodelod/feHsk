import { VocabSourceLanding } from "@/components/vocab/VocabSourceLanding";

export const metadata = { title: "Từ vựng TOCFL · HSK Master" };

export default function Page() {
  return <VocabSourceLanding source="TOCFL" basePath="/vocab-tocfl" />;
}
