"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

interface School { id: string; name: string; }

export function ChildrenFilters({ schools }: { schools: School[] }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();

  const search   = searchParams.get("search")   ?? "";
  const schoolId = searchParams.get("schoolId") ?? "";
  const active   = searchParams.get("active")   ?? "true";

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    const s  = (data.get("search")   as string).trim();
    const sc = data.get("schoolId")  as string;
    const ac = data.get("active")    as string;
    if (s)  params.set("search",   s);
    if (sc) params.set("schoolId", sc);
    if (ac) params.set("active",   ac);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
      <input
        name="search"
        defaultValue={search}
        placeholder="Search by name…"
        className="h-9 rounded-md border border-input px-3 py-1 text-sm w-full sm:w-48"
      />
      <select
        name="schoolId"
        defaultValue={schoolId}
        key={schoolId}          /* forces re-mount so defaultValue is applied on nav */
        className="h-9 rounded-md border border-input px-3 py-1 text-sm w-full sm:w-auto"
      >
        <option value="">All schools</option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        name="active"
        defaultValue={active}
        key={active}
        className="h-9 rounded-md border border-input px-3 py-1 text-sm w-full sm:w-auto"
      >
        <option value="true">Active</option>
        <option value="false">Inactive</option>
        <option value="">All</option>
      </select>
      <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">Filter</Button>
    </form>
  );
}
