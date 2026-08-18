import type { Metadata } from "next";
import { CurriculumBrowser } from "@/components/curriculum/curriculum-browser";

export const metadata: Metadata = {
  title: "Curriculum",
};

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string | string[] }>;
}) {
  const { code } = await searchParams;
  const initialCode = Array.isArray(code) ? code[0] : code || null;
  return <CurriculumBrowser initialCode={initialCode} />;
}