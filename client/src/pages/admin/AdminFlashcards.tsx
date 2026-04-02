import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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
import { Plus, Pencil, Trash2, Layers, ArrowLeft, BookOpen, HelpCircle, Lightbulb, Sparkles, Upload } from "lucide-react";
import { BulkUploadDialog } from "@/components/admin/BulkUploadDialog";
import type { FlashcardDeck, Flashcard } from "@shared/schema";

interface FlashcardOption {
  text: string;
  isCorrect: boolean;
}

type FlashcardWithOptions = Omit<Flashcard, 'options'> & {
  options?: FlashcardOption[];
};

const CARD_TYPES = [
  { value: "learning", label: "Learning Card", icon: BookOpen, description: "Standard front/back card" },
  { value: "question", label: "Question Card", icon: HelpCircle, description: "Multiple choice question" },
  { value: "fun_fact", label: "Fun Fact", icon: Sparkles, description: "Interesting medical fact" },
  { value: "tip", label: "Study Tip", icon: Lightbulb, description: "Helpful study advice" },
];

function getCardTypeInfo(cardType: string) {
  return CARD_TYPES.find(t => t.value === cardType) || CARD_TYPES[0];
}

const FLASHCARD_CSV_TEMPLATE = `front,back,cardType,explanation
"What is the function of hemoglobin?","To carry oxygen from the lungs to the tissues",learning,"Red blood cells contain hemoglobin"
"The mitochondria is the powerhouse of the cell",true,fun_fact,""
"Always review flashcards before sleep for better retention","Studies show sleep helps consolidate memory",tip,""`;

const FLASHCARD_JSON_TEMPLATE = [
  {
    front: "What is the function of hemoglobin?",
    back: "To carry oxygen from the lungs to the tissues",
    cardType: "learning",
    explanation: "Red blood cells contain hemoglobin",
  },
];

const deckFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().optional(),
  isPublished: z.boolean().default(false),
});

const cardFormSchema = z.object({
  front: z.string().min(1, "Front text is required"),
  back: z.string().min(1, "Back text is required"),
  cardType: z.string().default("learning"),
  explanation: z.string().optional(),
});

type DeckFormValues = z.infer<typeof deckFormSchema>;
type CardFormValues = z.infer<typeof cardFormSchema>;

