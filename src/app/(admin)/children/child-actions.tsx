"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function ChildDeleteButton({ childId, childName }: { childId: string; childName: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    if (!confirm(`Deactivate ${childName}? They will no longer appear in active routes.`)) return;
    setLoading(true);
    await fetch(`/api/children/${childId}`, { method: "DELETE" });
    router.refresh();
    setLoading(false);
  }

  return (
    <Button variant="ghost" size="sm" onClick={handleDelete} disabled={loading} className="text-destructive hover:text-destructive">
      <Trash2 className="h-4 w-4" />
    </Button>
  );
}
