"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RotateCcw, Loader2 } from "lucide-react";

export function RestoreButton({ childId, childName }: { childId: string; childName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function restore() {
    setLoading(true);
    await fetch(`/api/children/${childId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: true }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={restore}
      disabled={loading}
      title={`Restore ${childName}`}
    >
      {loading
        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
        : <><RotateCcw className="h-3.5 w-3.5 mr-1" />Restore</>}
    </Button>
  );
}
