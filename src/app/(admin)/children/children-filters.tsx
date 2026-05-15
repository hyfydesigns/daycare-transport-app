"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface School { id: string; name: string; }

export function ChildrenFilters({ schools }: { schools: School[] }) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();

  const [search,   setSearch]   = useState(searchParams.get("search")   ?? "");
  const [schoolId, setSchoolId] = useState(searchParams.get("schoolId") ?? "");
  const [active,   setActive]   = useState(searchParams.get("active")   ?? "true");

  useEffect(() => {
    setSearch  (searchParams.get("search")   ?? "");
    setSchoolId(searchParams.get("schoolId") ?? "");
    setActive  (searchParams.get("active")   ?? "true");
  }, [searchParams]);

  function navigate(overrides: { search?: string; schoolId?: string; active?: string }) {
    const next = { search, schoolId, active, ...overrides };
    const params = new URLSearchParams();
    if (next.search.trim()) params.set("search",   next.search.trim());
    if (next.schoolId)      params.set("schoolId", next.schoolId);
    if (next.active)        params.set("active",   next.active);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && navigate({ search: e.currentTarget.value })}
        onBlur={(e) => navigate({ search: e.target.value })}
        placeholder="Search by name…"
        className="h-9 rounded-md border border-input px-3 py-1 text-sm w-full sm:w-48"
      />
      <select
        value={schoolId}
        onChange={(e) => { setSchoolId(e.target.value); navigate({ schoolId: e.target.value }); }}
        className="h-9 rounded-md border border-input px-3 py-1 text-sm w-full sm:w-auto"
      >
        <option value="">All schools</option>
        {schools.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>
      <select
        value={active}
        onChange={(e) => { setActive(e.target.value); navigate({ active: e.target.value }); }}
        className="h-9 rounded-md border border-input px-3 py-1 text-sm w-full sm:w-auto"
      >
        <option value="true">Active</option>
        <option value="false">Inactive</option>
        <option value="">All</option>
      </select>
    </div>
  );
}
