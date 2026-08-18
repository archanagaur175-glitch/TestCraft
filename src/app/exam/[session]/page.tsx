import { ExamRunner } from "@/components/exam/exam-runner";

export const metadata = { title: "Exam" };

export default async function ExamPage({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const { session } = await params;
  return <ExamRunner sessionId={session} />;
}