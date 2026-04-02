import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  FileText,
  GripVertical,
  Layers
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Course, CourseModule } from "@shared/schema";

export default function AdminModules() {
  const { courseId } = useParams<{ courseId: string }>();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<CourseModule | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    order: 0,
    isPublished: true,
  });

  const { data: course } = useQuery<Course>({
    queryKey: ["/api/lms/admin/courses", courseId],
    enabled: false,
  });

  const { data: modules, isLoading } = useQuery<CourseModule[]>({
    queryKey: [`/api/lms/admin/courses/${courseId}/modules`],
    enabled: !!courseId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { courseId: string }) => {
      const response = await apiRequest("POST", "/api/lms/admin/modules", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lms/admin/courses/${courseId}/modules`] });
      toast({ title: "Module created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create module", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/modules/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lms/admin/courses/${courseId}/modules`] });
      toast({ title: "Module updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update module", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/modules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lms/admin/courses/${courseId}/modules`] });
      toast({ title: "Module deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete module", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      order: modules?.length || 0,
      isPublished: true,
    });
    setEditingModule(null);
  };

  const handleEdit = (module: CourseModule) => {
    setEditingModule(module);
    setFormData({
      title: module.title,
      description: module.description || "",
      order: module.order || 0,
      isPublished: module.isPublished ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingModule) {
      updateMutation.mutate({ id: editingModule.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, courseId: courseId! });
    }
  };

  return (
    <AdminLayout title="Course Modules">
      <div className="mb-6">
        <Link href="/admin/courses">
          <Button variant="ghost" size="sm" className="mb-4" data-testid="button-back">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Courses
          </Button>
        </Link>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">Organize your course content into modules</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-add-module">
              <Plus className="w-4 h-4 mr-2" /> Add Module
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingModule ? "Edit Module" : "Create New Module"}</DialogTitle>
              <DialogDescription>
                {editingModule ? "Update module details" : "Add a new module to this course"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Module Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Introduction to the Skeletal System"
                    data-testid="input-module-title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief module description..."
                    rows={3}
                    data-testid="input-module-description"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    data-testid="input-module-order"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isPublished"
                    checked={formData.isPublished}
                    onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                    data-testid="switch-module-published"
                  />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-module"
                >
                  {editingModule ? "Update Module" : "Create Module"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : modules && modules.length > 0 ? (
        <div className="space-y-3">
          {modules.map((module, index) => (
            <Card key={module.id} data-testid={`card-module-${module.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-muted-foreground">Module {index + 1}</span>
                      <h3 className="font-medium">{module.title}</h3>
                      {!module.isPublished && (
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      )}
                    </div>
                    {module.description && (
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/modules/${module.id}/lessons`}>
                      <Button variant="outline" size="sm" data-testid={`button-lessons-${module.id}`}>
                        <FileText className="w-4 h-4 mr-1" /> Lessons
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(module)}
                      data-testid={`button-edit-${module.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this module? All lessons will be deleted.")) {
                          deleteMutation.mutate(module.id);
                        }
                      }}
                      data-testid={`button-delete-${module.id}`}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Layers className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No modules yet</h3>
            <p className="text-muted-foreground mb-4">
              Create modules to organize your course content
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-module">
              <Plus className="w-4 h-4 mr-2" /> Create Module
            </Button>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
