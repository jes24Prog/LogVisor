import { Header } from "@/components/log-visor/header";
import { LogVisor } from "@/components/log-visor/log-visor";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
        <LogVisor />
      </main>
    </div>
  );
}
