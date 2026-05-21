import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BulkActionToolbar } from "@/components/admin/BulkActionToolbar";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Career } from "@shared/schema";
import { Mail, Phone, MapPin, Briefcase, Calendar, Link as LinkIcon, Download, FileText } from "lucide-react";
import {
  type ApplicationWithJob,
  computeSummaryStats,
  hasValidResumeUrl,
  isValidStatus,
  sortApplications,
} from "./adminApplicationsUtils";

// Re-export for backward compatibility and test imports
export { computeSummaryStats, hasValidResumeUrl, isValidStatus, sortApplications };
export type { ApplicationWithJob };

// ---------------------------------------------------------------------------
// Sort option definitions
// ---------------------------------------------------------------------------

interface SortOption {
  label: string;
  sortBy: "createdAt" | "experience";
  sortOrder: "asc" | "desc";
}

const SORT_OPTIONS: SortOption[] = [
  { label: "Newest first", sortBy: "createdAt", sortOrder: "desc" },
  { label: "Oldest first", sortBy: "createdAt", sortOrder: "asc" },
  { label: "Most experience", sortBy: "experience", sortOrder: "desc" },
  { label: "Least experience", sortBy: "experience", sortOrder: "asc" },
];

// Encode a SortOption to a single string value for the Select component
function encodeSortValue(sortBy: string, sortOrder: string): string {
  return `${sortBy}:${sortOrder}`;
}

