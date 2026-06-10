import { Orbit } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-muted/40 px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Orbit className="size-5" />
        </span>
        <span className="text-2xl font-semibold tracking-tight">Pulsar CRM</span>
      </div>
      {children}
    </main>
  );
}
