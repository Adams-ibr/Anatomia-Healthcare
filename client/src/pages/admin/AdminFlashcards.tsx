import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
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
import { Plus, Pencil, Trash2, Layers } from "lucide-react";
import type { FlashcardDeck } from "@shared/schema";

export default function AdminFlashcards() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);

  const { data: decks = [], isLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/lms/admin/flashcard-decks"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<FlashcardDeck>) => {
      return apiRequest("POST", "/api/lms/admin/flashcard-decks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck created successfully" });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create deck", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FlashcardDeck> }) => {
      return apiRequest("PATCH", `/api/lms/admin/flashcard-decks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck updated successfully" });
      setIsDialogOpen(false);
      setEditingDeck(null);
    },
    onError: () => {
      toast({ title: "Failed to update deck", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/lms/admin/flashcard-decks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete deck", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      isPublished: true,
    };

    if (editingDeck) {
      updateMutation.mutate({ id: editingDeck.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const openEditDialog = (deck: FlashcardDeck) => {
    setEditingDeck(deck);
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingDeck(null);
    setIsDialogOpen(true);
  };

  return (
    <AdminLayout title="Flashcard Decks">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage flashcard decks for student study</p>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} data-testid="button-create-deck">
              <Plus className="h-4 w-4 mr-2" />
              Create Deck
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDeck ? "Edit Deck" : "Create New Deck"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingDeck?.title || ""}
                  required
                  data-testid="input-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingDeck?.description || ""}
                  data-testid="input-description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  name="category"
                  defaultValue={editingDeck?.category || ""}
                  data-testid="input-category"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingDeck ? "Update" : "Create"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : decks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No flashcard decks yet</p>
            <p className="text-sm">Create your first deck to get started</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cards</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decks.map((deck) => (
                <TableRow key={deck.id} data-testid={`row-deck-${deck.id}`}>
                  <TableCell className="font-medium">{deck.title}</TableCell>
                  <TableCell>{deck.category || "-"}</TableCell>
                  <TableCell>{(deck as any).cardCount || 0}</TableCell>
                  <TableCell>
                    <Badge variant={deck.isPublished ? "default" : "secondary"}>
                      {deck.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDialog(deck)}
                        data-testid={`button-edit-${deck.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteMutation.mutate(deck.id)}
                        data-testid={`button-delete-${deck.id}`}
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
