"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Play, Square, Loader2 } from "lucide-react";

export function RunToggleButton({ isOnRun }: { isOnRun: boolean }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    setLoading(true);
    await fetch("/api/driver/run", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnRun: !isOnRun }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      onClick={toggle}
      disabled={loading}
      size="lg"
      className={`w-full text-base font-semibold h-12 ${
        isOnRun
          ? "bg-red-600 hover:bg-red-700 text-white"
          : "bg-green-600 hover:bg-green-700 text-white"
      }`}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
      ) : isOnRun ? (
        <Square className="h-5 w-5 mr-2" />
      ) : (
        <Play className="h-5 w-5 mr-2" />
      )}
      {loading ? "Updating…" : isOnRun ? "End Run" : "Start Run"}
    </Button>
  );
}
