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
import type { TeamMember } from "@shared/schema";

export default function AdminTeam() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: team, isLoading } = useQuery<TeamMember[]>({
    queryKey: ["/api/admin/team"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<TeamMember>) => apiRequest("POST", "/api/admin/team", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      toast({ title: "Team member added successfully" });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to add team member", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<TeamMember> & { id: string }) => 
      apiRequest("PATCH", `/api/admin/team/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      toast({ title: "Team member updated successfully" });
      setIsDialogOpen(false);
      setEditingMember(null);
    },
    onError: () => toast({ title: "Failed to update team member", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/team/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/team"] });
      toast({ title: "Team member removed successfully" });
    },
    onError: () => toast({ title: "Failed to remove team member", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      role: formData.get("role") as string,
      description: formData.get("description") as string,
      imageUrl: formData.get("imageUrl") as string || null,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: formData.get("isActive") === "on",
    };

    if (editingMember) {
      updateMutation.mutate({ ...data, id: editingMember.id });
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
          <h1 className="text-xl font-semibold">Manage Team</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">{team?.length || 0} team members</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingMember(null)} data-testid="button-add-member">
                <Plus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingMember ? "Edit Team Member" : "New Team Member"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" defaultValue={editingMember?.name || ""} required data-testid="input-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input id="role" name="role" defaultValue={editingMember?.role || ""} required data-testid="input-role" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingMember?.description || ""} required data-testid="input-description" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="imageUrl">Image URL</Label>
                    <Input id="imageUrl" name="imageUrl" defaultValue={editingMember?.imageUrl || ""} data-testid="input-imageUrl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input id="order" name="order" type="number" defaultValue={editingMember?.order || 0} data-testid="input-order" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" name="isActive" defaultChecked={editingMember?.isActive ?? true} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {editingMember ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading team...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {team?.map((member) => (
              <Card key={member.id} className={!member.isActive ? "opacity-60" : ""} data-testid={`member-${member.id}`}>
                <CardContent className="pt-4">
                  <div className="flex justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-medium">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setEditingMember(member); setIsDialogOpen(true); }}
                        data-testid={`button-edit-${member.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(member.id)}
                        data-testid={`button-delete-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{member.description}</p>
                </CardContent>
              </Card>
            ))}
            {team?.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">No team members yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
