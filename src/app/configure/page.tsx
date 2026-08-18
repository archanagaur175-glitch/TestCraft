import type { Metadata } from "next";
import { ConfigureScreen } from "@/components/configure/configure-screen";

export const metadata: Metadata = {
  title: "Configure",
};

export default function ConfigurePage() {
  return <ConfigureScreen />;
}