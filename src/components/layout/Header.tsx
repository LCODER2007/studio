import Link from "next/link";
import { Lightbulb } from "lucide-react";
import { AuthButton } from "@/components/auth/AuthButton";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-auto flex items-center">
          <Link href="/" className="flex items-center gap-2 mr-6">
            <Lightbulb className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block text-lg">
              SEES UNILAG Innovation Hub
            </span>
          </Link>
        </div>

        <div className="flex items-center justify-end">
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
