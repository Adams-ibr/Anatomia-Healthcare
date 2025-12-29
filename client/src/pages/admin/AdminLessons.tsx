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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ArrowLeft,
  FileText,
  Video,
  File,
  GripVertical,
  Clock
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Lesson } from "@shared/schema";

export default function AdminLessons() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    contentType: "text",
    videoUrl: "",
    duration: 0,
    order: 0,
    isFree: false,
    isPublished: true,
  });

  const { data: lessons, isLoading } = useQuery<Lesson[]>({
    queryKey: [`/api/lms/admin/modules/${moduleId}/lessons`],
    enabled: !!moduleId,
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData & { moduleId: string }) => {
      const response = await apiRequest("POST", "/api/lms/admin/lessons", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lms/admin/modules/${moduleId}/lessons`] });
      toast({ title: "Lesson created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create lesson", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/lessons/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lms/admin/modules/${moduleId}/lessons`] });
      toast({ title: "Lesson updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update lesson", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/lessons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/lms/admin/modules/${moduleId}/lessons`] });
      toast({ title: "Lesson deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete lesson", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      content: "",
      contentType: "text",
      videoUrl: "",
      duration: 0,
      order: lessons?.length || 0,
      isFree: false,
      isPublished: true,
    });
    setEditingLesson(null);
  };

  const handleEdit = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      description: lesson.description || "",
      content: lesson.content || "",
      contentType: lesson.contentType,
      videoUrl: lesson.videoUrl || "",
      duration: lesson.duration || 0,
      order: lesson.order || 0,
      isFree: lesson.isFree ?? false,
      isPublished: lesson.isPublished ?? true,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLesson) {
      updateMutation.mutate({ id: editingLesson.id, data: formData });
    } else {
      createMutation.mutate({ ...formData, moduleId: moduleId! });
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Video className="w-4 h-4" />;
      case "text":
        return <FileText className="w-4 h-4" />;
      default:
        return <File className="w-4 h-4" />;
    }
  };

  return (
    <AdminLayout title="Module Lessons">
      <div className="mb-6">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => window.history.back()} data-testid="button-back">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Modules
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">Add lessons to this module</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-add-lesson">
              <Plus className="w-4 h-4 mr-2" /> Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLesson ? "Edit Lesson" : "Create New Lesson"}</DialogTitle>
              <DialogDescription>
                {editingLesson ? "Update lesson details" : "Add a new lesson to this module"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Understanding Bone Structure"
                    data-testid="input-lesson-title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief lesson description..."
                    rows={2}
                    data-testid="input-lesson-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="contentType">Content Type</Label>
                    <Select
                      value={formData.contentType}
                      onValueChange={(value) => setFormData({ ...formData, contentType: value })}
                    >
                      <SelectTrigger data-testid="select-lesson-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text/Article</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                        <SelectItem value="interactive">Interactive/3D</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                      data-testid="input-lesson-duration"
                    />
                  </div>
                </div>
                {formData.contentType === "video" && (
                  <div className="grid gap-2">
                    <Label htmlFor="videoUrl">Video URL</Label>
                    <Input
                      id="videoUrl"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-lesson-video"
                    />
                  </div>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Lesson content (supports Markdown)..."
                    rows={6}
                    data-testid="input-lesson-content"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    data-testid="input-lesson-order"
                  />
                </div>
                <div className="flex gap-6 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isFree"
                      checked={formData.isFree}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked })}
                      data-testid="switch-lesson-free"
                    />
                    <Label htmlFor="isFree">Free Preview</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                      data-testid="switch-lesson-published"
                    />
                    <Label htmlFor="isPublished">Published</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="button-save-lesson"
                >
                  {editingLesson ? "Update Lesson" : "Create Lesson"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-5 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : lessons && lessons.length > 0 ? (
        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <Card key={lesson.id} data-testid={`card-lesson-${lesson.id}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="text-muted-foreground cursor-grab">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="p-2 bg-muted rounded-md">
                    {getContentTypeIcon(lesson.contentType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-sm text-muted-foreground">Lesson {index + 1}</span>
                      <h3 className="font-medium">{lesson.title}</h3>
                      {lesson.isFree && (
                        <Badge variant="outline" className="text-xs">Free</Badge>
                      )}
                      {!lesson.isPublished && (
                        <Badge variant="secondary" className="text-xs">Draft</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="capitalize">{lesson.contentType}</span>
                      {lesson.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {lesson.duration} min
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(lesson)}
                      data-testid={`button-edit-${lesson.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this lesson?")) {
                          deleteMutation.mutate(lesson.id);
                        }
                      }}
                      data-testid={`button-delete-${lesson.id}`}
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
            <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No lessons yet</h3>
            <p className="text-muted-foreground mb-4">
              Add lessons to this module
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-lesson">
              <Plus className="w-4 h-4 mr-2" /> Create Lesson
            </Button>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
