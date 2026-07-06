import { LuyenDichLanding } from "@/components/practice/LuyenDichLanding";

export const metadata = { title: "Luyện dịch · HSK Master" };

export default async function LuyenDichLevelPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const { level } = await params;
  return <LuyenDichLanding levelParam={level} />;
}