export default function AdminFlashcards() {
  const { toast } = useToast();
  const [isDeckDialogOpen, setIsDeckDialogOpen] = useState(false);
  const [isCardDialogOpen, setIsCardDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<FlashcardDeck | null>(null);
  const [editingCard, setEditingCard] = useState<FlashcardWithOptions | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<FlashcardDeck | null>(null);
  const [cardOptions, setCardOptions] = useState<FlashcardOption[]>([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);

  const deckForm = useForm<DeckFormValues>({
    resolver: zodResolver(deckFormSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      isPublished: false,
    },
  });

  const cardForm = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      front: "",
      back: "",
      cardType: "learning",
      explanation: "",
    },
  });

  const { data: decks = [], isLoading: decksLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/lms/admin/flashcard-decks"],
  });

  const { data: cards = [], isLoading: cardsLoading } = useQuery<FlashcardWithOptions[]>({
    queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"],
    enabled: !!selectedDeck,
  });

  const createDeckMutation = useMutation({
    mutationFn: async (data: DeckFormValues) => {
      const response = await apiRequest("POST", "/api/lms/admin/flashcard-decks", {
        ...data,
        description: data.description || null,
        category: data.category || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck created successfully" });
      handleCloseDeckDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create deck", description: error.message, variant: "destructive" });
    },
  });

  const updateDeckMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: DeckFormValues }) => {
      const response = await apiRequest("PUT", `/api/lms/admin/flashcard-decks/${id}`, {
        ...data,
        description: data.description || null,
        category: data.category || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck updated successfully" });
      handleCloseDeckDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update deck", description: error.message, variant: "destructive" });
    },
  });

  const deleteDeckMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/flashcard-decks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      toast({ title: "Deck deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete deck", description: error.message, variant: "destructive" });
    },
  });

  const createCardMutation = useMutation({
    mutationFn: async (data: CardFormValues) => {
      const payload: any = {
        ...data,
        explanation: data.explanation || null,
      };
      if (data.cardType === "question") {
        payload.options = cardOptions.filter(o => o.text.trim());
      }
      const response = await apiRequest("POST", `/api/lms/admin/flashcard-decks/${selectedDeck?.id}/flashcards`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"] });
      toast({ title: "Card created successfully" });
      handleCloseCardDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create card", description: error.message, variant: "destructive" });
    },
  });

  const updateCardMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CardFormValues }) => {
      const payload: any = {
        ...data,
        explanation: data.explanation || null,
      };
      if (data.cardType === "question") {
        payload.options = cardOptions.filter(o => o.text.trim());
      }
      const response = await apiRequest("PUT", `/api/lms/admin/flashcards/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"] });
      toast({ title: "Card updated successfully" });
      handleCloseCardDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update card", description: error.message, variant: "destructive" });
    },
  });

  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/flashcards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"] });
      toast({ title: "Card deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete card", description: error.message, variant: "destructive" });
    },
  });

  const handleCloseDeckDialog = () => {
    setIsDeckDialogOpen(false);
    setEditingDeck(null);
    deckForm.reset({
      title: "",
      description: "",
      category: "",
      isPublished: false,
    });
  };

  const handleCloseCardDialog = () => {
    setIsCardDialogOpen(false);
    setEditingCard(null);
    cardForm.reset({
      front: "",
      back: "",
      cardType: "learning",
      explanation: "",
    });
    setCardOptions([
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
      { text: "", isCorrect: false },
    ]);
  };

  const handleOpenDeckDialog = (deck?: FlashcardDeck) => {
    if (deck) {
      setEditingDeck(deck);
      deckForm.reset({
        title: deck.title,
        description: deck.description || "",
        category: deck.category || "",
        isPublished: deck.isPublished ?? false,
      });
    } else {
      setEditingDeck(null);
      deckForm.reset({
        title: "",
        description: "",
        category: "",
        isPublished: false,
      });
    }
    setIsDeckDialogOpen(true);
  };

  const handleOpenCardDialog = (card?: FlashcardWithOptions) => {
    if (card) {
      setEditingCard(card);
      cardForm.reset({
        front: card.front,
        back: card.back,
        cardType: card.cardType || "learning",
        explanation: card.explanation || "",
      });
      if (card.options && card.options.length > 0) {
        const opts = card.options.map(o => ({ text: o.text, isCorrect: o.isCorrect }));
        while (opts.length < 4) opts.push({ text: "", isCorrect: false });
        setCardOptions(opts);
      } else {
        setCardOptions([
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
          { text: "", isCorrect: false },
        ]);
      }
    } else {
      setEditingCard(null);
      cardForm.reset({
        front: "",
        back: "",
        cardType: "learning",
        explanation: "",
      });
      setCardOptions([
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
        { text: "", isCorrect: false },
      ]);
    }
    setIsCardDialogOpen(true);
  };

  const onDeckSubmit = (data: DeckFormValues) => {
    if (editingDeck) {
      updateDeckMutation.mutate({ id: editingDeck.id, data });
    } else {
      createDeckMutation.mutate(data);
    }
  };

  const onCardSubmit = (data: CardFormValues) => {
    if (editingCard) {
      updateCardMutation.mutate({ id: editingCard.id, data });
    } else {
      createCardMutation.mutate(data);
    }
  };

  const watchCardType = cardForm.watch("cardType");

  if (selectedDeck) {
    return (
      <AdminLayout title={`Flashcards: ${selectedDeck.title}`}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Button variant="ghost" onClick={() => setSelectedDeck(null)} data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Decks
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setBulkUploadOpen(true)} data-testid="button-bulk-upload">
                <Upload className="h-4 w-4 mr-2" />
                Bulk Upload
              </Button>
              <Button onClick={() => handleOpenCardDialog()} data-testid="button-add-card">
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            </div>
          </div>

          {cardsLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading cards...</div>
          ) : cards.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No flashcards yet</p>
                <p className="text-sm">Add your first card to this deck</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Front</TableHead>
                    <TableHead>Back</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((card) => {
                    const typeInfo = getCardTypeInfo(card.cardType || "learning");
                    const Icon = typeInfo.icon;
                    return (
                      <TableRow key={card.id} data-testid={`row-card-${card.id}`}>
                        <TableCell className="max-w-xs truncate">{card.front}</TableCell>
                        <TableCell className="max-w-xs truncate">{card.back}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            <Icon className="h-3 w-3" />
                            {typeInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenCardDialog(card)}
                              data-testid={`button-edit-${card.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Delete this card?")) {
                                  deleteCardMutation.mutate(card.id);
                                }
                              }}
                              data-testid={`button-delete-${card.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          <Dialog open={isCardDialogOpen} onOpenChange={(open) => !open && handleCloseCardDialog()}>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingCard ? "Edit Flashcard" : "Add New Flashcard"}</DialogTitle>
                <DialogDescription>Create a flashcard for students to study</DialogDescription>
              </DialogHeader>
              <Form {...cardForm}>
                <form onSubmit={cardForm.handleSubmit(onCardSubmit)} className="space-y-4">
                  <FormField
                    control={cardForm.control}
                    name="cardType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Card Type</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-card-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CARD_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cardForm.control}
                    name="front"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchCardType === "question" ? "Question" : 
                           watchCardType === "fun_fact" ? "Fact Title" :
                           watchCardType === "tip" ? "Tip Title" : "Front"}
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} data-testid="input-front" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {watchCardType === "question" && (
                    <div className="space-y-2">
                      <FormLabel>Answer Options</FormLabel>
                      {cardOptions.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Checkbox
                            checked={option.isCorrect}
                            onCheckedChange={(checked) => {
                              const newOptions = [...cardOptions];
                              newOptions[index].isCorrect = checked === true;
                              setCardOptions(newOptions);
                            }}
                          />
                          <Input
                            value={option.text}
                            onChange={(e) => {
                              const newOptions = [...cardOptions];
                              newOptions[index].text = e.target.value;
                              setCardOptions(newOptions);
                            }}
                            placeholder={`Option ${index + 1}`}
                            data-testid={`input-option-${index}`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <FormField
                    control={cardForm.control}
                    name="back"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {watchCardType === "question" ? "Explanation" : 
                           watchCardType === "fun_fact" ? "Fact Details" :
                           watchCardType === "tip" ? "Tip Details" : "Back"}
                        </FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={3} data-testid="input-back" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={cardForm.control}
                    name="explanation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={2} placeholder="Any additional context..." data-testid="input-explanation" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={handleCloseCardDialog}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createCardMutation.isPending || updateCardMutation.isPending}>
                      {createCardMutation.isPending || updateCardMutation.isPending ? "Saving..." : (editingCard ? "Update Card" : "Add Card")}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <BulkUploadDialog
            open={bulkUploadOpen}
            onOpenChange={setBulkUploadOpen}
            title="Bulk Upload Flashcards"
            description="Upload multiple flashcards at once using CSV or JSON format."
            csvTemplate={FLASHCARD_CSV_TEMPLATE}
            jsonTemplate={FLASHCARD_JSON_TEMPLATE}
            templateFileName="flashcards_template"
            onUpload={async (data) => {
              const items = data.map((row: any) => ({
                front: row.front,
                back: row.back,
                cardType: row.cardType || "learning",
                explanation: row.explanation || null,
              }));
              
              const response = await apiRequest(
                "POST",
                `/api/lms/admin/flashcard-decks/${selectedDeck?.id}/flashcards/bulk-import`,
                { items }
              );
              const result = await response.json();
              
              if (result.failed > 0) {
                toast({
                  title: `Imported ${result.imported} flashcards with ${result.failed} errors`,
                  variant: "destructive",
                });
              } else {
                toast({ title: `Successfully imported ${result.imported} flashcards` });
              }
              
              queryClient.invalidateQueries({ 
                queryKey: ["/api/lms/admin/flashcard-decks", selectedDeck?.id, "flashcards"] 
              });
            }}
          />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Flashcard Decks">
      <div className="flex justify-between items-center mb-6">
        <p className="text-muted-foreground">Manage flashcard decks for student study</p>
        <Button onClick={() => handleOpenDeckDialog()} data-testid="button-create-deck">
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
                        onClick={() => handleOpenDeckDialog(deck)}
                        data-testid={`button-edit-${deck.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => {
                          if (confirm("Delete this deck and all its cards?")) {
                            deleteDeckMutation.mutate(deck.id);
                          }
                        }}
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

      <Dialog open={isDeckDialogOpen} onOpenChange={(open) => !open && handleCloseDeckDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDeck ? "Edit Deck" : "Create New Deck"}</DialogTitle>
            <DialogDescription>Create a deck to organize your flashcards</DialogDescription>
          </DialogHeader>
          <Form {...deckForm}>
            <form onSubmit={deckForm.handleSubmit(onDeckSubmit)} className="space-y-4">
              <FormField
                control={deckForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Anatomy Basics" data-testid="input-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={deckForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder="Brief description of this deck..." data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={deckForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Anatomy, Physiology, Pharmacology" data-testid="input-category" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={deckForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0">Published</FormLabel>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={handleCloseDeckDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createDeckMutation.isPending || updateDeckMutation.isPending}>
                  {createDeckMutation.isPending || updateDeckMutation.isPending ? "Saving..." : (editingDeck ? "Update" : "Create")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
