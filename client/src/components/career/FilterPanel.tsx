import type { Career } from "@shared/schema";
import type { CareerFilters } from "@/lib/careerFilters";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface FilterPanelProps {
  careers: Career[];
  filters: CareerFilters;
  onChange: (filters: CareerFilters) => void;
  matchCount: number;
  isLoading: boolean;
}

export function FilterPanel({
  careers,
  filters,
  onChange,
  matchCount,
  isLoading,
}: FilterPanelProps) {
  const departments = [...new Set(careers.map((c) => c.department))].sort();
  const locations = [...new Set(careers.map((c) => c.location))].sort();
  const types = [...new Set(careers.map((c) => c.type))].sort();

  const handleClear = () => {
    onChange({ department: "", location: "", type: "", search: "" });
  };

  const hasActiveFilters =
    filters.department !== "" ||
    filters.location !== "" ||
    filters.type !== "" ||
    filters.search !== "";

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-40" />
          <Skeleton className="h-9 w-56" />
        </div>
        <Skeleton className="h-5 w-32" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Department filter — native select for reliable "All" default */}
        <select
          className="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filter by department"
          value={filters.department}
          onChange={(e) => onChange({ ...filters, department: e.target.value })}
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>{dept}</option>
          ))}
        </select>

        {/* Location filter */}
        <select
          className="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filter by location"
          value={filters.location}
          onChange={(e) => onChange({ ...filters, location: e.target.value })}
        >
          <option value="">All Locations</option>
          {locations.map((loc) => (
            <option key={loc} value={loc}>{loc}</option>
          ))}
        </select>

        {/* Type filter */}
        <select
          className="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          aria-label="Filter by type"
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value })}
        >
          <option value="">All Types</option>
          {types.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {/* Search input */}
        <Input
          className="w-56"
          placeholder="Search by title or department..."
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          aria-label="Search job listings"
        />

        {/* Clear filters button */}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClear}>
            Clear filters
          </Button>
        )}
      </div>

      {/* Match count badge */}
      <div className="flex items-center gap-2">
        <Badge variant="secondary">
          {matchCount} active {matchCount === 1 ? "listing" : "listings"}
        </Badge>
      </div>
    </div>
  );
}
