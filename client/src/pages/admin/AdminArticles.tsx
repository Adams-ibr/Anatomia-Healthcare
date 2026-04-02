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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { Article } from "@shared/schema";

export default function AdminArticles() {
  const { toast } = useToast();
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: articles, isLoading } = useQuery<Article[]>({
    queryKey: ["/api/admin/articles"],
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<Article>) => apiRequest("POST", "/api/admin/articles", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({ title: "Article created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create article", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<Article> & { id: string }) =>
      apiRequest("PATCH", `/api/admin/articles/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({ title: "Article updated successfully" });
      setIsDialogOpen(false);
      setEditingArticle(null);
    },
    onError: () => toast({ title: "Failed to update article", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/articles/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/articles"] });
      toast({ title: "Article deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete article", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      slug: formData.get("slug") as string,
      excerpt: formData.get("excerpt") as string,
      content: formData.get("content") as string,
      category: formData.get("category") as string,
      author: formData.get("author") as string,
      imageUrl: formData.get("imageUrl") as string || null,
      readTime: formData.get("readTime") as string || null,
      isFeatured: formData.get("isFeatured") === "on",
      isPublished: formData.get("isPublished") === "on",
    };

    if (editingArticle) {
      updateMutation.mutate({ ...data, id: editingArticle.id });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <AdminLayout title="Articles">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">{articles?.length || 0} articles</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingArticle(null)} data-testid="button-add-article">
              <Plus className="h-4 w-4 mr-2" />
              Add Article
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingArticle ? "Edit Article" : "New Article"}</DialogTitle>
              <DialogDescription>
                {editingArticle ? "Update the content and settings of your article." : "Create a new blog article by filling out the details below."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input id="title" name="title" defaultValue={editingArticle?.title || ""} required data-testid="input-title" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" name="slug" defaultValue={editingArticle?.slug || ""} required data-testid="input-slug" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" defaultValue={editingArticle?.category || ""} required data-testid="input-category" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">Author</Label>
                  <Input id="author" name="author" defaultValue={editingArticle?.author || ""} required data-testid="input-author" />
                </div>
              </div>
              <ImageUploader
                key={editingArticle?.id || "new"}
                name="imageUrl"
                label="Article Image"
                defaultValue={editingArticle?.imageUrl}
              />
              <div className="space-y-2">
                <Label htmlFor="readTime">Read Time</Label>
                <Input id="readTime" name="readTime" defaultValue={editingArticle?.readTime || ""} placeholder="5 min read" data-testid="input-readTime" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea id="excerpt" name="excerpt" defaultValue={editingArticle?.excerpt || ""} required data-testid="input-excerpt" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Content</Label>
                <Textarea id="content" name="content" defaultValue={editingArticle?.content || ""} required className="min-h-[200px]" data-testid="input-content" />
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Switch id="isFeatured" name="isFeatured" defaultChecked={editingArticle?.isFeatured || false} />
                  <Label htmlFor="isFeatured">Featured</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isPublished" name="isPublished" defaultChecked={editingArticle?.isPublished ?? true} />
                  <Label htmlFor="isPublished">Published</Label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                  {editingArticle ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading articles...</div>
      ) : (
        <div className="space-y-4">
          {articles?.map((article) => (
            <Card key={article.id} data-testid={`article-${article.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium">{article.title}</h3>
                      {!article.isPublished && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">Draft</span>
                      )}
                      {article.isFeatured && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Featured</span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.excerpt}</p>
                    <p className="text-xs text-muted-foreground mt-2">{article.category} | {article.author}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingArticle(article); setIsDialogOpen(true); }}
                      data-testid={`button-edit-${article.id}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteMutation.mutate(article.id)}
                      data-testid={`button-delete-${article.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {articles?.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No articles yet. Create your first article!</div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
