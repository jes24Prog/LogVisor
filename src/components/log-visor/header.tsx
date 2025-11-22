import { Terminal } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary rounded-lg">
            <Terminal className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">
          LogVisor
        </h1>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <ThemeToggle />
      </div>
    </header>
  );
}
