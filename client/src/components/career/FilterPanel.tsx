import type { Career } from "@shared/schema";
import type { CareerFilters } from "@/lib/careerFilters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const EMPTY_FILTER = "__all__";

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
        {/* Department filter */}
        <Select
          value={filters.department === "" ? EMPTY_FILTER : filters.department}
          onValueChange={(val) =>
            onChange({
              ...filters,
              department: val === EMPTY_FILTER ? "" : val,
            })
          }
        >
          <SelectTrigger className="w-40" aria-label="Filter by department">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_FILTER}>All Departments</SelectItem>
            {departments.map((dept) => (
              <SelectItem key={dept} value={dept}>
                {dept}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Location filter */}
        <Select
          value={filters.location === "" ? EMPTY_FILTER : filters.location}
          onValueChange={(val) =>
            onChange({
              ...filters,
              location: val === EMPTY_FILTER ? "" : val,
            })
          }
        >
          <SelectTrigger className="w-40" aria-label="Filter by location">
            <SelectValue placeholder="Location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_FILTER}>All Locations</SelectItem>
            {locations.map((loc) => (
              <SelectItem key={loc} value={loc}>
                {loc}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Type filter */}
        <Select
          value={filters.type === "" ? EMPTY_FILTER : filters.type}
          onValueChange={(val) =>
            onChange({
              ...filters,
              type: val === EMPTY_FILTER ? "" : val,
            })
          }
        >
          <SelectTrigger className="w-40" aria-label="Filter by type">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={EMPTY_FILTER}>All Types</SelectItem>
            {types.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

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
