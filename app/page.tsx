import { Suspense } from "react";
import MapShell from "@/components/MapShell";

export default function Page() {
  return (
    <main className="h-full w-full">
      <Suspense fallback={null}>
        <MapShell />
      </Suspense>
    </main>
  );
}
