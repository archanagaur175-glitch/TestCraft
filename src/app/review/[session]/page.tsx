import { ReviewScreen } from "@/components/review/review-screen";

export const metadata = { title: "Review" };

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ session: string }>;
}) {
  const { session } = await params;
  return <ReviewScreen sessionId={session} />;
}