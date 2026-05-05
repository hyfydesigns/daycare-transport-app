"use client";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  endpoint: string;
  label: string;
  description?: string;
  onSuccess?: () => void;
}

export function DeleteConfirmButton({ endpoint, label, description, onSuccess }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(endpoint, { method: "DELETE" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        const msg = json?.error ?? `Server error (${res.status})`;
        console.error("[delete]", endpoint, res.status, json);
        setError(msg);
        setLoading(false);
        return;
      }

      setLoading(false);
      setOpen(false);
      if (onSuccess) onSuccess();
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[delete] fetch failed:", msg);
      setError(msg);
      setLoading(false);
    }
  }

  function handleClose() {
    if (loading) return;
    setOpen(false);
    setError(null);
  }

  const dialog = open ? createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
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

        {error && (
          <div className="flex items-start gap-2 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading}>
            {loading ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => { setError(null); setOpen(true); }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
      {dialog}
    </>
  );
}
