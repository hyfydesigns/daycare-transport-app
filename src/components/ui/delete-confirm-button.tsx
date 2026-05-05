"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  /** API endpoint to DELETE, e.g. "/api/drivers/abc123" */
  endpoint: string;
  /** Human-readable name shown in the confirmation dialog */
  label: string;
  /** Optional extra message shown below the name */
  description?: string;
  onSuccess?: () => void;
}

export function DeleteConfirmButton({ endpoint, label, description, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    await fetch(endpoint, { method: "DELETE" });
    setLoading(false);
    setOpen(false);
    if (onSuccess) onSuccess();
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => !loading && setOpen(false)}
          />
          {/* Dialog */}
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-sm w-full mx-4 space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Delete {label}?</p>
                <p className="text-sm text-gray-500 mt-1">
                  {description ?? "This will deactivate the record. It can be restored later if needed."}
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
