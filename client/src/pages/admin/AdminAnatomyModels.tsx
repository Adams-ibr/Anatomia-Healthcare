import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Atom } from "lucide-react";
import { ModelUploader } from "@/components/admin/ModelUploader";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { AnatomyModel } from "@shared/schema";

const BODY_SYSTEMS = [
  "Skeletal", "Muscular", "Cardiovascular", "Nervous", "Respiratory",
  "Digestive", "Endocrine", "Lymphatic", "Integumentary", "Urinary", "Reproductive"
];

const CATEGORIES = ["Bones", "Muscles", "Organs", "Vessels", "Nerves", "Joints", "Full Body"];

export default function AdminAnatomyModels() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<AnatomyModel | null>(null);
  const [modelUrl, setModelUrl] = useState<string>("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string>("");

  const { data: models = [], isLoading } = useQuery<AnatomyModel[]>({
    queryKey: ["/api/lms/admin/anatomy-models"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<AnatomyModel>) => {
      return apiRequest("POST", "/api/lms/admin/anatomy-models", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/anatomy-models"] });
      toast({ title: "Model created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create model", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AnatomyModel> }) => {
      return apiRequest("PATCH", `/api/lms/admin/anatomy-models/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/anatomy-models"] });
      toast({ title: "Model updated successfully" });
      setIsDialogOpen(false);
      setEditingModel(null);
    },
    onError: () => {
      toast({ title: "Failed to update model", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/lms/admin/anatomy-models/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/anatomy-models"] });
      toast({ title: "Model deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete model", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      modelUrl: modelUrl,
      thumbnailUrl: thumbnailUrl || null,
      bodySystem: formData.get("bodySystem") as string,
      category: formData.get("category") as string,
      isPublished: true,
    };

    if (!data.modelUrl) {
      toast({ title: "Please upload a 3D model or provide a URL", variant: "destructive" });
      return;
    }

    if (editingModel) {
      updateMutation.mutate({ id: editingModel.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (model: AnatomyModel) => {
    setEditingModel(model);
    setModelUrl(model.modelUrl || "");
    setThumbnailUrl(model.thumbnailUrl || "");
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingModel(null);
    setModelUrl("");
    setThumbnailUrl("");
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout title="3D Anatomy Models">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage 3D anatomy models for interactive learning</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-create-model">
              <Plus className="h-4 w-4 mr-2" />
              Add Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingModel ? "Edit Model" : "Add New Model"}</DialogTitle>
              <DialogDescription>
                {editingModel ? "Update the model's 3D assets and metadata." : "Upload a 3D model and fill in the details."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingModel?.title || ""}
                  required
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingModel?.description || ""}
                  data-testid="input-description"
                />
              </div>
              <ModelUploader
                name="modelUrl"
                label="3D Model (GLB/GLTF)"
                defaultValue={modelUrl}
                onUploadComplete={(path) => setModelUrl(path)}
              />
              <ImageUploader
                name="thumbnailUrl"
                label="Thumbnail Image"
                defaultValue={thumbnailUrl}
                onUploadComplete={(path) => setThumbnailUrl(path)}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bodySystem">Body System</Label>
                  <Select name="bodySystem" defaultValue={editingModel?.bodySystem || ""}>
                    <SelectTrigger data-testid="select-body-system">
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_SYSTEMS.map((system) => (
                        <SelectItem key={system} value={system}>{system}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingModel?.category || ""}>
                    <SelectTrigger data-testid="select-category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingModel ? "Update" : "Add Model"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : models.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Atom className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No 3D models yet</p>
            <p className="text-sm">Add your first model to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Body System</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.id} data-testid={`row-model-${model.id}`}>
                  <TableCell className="font-medium">{model.title}</TableCell>
                  <TableCell>{model.bodySystem || "-"}</TableCell>
                  <TableCell>{model.category}</TableCell>
                  <TableCell>
                    <Badge variant={model.isPublished ? "default" : "secondary"}>
                      {model.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(model)}
                        data-testid={`button-edit-${model.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(model.id)}
                        data-testid={`button-delete-${model.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </AdminLayout>
  );
}
