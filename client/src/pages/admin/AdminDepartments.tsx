import { AdminLayout } from "@/components/admin/AdminLayout";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Department, TeamMember } from "@shared/schema";

const DEPARTMENT_COLORS = [
  { value: "blue", label: "Blue", className: "bg-blue-500" },
  { value: "green", label: "Green", className: "bg-green-500" },
  { value: "purple", label: "Purple", className: "bg-purple-500" },
  { value: "orange", label: "Orange", className: "bg-orange-500" },
  { value: "red", label: "Red", className: "bg-red-500" },
  { value: "teal", label: "Teal", className: "bg-teal-500" },
  { value: "pink", label: "Pink", className: "bg-pink-500" },
  { value: "indigo", label: "Indigo", className: "bg-indigo-500" },
];

export default function AdminDepartments() {
  const { toast } = useToast();
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string>("blue");
  const [selectedHeadId, setSelectedHeadId] = useState<string>("");

  const { data: departments, isLoading } = useQuery<Department[]>({
    queryKey: ["/api/admin/departments"],
  });

  const { data: teamMembers } = useQuery<TeamMember[]>({
    queryKey: ["/api/admin/team"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Department>) => apiRequest("POST", "/api/admin/departments", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/departments"] });
      toast({ title: "Department created successfully" });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: () => toast({ title: "Failed to create department", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Department> & { id: string }) => 
      apiRequest("PATCH", `/api/admin/departments/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/departments"] });
      toast({ title: "Department updated successfully" });
      setIsDialogOpen(false);
      setEditingDepartment(null);
      resetForm();
    },
    onError: () => toast({ title: "Failed to update department", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/departments"] });
      toast({ title: "Department deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete department", variant: "destructive" }),
  });

  const resetForm = () => {
    setSelectedColor("blue");
    setSelectedHeadId("");
  };

  const handleOpenDialog = (department?: Department) => {
    if (department) {
      setEditingDepartment(department);
      setSelectedColor(department.color || "blue");
      setSelectedHeadId(department.headId || "");
    } else {
      setEditingDepartment(null);
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || null,
      headId: selectedHeadId || null,
      imageUrl: formData.get("imageUrl") as string || null,
      color: selectedColor,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: formData.get("isActive") === "on",
    };

    if (editingDepartment) {
      updateMutation.mutate({ ...data, id: editingDepartment.id });
    } else {
      createMutation.mutate(data);
    }
  };

  const getColorClass = (color: string | null) => {
    const colorObj = DEPARTMENT_COLORS.find(c => c.value === color);
    return colorObj?.className || "bg-blue-500";
  };

  const getHeadName = (headId: string | null) => {
    if (!headId || !teamMembers) return null;
    const head = teamMembers.find(m => m.id === headId);
    return head?.name || null;
  };

  return (
    <AdminLayout title="Departments">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{departments?.length || 0} departments</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-department">
              <Plus className="h-4 w-4 mr-2" />
              Add Department
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingDepartment ? "Edit Department" : "New Department"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingDepartment?.name || ""} 
                  required 
                  data-testid="input-department-name" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingDepartment?.description || ""} 
                  data-testid="input-department-description" 
                />
              </div>
              <div className="space-y-2">
                <Label>Department Head</Label>
                <Select value={selectedHeadId} onValueChange={setSelectedHeadId}>
                  <SelectTrigger data-testid="select-department-head">
                    <SelectValue placeholder="Select department head" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Head Assigned</SelectItem>
                    {teamMembers?.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Color</Label>
                <div className="flex flex-wrap gap-2">
                  {DEPARTMENT_COLORS.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setSelectedColor(color.value)}
                      className={`w-8 h-8 rounded-full ${color.className} ${
                        selectedColor === color.value ? "ring-2 ring-offset-2 ring-foreground" : ""
                      }`}
                      title={color.label}
                      data-testid={`color-${color.value}`}
                    />
                  ))}
                </div>
              </div>
              <ImageUploader 
                key={editingDepartment?.id || "new"} 
                name="imageUrl" 
                label="Department Image" 
                defaultValue={editingDepartment?.imageUrl} 
              />
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input 
                  id="order" 
                  name="order" 
                  type="number" 
                  defaultValue={editingDepartment?.order || 0} 
                  data-testid="input-department-order" 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="isActive" 
                  name="isActive" 
                  defaultChecked={editingDepartment?.isActive ?? true} 
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending} 
                  data-testid="button-save-department"
                >
                  {editingDepartment ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading departments...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments?.map((department) => (
            <Card 
              key={department.id} 
              className={!department.isActive ? "opacity-60" : ""} 
              data-testid={`department-${department.id}`}
            >
              <CardContent className="pt-4">
                <div className="flex justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getColorClass(department.color)} flex items-center justify-center`}>
                      <Building2 className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{department.name}</h3>
                      {getHeadName(department.headId) && (
                        <p className="text-xs text-muted-foreground">
                          Head: {getHeadName(department.headId)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenDialog(department)}
                      data-testid={`button-edit-${department.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(department.id)}
                      data-testid={`button-delete-${department.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {department.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{department.description}</p>
                )}
                <div className="flex items-center gap-2 mt-3">
                  {!department.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">Order: {department.order}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
          {departments?.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No departments yet. Create your first department to get started.
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
