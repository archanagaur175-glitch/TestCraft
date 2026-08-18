import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-24 text-center">
      <p className="text-7xl font-black tracking-tighter text-accent/30">404</p>
      <h1 className="mt-2 text-xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-muted">That route does not exist on TestCraft.</p>
      <div className="mt-6">
        <Link href="/">
          <Button>
            <Home className="h-4 w-4" /> Back home
          </Button>
        </Link>
      </div>
    </div>
  );
}