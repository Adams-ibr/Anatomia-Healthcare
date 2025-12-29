import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, Pencil, Trash2, Layers, ArrowLeft, BookOpen, HelpCircle } from "lucide-react";
import type { FlashcardDeck, Flashcard } from "@shared/schema";

interface FlashcardOption {
  text: string;
  isCorrect: boolean;
}

interface FlashcardWithOptions extends Omit<Flashcard, 'options'> {
  options?: FlashcardOption[] | unknown;
}

export default function AdminFlashcards() {
  const { toast } = useToast();
  const [isDeckDialogOpen, setIsDeckDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [editingCard, setEditingCard] = useState<FlashcardWithOptions | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [cardType, setCardType] = useState<string>("learning");
  const [cardOptions, setCardOptions] = useState<FlashcardOption[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const { data: decks = [], isLoading: decksLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/lms/admin/flashcard-decks"],
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery<FlashcardWithOptions[]>({
    queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"],
    queryFn: async () => {
      if (!selectedDeck) return [];
      const res = await fetch(`/api/lms/admin/flashcard-decks/${selectedDeck.id}`, {
        credentials: "include",
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.flashcards || [];
    },
    enabled: !!selectedDeck,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (data: Partial<FlashcardDeck>) => {
      return apiRequest("POST", "/api/lms/admin/flashcard-decks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck created successfully" });
      setIsDeckDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to create deck", variant: "destructive" });
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FlashcardDeck> }) => {
      return apiRequest("PUT", `/api/lms/admin/flashcard-decks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck updated successfully" });
      setIsDeckDialogOpen(false);
      setEditingDeck(null);
    },
    onError: () => {
      toast({ title: "Failed to update deck", variant: "destructive" });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/lms/admin/flashcard-decks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck deleted successfully" });
      if (selectedDeck) setSelectedDeck(null);
    },
    onError: () => {
      toast({ title: "Failed to delete deck", variant: "destructive" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: Partial<FlashcardWithOptions>) => {
      return apiRequest("POST", `/api/lms/admin/flashcard-decks/${selectedDeck?.id}/flashcards`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"] });
      toast({ title: "Card created successfully" });
      setIsCardDialogOpen(false);
      resetCardForm();
    },
    onError: () => {
      toast({ title: "Failed to create card", variant: "destructive" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FlashcardWithOptions> }) => {
      return apiRequest("PUT", `/api/lms/admin/flashcards/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"] });
      toast({ title: "Card updated successfully" });
      setIsCardDialogOpen(false);
      setEditingCard(null);
      resetCardForm();
    },
    onError: () => {
      toast({ title: "Failed to update card", variant: "destructive" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/lms/admin/flashcards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"] });
      toast({ title: "Card deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete card", variant: "destructive" });
    },
  });

  const resetCardForm = () => {
    setCardType("learning");
    setCardOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
  };

  const handleDeckSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      category: formData.get("category") as string,
      isPublished: true,
    };

    if (editingDeck) {
      updateDeckMutation.mutate({ id: editingDeck.id, data });
    } else {
      createDeckMutation.mutate(data);
    }
  };

  const handleCardSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<FlashcardWithOptions> = {
      cardType,
      front: formData.get("front") as string,
      back: formData.get("back") as string,
      explanation: formData.get("explanation") as string || null,
    };

    if (cardType === "question") {
      const validOptions = cardOptions.filter(opt => opt.text.trim());
      data.options = validOptions;
      const correctOption = validOptions.find(opt => opt.isCorrect);
      data.correctAnswer = correctOption?.text || null;
    }

    if (editingCard) {
      updateCardMutation.mutate({ id: editingCard.id, data });
    } else {
      createCardMutation.mutate(data);
    }
  };

  const openEditDeckDialog = (deck: FlashcardDeck) => {
    setEditingDeck(deck);
    setIsDeckDialogOpen(true);
  };

  const openCreateDeckDialog = () => {
    setEditingDeck(null);
    setIsDeckDialogOpen(true);
  };

  const openEditCardDialog = (card: FlashcardWithOptions) => {
    setEditingCard(card);
    setCardType(card.cardType || "learning");
    if (card.options && Array.isArray(card.options)) {
      setCardOptions(card.options.length > 0 ? card.options : [
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);
    } else {
      setCardOptions([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);
    }
    setIsCardDialogOpen(true);
  };

  const openCreateCardDialog = () => {
    setEditingCard(null);
    resetCardForm();
    setIsCardDialogOpen(true);
  };

  const updateOption = (index: number, field: keyof FlashcardOption, value: string | boolean) => {
    setCardOptions(prev => prev.map((opt, i) => 
      i === index ? { ...opt, [field]: value } : opt
    ));
  };

  const addOption = () => {
    setCardOptions(prev => [...prev, { text: "", isCorrect: false }]);
  };

  const removeOption = (index: number) => {
    setCardOptions(prev => prev.filter((_, i) => i !== index));
  };

  if (selectedDeck) {
    return (
      <AdminLayout title={`Flashcards: ${selectedDeck.title}`}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => setSelectedDeck(null)} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Decks
            </Button>
            <Button onClick={openCreateCardDialog} data-testid="button-add-card">
              <Plus className="h-4 w-4 mr-2" />
              Add Card
            </Button>
          </div>

          {cardsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cards...</div>
          ) : cards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No cards in this deck yet</p>
                <p className="text-sm">Add your first card to get started</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Front (Question/Term)</TableHead>
                    <TableHead>Back (Answer/Definition)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((card) => (
                    <TableRow key={card.id} data-testid={`row-card-${card.id}`}>
                      <TableCell>
                        <Badge variant={card.cardType === "question" ? "default" : "secondary"}>
                          {card.cardType === "question" ? (
                            <><HelpCircle className="h-3 w-3 mr-1" /> Question</>
                          ) : (
                            <><BookOpen className="h-3 w-3 mr-1" /> Learning</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-2">{card.front}</span>
                      </TableCell>
                      <TableCell className="max-w-[200px]">
                        <span className="line-clamp-2">{card.back}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditCardDialog(card)}
                            data-testid={`button-edit-card-${card.id}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => deleteCardMutation.mutate(card.id)}
                            data-testid={`button-delete-card-${card.id}`}
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

          <Dialog open={isCardDialogOpen} onOpenChange={setIsCardDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCard ? "Edit Card" : "Add New Card"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCardSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Card Type</Label>
                  <Tabs value={cardType} onValueChange={setCardType}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="learning" data-testid="tab-learning">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Learning Card
                      </TabsTrigger>
                      <TabsTrigger value="question" data-testid="tab-question">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Question Card
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="front">
                    {cardType === "question" ? "Question" : "Term / Front"}
                  </Label>
                  <Textarea
                    id="front"
                    name="front"
                    defaultValue={editingCard?.front || ""}
                    required
                    rows={3}
                    data-testid="input-front"
                  />
                </div>

                {cardType === "question" ? (
                  <>
                    <div className="space-y-3">
                      <Label>Answer Options</Label>
                      {cardOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <Checkbox
                            checked={option.isCorrect}
                            onCheckedChange={(checked) => updateOption(index, "isCorrect", !!checked)}
                            data-testid={`checkbox-correct-${index}`}
                          />
                          <Input
                            value={option.text}
                            onChange={(e) => updateOption(index, "text", e.target.value)}
                            placeholder={`Option ${index + 1}`}
                            className="flex-1"
                            data-testid={`input-option-${index}`}
                          />
                          {cardOptions.length > 2 && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => removeOption(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                      <Button type="button" variant="outline" onClick={addOption} className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Option
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Check the box next to the correct answer(s)
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="back">Correct Answer / Summary</Label>
                      <Textarea
                        id="back"
                        name="back"
                        defaultValue={editingCard?.back || ""}
                        required
                        rows={2}
                        data-testid="input-back"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="back">Definition / Back</Label>
                    <Textarea
                      id="back"
                      name="back"
                      defaultValue={editingCard?.back || ""}
                      required
                      rows={3}
                      data-testid="input-back"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="explanation">Explanation (Optional)</Label>
                  <Textarea
                    id="explanation"
                    name="explanation"
                    defaultValue={editingCard?.explanation || ""}
                    rows={2}
                    placeholder="Additional explanation for the answer"
                    data-testid="input-explanation"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsCardDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createCardMutation.isPending || updateCardMutation.isPending}>
                    {editingCard ? "Update Card" : "Add Card"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Flashcard Decks">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage flashcard decks for student study</p>
        <Button onClick={openCreateDeckDialog} data-testid="button-create-deck">
          <Plus className="h-4 w-4 mr-2" />
          Create Deck
        </Button>
      </div>

      {decksLoading ? (
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
                <TableRow 
                  key={deck.id} 
                  data-testid={`row-deck-${deck.id}`}
                  className="cursor-pointer hover-elevate"
                  onClick={() => setSelectedDeck(deck)}
                >
                  <TableCell className="font-medium">{deck.title}</TableCell>
                  <TableCell>{deck.category || "-"}</TableCell>
                  <TableCell>{(deck as any).cardCount || 0}</TableCell>
                  <TableCell>
                    <Badge variant={deck.isPublished ? "default" : "secondary"}>
                      {deck.isPublished ? "Published" : "Draft"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openEditDeckDialog(deck)}
                        data-testid={`button-edit-${deck.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteDeckMutation.mutate(deck.id)}
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

      <Dialog open={isDeckDialogOpen} onOpenChange={setIsDeckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeck ? "Edit Deck" : "Create New Deck"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeckSubmit} className="space-y-4">
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
              <Button type="button" variant="outline" onClick={() => setIsDeckDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDeckMutation.isPending || updateDeckMutation.isPending}>
                {editingDeck ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
