import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface BulkActionToolbarProps {
  selectedIds: string[];
  onBulkStatusUpdate: (status: string) => void;
  isPending: boolean;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "reviewed", label: "Reviewed" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

export function BulkActionToolbar({
  selectedIds,
  onBulkStatusUpdate,
  isPending,
}: BulkActionToolbarProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  if (selectedIds.length < 1) {
    return null;
  }

  const handleApply = () => {
    if (selectedStatus) {
      onBulkStatusUpdate(selectedStatus);
    }
  };

  const isApplyDisabled = isPending || !selectedStatus;

  return (
    <div className="sticky bottom-0 z-10 flex items-center gap-4 rounded-lg border bg-background p-4 shadow-md">
      <Badge variant="secondary">
        {selectedIds.length} selected
      </Badge>

      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
        <SelectTrigger className="w-40" aria-label="Select status">
          <SelectValue placeholder="Select status" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        onClick={handleApply}
        disabled={isApplyDisabled}
        aria-label="Apply bulk status update"
      >
        Apply
      </Button>
    </div>
  );
}
