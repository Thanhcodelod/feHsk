import { VocabSourceLanding } from "@/components/vocab/VocabSourceLanding";

export const metadata = { title: "Từ vựng Boya · HSK Master" };

export default function Page() {
  return <VocabSourceLanding source="BOYA" basePath="/vocab-boya" />;
}