function decodeSortValue(value: string): { sortBy: "createdAt" | "experience"; sortOrder: "asc" | "desc" } {
  const [sortBy, sortOrder] = value.split(":") as ["createdAt" | "experience", "asc" | "desc"];
  return { sortBy, sortOrder };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdminApplications() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<ApplicationWithJob | null>(null);

  // Filter state
  const [jobId, setJobId] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [sortValue, setSortValue] = useState<string>(encodeSortValue("createdAt", "desc"));

  // Checkbox selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { sortBy, sortOrder } = decodeSortValue(sortValue);

  // Build query params
  const queryParams: Record<string, string> = {};
  if (jobId) queryParams.jobId = jobId;
  if (statusFilter) queryParams.status = statusFilter;
  queryParams.sortBy = sortBy;
  queryParams.sortOrder = sortOrder;

  const { data: applications, isLoading } = useQuery<ApplicationWithJob[]>({
    queryKey: ["/api/admin/applications", { jobId, status: statusFilter, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams(queryParams).toString();
      const url = `/api/admin/applications${params ? `?${params}` : ""}`;
      const res = await apiRequest("GET", url);
      return res.json();
    },
  });

  // Fetch careers for the job filter dropdown
  const { data: careers } = useQuery<Career[]>({
    queryKey: ["/api/admin/careers"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/careers");
      return res.json();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiRequest("PATCH", `/api/admin/applications/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      toast({ title: "Status updated successfully" });
    },
    onError: () => toast({ title: "Failed to update status", variant: "destructive" }),
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: string }) =>
      apiRequest("PATCH", "/api/admin/applications/bulk-status", { ids, status }),
    onSuccess: async (res) => {
      const data = await res.json();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/applications"] });
      setSelectedIds([]);
      if (data.failed && data.failed.length > 0) {
        toast({
          title: "Some updates failed",
          description: `Failed IDs: ${data.failed.join(", ")}`,
          variant: "destructive",
        });
      } else {
        toast({ title: "Bulk status updated successfully" });
      }
    },
    onError: async (error: unknown) => {
      let failedIds: string[] = [];
      try {
        if (error instanceof Response) {
          const data = await error.json();
          failedIds = data.failed ?? [];
        }
      } catch {
        // ignore parse errors
      }
      toast({
        title: "Bulk update failed",
        description: failedIds.length > 0 ? `Failed IDs: ${failedIds.join(", ")}` : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleBulkStatusUpdate = (status: string) => {
    bulkStatusMutation.mutate({ ids: selectedIds, status });
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setSelectedIds((prev) =>
      checked ? [...prev, id] : prev.filter((existingId) => existingId !== id)
    );
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && applications) {
      setSelectedIds(applications.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "reviewed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  const stats = applications ? computeSummaryStats(applications) : null;
  const allSelected = applications && applications.length > 0 && selectedIds.length === applications.length;

  return (
    <AdminLayout title="Job Applications">
      {/* Filter controls */}
      <div className="flex flex-wrap gap-3 mb-4">
        {/* Job filter */}
        <Select value={jobId} onValueChange={setJobId}>
          <SelectTrigger className="w-48" aria-label="Filter by job">
            <SelectValue placeholder="All jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All jobs</SelectItem>
            {careers?.map((career) => (
              <SelectItem key={career.id} value={career.id}>
                {career.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by status">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="accepted">Accepted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        {/* Sort dropdown */}
        <Select value={sortValue} onValueChange={setSortValue}>
          <SelectTrigger className="w-48" aria-label="Sort applications">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={encodeSortValue(opt.sortBy, opt.sortOrder)} value={encodeSortValue(opt.sortBy, opt.sortOrder)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary stats bar */}
      {stats && (
        <div
          className="flex flex-wrap gap-4 mb-6 p-4 rounded-lg border bg-card/50 text-sm"
          data-testid="summary-stats"
        >
          <span className="font-semibold">Total: {stats.total}</span>
          <span className="text-yellow-700">Pending: {stats.pending}</span>
          <span className="text-blue-700">Reviewed: {stats.reviewed}</span>
          <span className="text-green-700">Accepted: {stats.accepted}</span>
          <span className="text-red-700">Rejected: {stats.rejected}</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading applications...</div>
      ) : (
        <div className="space-y-4">
          {/* Select all checkbox header */}
          {applications && applications.length > 0 && (
            <div className="flex items-center gap-2 px-2">
              <input
                type="checkbox"
                aria-label="Select all applications"
                checked={!!allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="h-4 w-4 cursor-pointer"
              />
              <span className="text-sm text-muted-foreground">Select all</span>
            </div>
          )}

          {applications?.map((app) => (
            <Card
              key={app.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-start gap-3">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    aria-label={`Select application from ${app.name}`}
                    checked={selectedIds.includes(app.id)}
                    onChange={(e) => handleCheckboxChange(app.id, e.target.checked)}
                    className="mt-1 h-4 w-4 cursor-pointer flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  />

                  {/* Card content */}
                  <div
                    className="flex flex-col sm:flex-row justify-between gap-4 flex-1 cursor-pointer"
                    onClick={() => setSelectedApp(app)}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{app.name}</h3>
                        <Badge variant="outline" className={getStatusColor(app.status)}>
                          {app.status ? app.status.charAt(0).toUpperCase() + app.status.slice(1) : "Pending"}
                        </Badge>
                      </div>
                      <p className="font-medium text-primary mb-1">
                        Applied for: {app.careers?.title || "Unknown Role"}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {app.email}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {app.location}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 text-sm text-muted-foreground">
                      <span>{app.createdAt ? format(new Date(app.createdAt), "MMM d, yyyy") : "Unknown Date"}</span>
                      <span className="font-medium text-foreground">{app.experience} yrs exp.</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {applications?.length === 0 && (
            <div className="text-center py-12 border rounded-lg bg-card/50">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="font-semibold text-lg mb-1">No applications yet</h3>
              <p className="text-muted-foreground">When candidates apply, they will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Bulk action toolbar */}
      <BulkActionToolbar
        selectedIds={selectedIds}
        onBulkStatusUpdate={handleBulkStatusUpdate}
        isPending={bulkStatusMutation.isPending}
      />

      {/* Application detail dialog */}
      <Dialog open={selectedApp !== null} onOpenChange={(open) => !open && setSelectedApp(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedApp && (
            <>
              <DialogHeader className="mb-4 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div>
                    <DialogTitle className="text-2xl mb-1">{selectedApp.name}</DialogTitle>
                    <p className="text-primary font-medium">Applied for: {selectedApp.careers?.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Status:</span>
                    <Select
                      defaultValue={selectedApp.status || "pending"}
                      onValueChange={(val) => statusMutation.mutate({ id: selectedApp.id, status: val })}
                      disabled={statusMutation.isPending}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="reviewed">Reviewed</SelectItem>
                        <SelectItem value="accepted">Accepted</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 border-b pb-2">
                      <FileText className="w-4 h-4" /> Contact Information
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <a href={`mailto:${selectedApp.email}`} className="text-blue-600 hover:underline">{selectedApp.email}</a>
                      </li>
                      <li className="flex items-center gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${selectedApp.phone}`} className="text-blue-600 hover:underline">{selectedApp.phone}</a>
                      </li>
                      <li className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedApp.location}</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 border-b pb-2">
                      <Briefcase className="w-4 h-4" /> Professional Details
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex items-center gap-3">
                        <span className="font-medium min-w-24">Experience:</span>
                        <span>{selectedApp.experience} Years</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <span className="font-medium min-w-24">Available from:</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {selectedApp.startDate}</span>
                      </li>
                      {selectedApp.portfolioUrl && (
                        <li className="flex items-center gap-3">
                          <span className="font-medium min-w-24">Portfolio:</span>
                          <a href={selectedApp.portfolioUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                            <LinkIcon className="w-3 h-3" /> View Portfolio
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2 border-b pb-2">
                      <Download className="w-4 h-4" /> Documents
                    </h4>
                    {hasValidResumeUrl(selectedApp.resumeUrl) ? (
                      <a
                        href={selectedApp.resumeUrl!}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 w-full justify-start rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                        data-testid="resume-link"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        Download Resume
                      </a>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full justify-start gap-2"
                        disabled
                        data-testid="resume-disabled-button"
                      >
                        <FileText className="w-4 h-4 text-blue-600" />
                        Download Resume
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 border-b pb-2">Cover Letter</h4>
                  <div className="bg-muted/30 p-4 rounded-md text-sm whitespace-pre-wrap leading-relaxed">
                    {selectedApp.coverLetter}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
