"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function AttendanceDateNav({ currentDate }: { currentDate: string }) {
  const router = useRouter();

  function changeDate(delta: number) {
    const d = new Date(currentDate + "T12:00:00");
    d.setDate(d.getDate() + delta);
    router.push(`/attendance?date=${d.toISOString().split("T")[0]}`);
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => changeDate(-1)}>
        <ChevronLeft className="h-4 w-4" /> Prev
      </Button>
      <input
        type="date"
        value={currentDate}
        onChange={(e) => router.push(`/attendance?date=${e.target.value}`)}
        className="h-9 rounded-md border border-input px-3 py-1 text-sm"
      />
      <Button variant="outline" size="sm" onClick={() => changeDate(1)}>
        Next <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
