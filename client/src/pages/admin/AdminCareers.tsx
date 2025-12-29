import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Link } from "wouter";
import { ArrowLeft, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Career } from "@shared/schema";

export default function AdminCareers() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editingCareer, setEditingCareer] = useState<Career | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: careers, isLoading } = useQuery<Career[]>({
    queryKey: ["/api/admin/careers"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Career>) => apiRequest("POST", "/api/admin/careers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/careers"] });
      toast({ title: "Job listing created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create job listing", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Career> & { id: string }) => 
      apiRequest("PATCH", `/api/admin/careers/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/careers"] });
      toast({ title: "Job listing updated successfully" });
      setIsDialogOpen(false);
      setEditingCareer(null);
    },
    onError: () => toast({ title: "Failed to update job listing", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/careers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/careers"] });
      toast({ title: "Job listing deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete job listing", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      department: formData.get("department") as string,
      location: formData.get("location") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      requirements: formData.get("requirements") as string,
      isActive: formData.get("isActive") === "on",
    };

    if (editingCareer) {
      updateMutation.mutate({ ...data, id: editingCareer.id });
    } else {
      createMutation.mutate(data);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/admin">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold">Manage Careers</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">{careers?.length || 0} job listings</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingCareer(null)} data-testid="button-add-career">
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCareer ? "Edit Job Listing" : "New Job Listing"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input id="title" name="title" defaultValue={editingCareer?.title || ""} required data-testid="input-title" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input id="department" name="department" defaultValue={editingCareer?.department || ""} required data-testid="input-department" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" defaultValue={editingCareer?.location || ""} required placeholder="Remote, New York, etc." data-testid="input-location" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Input id="type" name="type" defaultValue={editingCareer?.type || ""} required placeholder="Full-time, Part-time, Contract" data-testid="input-type" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingCareer?.description || ""} required className="min-h-[100px]" data-testid="input-description" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="requirements">Requirements</Label>
                  <Textarea id="requirements" name="requirements" defaultValue={editingCareer?.requirements || ""} required className="min-h-[100px]" placeholder="List requirements, one per line" data-testid="input-requirements" />
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" name="isActive" defaultChecked={editingCareer?.isActive ?? true} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {editingCareer ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading job listings...</div>
        ) : (
          <div className="space-y-4">
            {careers?.map((career) => (
              <Card key={career.id} className={!career.isActive ? "opacity-60" : ""} data-testid={`career-${career.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-medium">{career.title}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{career.department}</span>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{career.type}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{career.location}</p>
                      <p className="text-sm line-clamp-2">{career.description}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setEditingCareer(career); setIsDialogOpen(true); }}
                        data-testid={`button-edit-${career.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(career.id)}
                        data-testid={`button-delete-${career.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {careers?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No job listings yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
