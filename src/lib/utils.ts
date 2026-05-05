import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "—";
  return time;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function weekDates(weekOffset = 0): string[] {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1) + weekOffset * 7);
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export const ATTENDANCE_LABELS: Record<string, string> = {
  TRANSPORTED: "Transported",
  PARENT_PICKUP_EARLY: "Parent Pickup",
  NO_SCHOOL: "No School",
  ABSENT: "Absent",
  SICK: "Sick",
  VACATION: "Vacation",
  OTHER: "Other",
};

export const ATTENDANCE_COLORS: Record<string, string> = {
  TRANSPORTED: "text-green-700 bg-green-50",
  PARENT_PICKUP_EARLY: "text-blue-700 bg-blue-50",
  NO_SCHOOL: "text-gray-600 bg-gray-100",
  ABSENT: "text-red-700 bg-red-50",
  SICK: "text-orange-700 bg-orange-50",
  VACATION: "text-purple-700 bg-purple-50",
  OTHER: "text-yellow-700 bg-yellow-50",
};

export const VEHICLE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "text-green-700 bg-green-50",
  IN_USE: "text-blue-700 bg-blue-50",
  MAINTENANCE: "text-orange-700 bg-orange-50",
  RETIRED: "text-gray-600 bg-gray-100",
};

export const TRIP_STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "text-gray-600 bg-gray-100",
  IN_PROGRESS: "text-green-700 bg-green-50",
  COMPLETED: "text-blue-700 bg-blue-50",
  DELAYED: "text-orange-700 bg-orange-50",
  CANCELLED: "text-red-700 bg-red-50",
};
