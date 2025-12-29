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
import type { FaqItem } from "@shared/schema";

export default function AdminFaq() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: faqs, isLoading } = useQuery<FaqItem[]>({
    queryKey: ["/api/admin/faq"],
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: Partial<FaqItem>) => apiRequest("POST", "/api/admin/faq", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => toast({ title: "Failed to create FAQ", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: Partial<FaqItem> & { id: string }) => 
      apiRequest("PATCH", `/api/admin/faq/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ updated successfully" });
      setIsDialogOpen(false);
      setEditingFaq(null);
    },
    onError: () => toast({ title: "Failed to update FAQ", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/faq/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/faq"] });
      toast({ title: "FAQ deleted successfully" });
    },
    onError: () => toast({ title: "Failed to delete FAQ", variant: "destructive" }),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      question: formData.get("question") as string,
      answer: formData.get("answer") as string,
      category: formData.get("category") as string,
      order: parseInt(formData.get("order") as string) || 0,
      isActive: formData.get("isActive") === "on",
    };

    if (editingFaq) {
      updateMutation.mutate({ ...data, id: editingFaq.id });
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
          <h1 className="text-xl font-semibold">Manage FAQ</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <p className="text-muted-foreground">{faqs?.length || 0} FAQ items</p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingFaq(null)} data-testid="button-add-faq">
                <Plus className="h-4 w-4 mr-2" />
                Add FAQ
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingFaq ? "Edit FAQ" : "New FAQ"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input id="question" name="question" defaultValue={editingFaq?.question || ""} required data-testid="input-question" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="answer">Answer</Label>
                  <Textarea id="answer" name="answer" defaultValue={editingFaq?.answer || ""} required className="min-h-[120px]" data-testid="input-answer" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input id="category" name="category" defaultValue={editingFaq?.category || ""} required placeholder="General" data-testid="input-category" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="order">Order</Label>
                    <Input id="order" name="order" type="number" defaultValue={editingFaq?.order || 0} data-testid="input-order" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch id="isActive" name="isActive" defaultChecked={editingFaq?.isActive ?? true} />
                  <Label htmlFor="isActive">Active</Label>
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} data-testid="button-save">
                    {editingFaq ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading FAQs...</div>
        ) : (
          <div className="space-y-4">
            {faqs?.map((faq) => (
              <Card key={faq.id} className={!faq.isActive ? "opacity-60" : ""} data-testid={`faq-${faq.id}`}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{faq.question}</h3>
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{faq.category}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{faq.answer}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { setEditingFaq(faq); setIsDialogOpen(true); }}
                        data-testid={`button-edit-${faq.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => deleteMutation.mutate(faq.id)}
                        data-testid={`button-delete-${faq.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {faqs?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">No FAQ items yet.</div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
