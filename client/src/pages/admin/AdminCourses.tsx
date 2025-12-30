import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BookOpen, 
  Layers, 
  FileText,
  Eye,
  EyeOff,
  Crown
} from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Course } from "@shared/schema";
import { Link } from "wouter";

export default function AdminCourses() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    category: "anatomy",
    level: "beginner",
    duration: "",
    price: 0,
    isFree: true,
    isPublished: false,
    isFeatured: false,
    requiredMembershipTier: "bronze",
  });

  const { data: courses, isLoading } = useQuery<Course[]>({
    queryKey: ["/api/lms/admin/courses"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/lms/admin/courses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/courses"] });
      toast({ title: "Course created successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create course", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const response = await apiRequest("PATCH", `/api/lms/admin/courses/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/courses"] });
      toast({ title: "Course updated successfully" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update course", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/courses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/courses"] });
      toast({ title: "Course deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete course", description: error.message, variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      description: "",
      shortDescription: "",
      category: "anatomy",
      level: "beginner",
      duration: "",
      price: 0,
      isFree: true,
      isPublished: false,
      isFeatured: false,
      requiredMembershipTier: "bronze",
    });
    setEditingCourse(null);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      description: course.description,
      shortDescription: course.shortDescription || "",
      category: course.category,
      level: course.level,
      duration: course.duration || "",
      price: course.price || 0,
      isFree: course.isFree ?? true,
      isPublished: course.isPublished ?? false,
      isFeatured: course.isFeatured ?? false,
      requiredMembershipTier: course.requiredMembershipTier || "bronze",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCourse) {
      updateMutation.mutate({ id: editingCourse.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  return (
    <AdminLayout title="LMS - Courses">
      <div className="flex justify-between items-center mb-6">
        <div>
          <p className="text-muted-foreground">Manage your courses, modules, and lessons</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} data-testid="button-add-course">
              <Plus className="w-4 h-4 mr-2" /> Add Course
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
              <DialogDescription>
                {editingCourse ? "Update course details" : "Fill in the details for the new course"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({ 
                        ...formData, 
                        title: e.target.value,
                        slug: editingCourse ? formData.slug : generateSlug(e.target.value)
                      });
                    }}
                    placeholder="e.g., Introduction to Human Anatomy"
                    data-testid="input-course-title"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">URL Slug</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="e.g., intro-human-anatomy"
                    data-testid="input-course-slug"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="shortDescription">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={formData.shortDescription}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Brief course summary"
                    data-testid="input-course-short-desc"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Full Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed course description..."
                    rows={4}
                    data-testid="input-course-description"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger data-testid="select-course-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="anatomy">Anatomy</SelectItem>
                        <SelectItem value="physiology">Physiology</SelectItem>
                        <SelectItem value="pathology">Pathology</SelectItem>
                        <SelectItem value="pharmacology">Pharmacology</SelectItem>
                        <SelectItem value="clinical">Clinical Skills</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="level">Level</Label>
                    <Select
                      value={formData.level}
                      onValueChange={(value) => setFormData({ ...formData, level: value })}
                    >
                      <SelectTrigger data-testid="select-course-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="e.g., 4 hours"
                      data-testid="input-course-duration"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="requiredMembershipTier">Required Membership</Label>
                    <Select
                      value={formData.requiredMembershipTier}
                      onValueChange={(value) => setFormData({ ...formData, requiredMembershipTier: value })}
                    >
                      <SelectTrigger data-testid="select-course-membership">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bronze">Bronze (Free)</SelectItem>
                        <SelectItem value="silver">Silver</SelectItem>
                        <SelectItem value="gold">Gold</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price (in cents)</Label>
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                      disabled={formData.isFree}
                      data-testid="input-course-price"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isFree"
                      checked={formData.isFree}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFree: checked, price: checked ? 0 : formData.price })}
                      data-testid="switch-course-free"
                    />
                    <Label htmlFor="isFree">Free Course</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isPublished"
                      checked={formData.isPublished}
                      onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                      data-testid="switch-course-published"
                    />
                    <Label htmlFor="isPublished">Published</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="isFeatured"
                      checked={formData.isFeatured}
                      onCheckedChange={(checked) => setFormData({ ...formData, isFeatured: checked })}
                      data-testid="switch-course-featured"
                    />
                    <Label htmlFor="isFeatured">Featured</Label>
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
                  data-testid="button-save-course"
                >
                  {editingCourse ? "Update Course" : "Create Course"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-muted rounded w-1/3 mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses && courses.length > 0 ? (
        <div className="space-y-4">
          {courses.map((course) => (
            <Card key={course.id} data-testid={`card-course-${course.id}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{course.title}</h3>
                      {course.isPublished ? (
                        <Badge variant="default" className="gap-1">
                          <Eye className="w-3 h-3" /> Published
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <EyeOff className="w-3 h-3" /> Draft
                        </Badge>
                      )}
                      {course.isFeatured && (
                        <Badge variant="outline">Featured</Badge>
                      )}
                      <Badge variant="outline">{course.level}</Badge>
                      <Badge 
                        variant="outline" 
                        className={
                          course.requiredMembershipTier === "diamond" ? "border-purple-500 text-purple-500" :
                          course.requiredMembershipTier === "gold" ? "border-yellow-500 text-yellow-600" :
                          course.requiredMembershipTier === "silver" ? "border-gray-400 text-gray-500" :
                          ""
                        }
                      >
                        <Crown className="w-3 h-3 mr-1" />
                        {course.requiredMembershipTier?.charAt(0).toUpperCase() + course.requiredMembershipTier?.slice(1) || "Bronze"}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm mb-2">
                      {course.shortDescription || course.description.substring(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>Category: {course.category}</span>
                      {course.duration && <span>Duration: {course.duration}</span>}
                      <span>{course.isFree ? "Free" : `$${(course.price || 0) / 100}`}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link href={`/admin/courses/${course.id}/modules`}>
                      <Button variant="outline" size="sm" data-testid={`button-modules-${course.id}`}>
                        <Layers className="w-4 h-4 mr-1" /> Modules
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(course)}
                      data-testid={`button-edit-${course.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this course?")) {
                          deleteMutation.mutate(course.id);
                        }
                      }}
                      data-testid={`button-delete-${course.id}`}
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
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first course to start building your LMS
            </p>
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-create-first-course">
              <Plus className="w-4 h-4 mr-2" /> Create Course
            </Button>
          </CardContent>
        </Card>
      )}
    </AdminLayout>
  );
}
