"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Home, Building2, ArrowRightLeft } from "lucide-react";

export function DropoffToggle({
  childId,
  date,
  effectiveDropoff,
  orgName,
  orgAddress,
  homeAddress,
}: {
  childId: string;
  date: string;
  effectiveDropoff: string; // "HOME" | "DAYCARE"
  orgName: string;
  orgAddress: string;
  homeAddress: string;
}) {
  const [location, setLocation] = useState(effectiveDropoff);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    const next = location === "HOME" ? "DAYCARE" : "HOME";
    setLoading(true);
    await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ childId, date, dropoffLocation: next }),
    });
    setLocation(next);
    setLoading(false);
    router.refresh();
  }

  const isHome = location === "HOME";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      title={`Tap to change drop-off to ${isHome ? "Daycare" : "Home"}`}
      className={`flex items-center gap-1.5 mt-1.5 px-2 py-1 rounded-full border text-xs font-medium transition-colors w-full max-w-full truncate
        ${isHome
          ? "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
          : "border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
        } ${loading ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
    >
      {isHome ? (
        <Home className="h-3 w-3 shrink-0 text-slate-500" />
      ) : (
        <Building2 className="h-3 w-3 shrink-0 text-violet-500" />
      )}
      <span className="truncate">
        {isHome
          ? homeAddress
          : (orgAddress || orgName)}
      </span>
      <ArrowRightLeft className="h-3 w-3 shrink-0 text-muted-foreground ml-auto" />
    </button>
  );
}
