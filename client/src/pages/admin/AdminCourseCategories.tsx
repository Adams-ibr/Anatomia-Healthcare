import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, FolderOpen } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { CourseCategory } from "@shared/schema";

export default function AdminCourseCategories() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CourseCategory | null>(null);

  const { data: categories, isLoading } = useQuery<CourseCategory[]>({
    queryKey: ["/api/lms/admin/course-categories"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<CourseCategory>) => {
      const response = await apiRequest("POST", "/api/lms/admin/course-categories", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/course-categories"] });
      toast({ title: "Category created successfully" });
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => toast({ title: "Failed to create category", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<CourseCategory> }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/course-categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/course-categories"] });
      toast({ title: "Category updated successfully" });
      setIsDialogOpen(false);
      setEditingCategory(null);
    },
    onError: () => toast({ title: "Failed to update category", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/course-categories/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/course-categories"] });
      toast({ title: "Category deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete category", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const slug = (formData.get("name") as string)?.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") || "";
    
    const data = {
      name: formData.get("name") as string,
      slug,
      description: formData.get("description") as string || null,
      iconName: formData.get("iconName") as string || null,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: formData.get("isActive") === "on",
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleOpenDialog = (category?: CourseCategory) => {
    setEditingCategory(category || null);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout title="Course Categories">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{categories?.length || 0} categories</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} data-testid="button-add-category">
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCategory ? "Edit Category" : "New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={editingCategory?.name || ""} 
                  required 
                  data-testid="input-category-name" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={editingCategory?.description || ""} 
                  data-testid="input-category-description" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="iconName">Icon Name (Lucide icon)</Label>
                <Input 
                  id="iconName" 
                  name="iconName" 
                  defaultValue={editingCategory?.iconName || ""} 
                  placeholder="e.g., Heart, Brain, Bone"
                  data-testid="input-category-icon" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order">Order</Label>
                <Input 
                  id="order" 
                  name="order" 
                  type="number" 
                  defaultValue={editingCategory?.order || 0} 
                  data-testid="input-category-order" 
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  id="isActive" 
                  name="isActive" 
                  defaultChecked={editingCategory?.isActive ?? true} 
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
                  data-testid="button-save-category"
                >
                  {editingCategory ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading categories...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories?.map((category) => (
            <Card 
              key={category.id} 
              className={!category.isActive ? "opacity-60" : ""}
              data-testid={`category-${category.id}`}
            >
              <CardContent className="pt-4">
                <div className="flex justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">{category.name}</h3>
                      <p className="text-xs text-muted-foreground">/{category.slug}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleOpenDialog(category)}
                      data-testid={`button-edit-${category.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteMutation.mutate(category.id)}
                      data-testid={`button-delete-${category.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {category.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{category.description}</p>
                )}
                <div className="flex items-center gap-2">
                  {!category.isActive && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  <Badge variant="outline" className="text-xs">Order: {category.order}</Badge>
                  {category.iconName && (
                    <Badge variant="outline" className="text-xs">Icon: {category.iconName}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {categories?.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              No categories yet. Create your first category to get started.
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
