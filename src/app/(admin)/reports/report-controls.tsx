"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { ATTENDANCE_LABELS } from "@/lib/utils";

interface ReportControlsProps {
  weekOffset: number;
  weekLabel: string;
  dates: string[];
  dayLabels: string[];
}

export function ReportControls({ weekOffset, weekLabel, dates, dayLabels }: ReportControlsProps) {
  const router = useRouter();

  function exportCSV() {
    // Fetch data and trigger CSV download
    fetch(`/api/reports/weekly?weekOffset=${weekOffset}`)
      .then((r) => r.json())
      .then((data) => {
        const headers = [
          "Child Name", "School",
          ...dayLabels.map((d) => `${d} Pickup`),
          ...dayLabels.map((d) => `${d} Dropoff`),
          "Dismissal Time", "Guardian", "Phone",
        ];

        const rows = data.rows.map((row: {
          fullName: string; school: string; dismissalTime: string;
          guardianName: string; guardianPhone: string;
          days: { status: string; pickup: string | null; dropoff: string | null }[];
        }) => [
          row.fullName,
          row.school,
          ...row.days.map((d: { status: string; pickup: string | null }) =>
            d.status === "TRANSPORTED" ? (d.pickup || "—") : ATTENDANCE_LABELS[d.status] || d.status
          ),
          ...row.days.map((d: { status: string; dropoff: string | null }) =>
            d.status === "TRANSPORTED" ? (d.dropoff || "—") : ""
          ),
          row.dismissalTime,
          row.guardianName,
          row.guardianPhone,
        ]);

        const csv = [headers, ...rows]
          .map((r) => r.map((v: string) => `"${v}"`).join(","))
          .join("\n");

        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transportation-report-${dates[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => router.push(`/reports?weekOffset=${weekOffset - 1}`)}>
        <ChevronLeft className="h-4 w-4" /> Prev Week
      </Button>
      <span className="text-sm text-muted-foreground hidden sm:block">{weekLabel}</span>
      <Button variant="outline" size="sm" onClick={() => router.push(`/reports?weekOffset=${weekOffset + 1}`)}>
        Next Week <ChevronRight className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="sm" onClick={exportCSV}>
        <Download className="h-4 w-4" /> Export CSV
      </Button>
      {weekOffset !== 0 && (
        <Button variant="ghost" size="sm" onClick={() => router.push("/reports")}>
          This Week
        </Button>
      )}
    </div>
  );
}
