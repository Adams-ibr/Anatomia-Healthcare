import { AdminLayout } from "@/components/admin/AdminLayout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { JobApplication, Career } from "@shared/schema";
import { Mail, Phone, MapPin, Briefcase, Calendar, Link as LinkIcon, Download, FileText } from "lucide-react";

type ApplicationWithJob = JobApplication & { careers: Pick<Career, "title"> };

export default function AdminApplications() {
  const { toast } = useToast();
  const [selectedApp, setSelectedApp] = useState<ApplicationWithJob | null>(null);

  const { data: applications, isLoading } = useQuery<ApplicationWithJob[]>({
    queryKey: ["/api/admin/applications"],
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

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "reviewed": return "bg-blue-100 text-blue-800 border-blue-200";
      case "accepted": return "bg-green-100 text-green-800 border-green-200";
      case "rejected": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  return (
    <AdminLayout title="Job Applications">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{applications?.length || 0} total applications</p>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading applications...</div>
      ) : (
        <div className="space-y-4">
          {applications?.map((app) => (
            <Card key={app.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelectedApp(app)}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
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
                    {/* Placeholder since actual file bucket isn't implemented */}
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      View Resume
                    </Button>
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
