import type { Metadata } from "next";
import { Dashboard } from "@/components/home/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function HomePage() {
  return <Dashboard />;
}