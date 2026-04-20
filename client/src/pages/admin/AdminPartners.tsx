import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { type Partner } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

export default function AdminPartners() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState<boolean>(true);

  const { data: partners, isLoading } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/admin/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to create partner");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Partner created successfully" });
    },
    onError: (error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await fetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to update partner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      setIsOpen(false);
      resetForm();
      toast({ title: "Partner updated successfully" });
    },
    onError: () => toast({ title: "Failed to update partner", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete partner");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partners"] });
      toast({ title: "Partner deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete partner", variant: "destructive" }),
  });

  const resetForm = () => {
    setEditingPartner(null);
    setName("");
    setLogoUrl("");
    setWebsiteUrl("");
    setOrder(0);
    setIsActive(true);
  };

  const openEdit = (partner: Partner) => {
    setEditingPartner(partner);
    setName(partner.name);
    setLogoUrl(partner.logoUrl);
    setWebsiteUrl(partner.websiteUrl || "");
    setOrder(partner.order || 0);
    setIsActive(partner.isActive ?? true);
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name,
      logoUrl,
      websiteUrl: websiteUrl || null,
      order: Number(order) || 0,
      isActive,
    };
    if (editingPartner) {
      updateMutation.mutate({ id: editingPartner.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <AdminLayout title="Partners">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{partners?.length || 0} partners</p>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Partner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPartner ? "Edit Partner" : "Add Partner"}</DialogTitle>
              <DialogDescription>
                {editingPartner
                  ? "Update the details for this partner."
                  : "Fill in the information to add a new partner."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="name">Partner Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Company Name"
                  required
                />
              </div>
              <div className="space-y-2">
                <ImageUploader
                  name="logoUrl"
                  label="Partner Logo"
                  defaultValue={logoUrl}
                  onUploadComplete={(url) => setLogoUrl(url)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
                <Input
                  id="websiteUrl"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Display Order</Label>
                <Input
                  id="order"
                  type="number"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value))}
                />
              </div>
              <div className="flex items-center gap-2 pt-2">
                <Switch
                  id="isActive"
                  checked={isActive}
                  onCheckedChange={(c) => setIsActive(c)}
                />
                <Label htmlFor="isActive">Active (Display publicly)</Label>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingPartner ? "Save Changes" : "Create Partner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading partners...</div>
      ) : (
        <div className="border rounded-md bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Logo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Order</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {partners?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No partners found. Add your first partner above.
                  </TableCell>
                </TableRow>
              )}
              {partners?.map((partner) => (
                <TableRow key={partner.id}>
                  <TableCell>
                    <img
                      src={partner.logoUrl}
                      alt={partner.name}
                      className="h-10 w-16 object-contain bg-white/5 p-1 rounded"
                    />
                  </TableCell>
                  <TableCell className="font-medium">{partner.name}</TableCell>
                  <TableCell>
                    {partner.websiteUrl && (
                      <a
                        href={partner.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {partner.websiteUrl}
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        partner.isActive
                          ? "bg-green-500/20 text-green-500"
                          : "bg-red-500/20 text-red-500"
                      }`}
                    >
                      {partner.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>{partner.order}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(partner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this partner?")) {
                          deleteMutation.mutate(partner.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminLayout>
  );
}
