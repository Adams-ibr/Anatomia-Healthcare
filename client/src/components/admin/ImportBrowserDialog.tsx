import { useState, useMemo } from "react";
import { Search, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { QuestionBankItem, QuestionTopic, FlashcardDeck, Flashcard, AnatomyModel } from "@shared/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImportContentType =
  | "questions"
  | "flashcard-decks"
  | "flashcards"
  | "3d-models";

export interface ImportBrowserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contentType: ImportContentType;
  targetQuizId?: string;
  targetCourseId?: string;
  targetModuleId?: string;
  targetLessonId?: string;
  targetDeckId?: string;
  onImportSuccess?: () => void;
}

const DIALOG_TITLES: Record<ImportContentType, string> = {
  questions: "Import Questions from Question Bank",
  "flashcard-decks": "Import Flashcard Decks",
  flashcards: "Import Flashcards",
  "3d-models": "Import 3D Anatomy Models",
};

// ─── Question browsing mode ───────────────────────────────────────────────────

function QuestionBrowserContent({
  searchQuery,
  filters,
  onFilterChange,
  selectedIds,
  onToggleId,
  duplicateIds,
}: {
  searchQuery: string;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  selectedIds: Set<string>;
  onToggleId: (id: string) => void;
  duplicateIds: Set<string>;
}) {
  const { data: questions = [], isLoading: questionsLoading } = useQuery<QuestionBankItem[]>({
    queryKey: ["/api/lms/admin/question-bank"],
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const { data: topics = [] } = useQuery<QuestionTopic[]>({
    queryKey: ["/api/lms/admin/question-topics"],
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return questions.filter((item) => {
      if (q && !item.question.toLowerCase().includes(q)) return false;
      if (filters.topic && item.topicId !== filters.topic) return false;
      if (filters.difficulty && item.difficulty !== filters.difficulty) return false;
      return true;
    });
  }, [questions, searchQuery, filters]);

  return (
    <>
      {/* Topic + Difficulty filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Topic</Label>
          <Select
            value={filters.topic || "all"}
            onValueChange={(v) => onFilterChange("topic", v)}
          >
            <SelectTrigger className="h-8 text-sm" data-testid="import-filter-topic">
              <SelectValue placeholder="All Topics" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Topics</SelectItem>
              {topics.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px]">
          <Label className="text-xs text-muted-foreground">Difficulty</Label>
          <Select
            value={filters.difficulty || "all"}
            onValueChange={(v) => onFilterChange("difficulty", v)}
          >
            <SelectTrigger className="h-8 text-sm" data-testid="import-filter-difficulty">
              <SelectValue placeholder="All Difficulties" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Difficulties</SelectItem>
              <SelectItem value="easy">Easy</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="hard">Hard</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Question list */}
      <ScrollArea className="flex-1 min-h-0 border rounded-md">
        <div className="min-h-[300px]" data-testid="import-item-list">
          {questionsLoading ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
              Loading questions…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
              No questions match your filters.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 sticky top-0">
                <tr>
                  <th className="w-8 p-2" />
                  <th className="p-2 text-left font-medium">Question</th>
                  <th className="p-2 text-left font-medium whitespace-nowrap">Type</th>
                  <th className="p-2 text-left font-medium">Topic</th>
                  <th className="p-2 text-left font-medium">Difficulty</th>
                  <th className="p-2 text-right font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isDuplicate = duplicateIds.has(item.id);
                  const isSelected = selectedIds.has(item.id);
                  const topicName = topics.find((t) => t.id === item.topicId)?.name ?? "—";
                  return (
                    <tr
                      key={item.id}
                      className={`border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${
                        isDuplicate ? "bg-yellow-50 dark:bg-yellow-950/20" : ""
                      }`}
                      onClick={() => onToggleId(item.id)}
                    >
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleId(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`import-checkbox-${item.id}`}
                        />
                      </td>
                      <td className="p-2 max-w-xs">
                        <div className="flex items-start gap-1.5">
                          {isDuplicate && (
                            <AlertTriangle
                              className="h-3.5 w-3.5 text-yellow-500 mt-0.5 flex-shrink-0"
                              aria-label="Possible duplicate"
                            />
                          )}
                          <span className="line-clamp-2">{item.question}</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                          {item.questionType.replace(/_/g, " ")}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground whitespace-nowrap">{topicName}</td>
                      <td className="p-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            item.difficulty === "easy"
                              ? "border-green-500 text-green-600"
                              : item.difficulty === "hard"
                              ? "border-red-500 text-red-600"
                              : "border-yellow-500 text-yellow-600"
                          }`}
                        >
                          {item.difficulty}
                        </Badge>
                      </td>
                      <td className="p-2 text-right font-medium">{item.points ?? 1}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

// ─── Flashcard Deck browsing mode ────────────────────────────────────────────

function FlashcardDeckBrowserContent({
  searchQuery,
  filters,
  onFilterChange,
  selectedIds,
  onToggleId,
  duplicateIds,
}: {
  searchQuery: string;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  selectedIds: Set<string>;
  onToggleId: (id: string) => void;
  duplicateIds: Set<string>;
}) {
  const { data: decks = [], isLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/lms/admin/flashcard-decks"],
    select: (data) => (Array.isArray(data) ? data : []),
  });

  // Derive unique categories for the filter
  const categories = useMemo(
    () => Array.from(new Set(decks.map((d) => d.category).filter(Boolean) as string[])).sort(),
    [decks]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return decks.filter((deck) => {
      if (
        q &&
        !deck.title.toLowerCase().includes(q) &&
        !(deck.description ?? "").toLowerCase().includes(q)
      )
        return false;
      if (filters.category && deck.category !== filters.category) return false;
      return true;
    });
  }, [decks, searchQuery, filters]);

  return (
    <>
      {/* Category filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) => onFilterChange("category", v)}
          >
            <SelectTrigger className="h-8 text-sm" data-testid="import-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Deck list */}
      <ScrollArea className="flex-1 min-h-0 border rounded-md">
        <div className="min-h-[300px]" data-testid="import-item-list">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
              Loading decks…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
              No decks match your filters.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 sticky top-0">
                <tr>
                  <th className="w-8 p-2" />
                  <th className="p-2 text-left font-medium">Title</th>
                  <th className="p-2 text-left font-medium">Description</th>
                  <th className="p-2 text-left font-medium">Category</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((deck) => {
                  const isDuplicate = duplicateIds.has(deck.id);
                  const isSelected = selectedIds.has(deck.id);
                  return (
                    <tr
                      key={deck.id}
                      className={`border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${
                        isDuplicate ? "bg-yellow-50 dark:bg-yellow-950/20" : ""
                      }`}
                      onClick={() => onToggleId(deck.id)}
                    >
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleId(deck.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`import-checkbox-${deck.id}`}
                        />
                      </td>
                      <td className="p-2 max-w-[200px]">
                        <div className="flex items-start gap-1.5">
                          {isDuplicate && (
                            <AlertTriangle
                              className="h-3.5 w-3.5 text-yellow-500 mt-0.5 flex-shrink-0"
                              aria-label="Possible duplicate"
                            />
                          )}
                          <span className="font-medium line-clamp-2">{deck.title}</span>
                        </div>
                      </td>
                      <td className="p-2 text-muted-foreground max-w-xs">
                        <span className="line-clamp-2">{deck.description ?? "—"}</span>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        {deck.category ? (
                          <Badge variant="secondary" className="text-xs">
                            {deck.category}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

// ─── Individual Flashcard browsing mode ──────────────────────────────────────

type DeckWithCards = FlashcardDeck & { flashcards: Flashcard[] };

function FlashcardBrowserContent({
  searchQuery,
  selectedIds,
  onToggleId,
}: {
  searchQuery: string;
  selectedIds: Set<string>;
  onToggleId: (id: string) => void;
}) {
  const { data: decks = [], isLoading: decksLoading } = useQuery<FlashcardDeck[]>({
    queryKey: ["/api/lms/admin/flashcard-decks"],
    select: (data) => (Array.isArray(data) ? data : []),
  });

  // Fetch each deck with its cards; enabled once we have deck IDs
  const { data: decksWithCards = [], isLoading: cardsLoading } = useQuery<DeckWithCards[]>({
    queryKey: ["/api/lms/admin/flashcard-decks/all-with-cards", decks.map((d) => d.id).join(",")],
    enabled: decks.length > 0,
    queryFn: async () => {
      const results = await Promise.all(
        decks.map((deck) =>
          fetch(`/api/lms/admin/flashcard-decks/${deck.id}`)
            .then((r) => r.json())
            .then((data) => ({ ...deck, flashcards: Array.isArray(data.flashcards) ? data.flashcards : [] }))
        )
      );
      return results;
    },
  });

  const isLoading = decksLoading || cardsLoading;

  const filteredDecks = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return decksWithCards
      .map((deck) => ({
        ...deck,
        flashcards: deck.flashcards.filter(
          (card) =>
            !q ||
            card.front.toLowerCase().includes(q) ||
            card.back.toLowerCase().includes(q)
        ),
      }))
      .filter((deck) => deck.flashcards.length > 0);
  }, [decksWithCards, searchQuery]);

  return (
    <ScrollArea className="flex-1 min-h-0 border rounded-md">
      <div className="min-h-[300px]" data-testid="import-item-list">
        {isLoading ? (
          <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
            Loading flashcards…
          </div>
        ) : filteredDecks.length === 0 ? (
          <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
            No flashcards match your search.
          </div>
        ) : (
          <div className="divide-y">
            {filteredDecks.map((deck) => (
              <div key={deck.id}>
                {/* Deck header */}
                <div className="px-3 py-2 bg-muted/50 flex items-center gap-2 sticky top-0 z-10">
                  <span className="font-medium text-sm">{deck.title}</span>
                  {deck.category && (
                    <Badge variant="secondary" className="text-xs">
                      {deck.category}
                    </Badge>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {deck.flashcards.length} card{deck.flashcards.length !== 1 ? "s" : ""}
                  </span>
                </div>
                {/* Cards */}
                <table className="w-full text-sm">
                  <tbody>
                    {deck.flashcards.map((card) => {
                      const isSelected = selectedIds.has(card.id);
                      return (
                        <tr
                          key={card.id}
                          className="border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors"
                          onClick={() => onToggleId(card.id)}
                        >
                          <td className="w-8 p-2 text-center">
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => onToggleId(card.id)}
                              onClick={(e) => e.stopPropagation()}
                              data-testid={`import-checkbox-${card.id}`}
                            />
                          </td>
                          <td className="p-2 max-w-xs">
                            <span className="line-clamp-2 font-medium">{card.front}</span>
                          </td>
                          <td className="p-2 max-w-xs text-muted-foreground">
                            <span className="line-clamp-2">{card.back}</span>
                          </td>
                          <td className="p-2 whitespace-nowrap">
                            <Badge variant="outline" className="text-xs">
                              {card.cardType}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// ─── 3D Model browsing mode ───────────────────────────────────────────────────

function ModelBrowserContent({
  searchQuery,
  filters,
  onFilterChange,
  selectedIds,
  onToggleId,
  duplicateIds,
}: {
  searchQuery: string;
  filters: Record<string, string>;
  onFilterChange: (key: string, value: string) => void;
  selectedIds: Set<string>;
  onToggleId: (id: string) => void;
  duplicateIds: Set<string>;
}) {
  const { data: models = [], isLoading } = useQuery<AnatomyModel[]>({
    queryKey: ["/api/lms/admin/anatomy-models"],
    select: (data) => (Array.isArray(data) ? data : []),
  });

  const categories = useMemo(
    () => Array.from(new Set(models.map((m) => m.category).filter(Boolean))).sort(),
    [models]
  );

  const bodySystems = useMemo(
    () =>
      Array.from(new Set(models.map((m) => m.bodySystem).filter(Boolean) as string[])).sort(),
    [models]
  );

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return models.filter((model) => {
      if (
        q &&
        !model.title.toLowerCase().includes(q) &&
        !(model.description ?? "").toLowerCase().includes(q)
      )
        return false;
      if (filters.category && model.category !== filters.category) return false;
      if (filters.bodySystem && model.bodySystem !== filters.bodySystem) return false;
      return true;
    });
  }, [models, searchQuery, filters]);

  return (
    <>
      {/* Category + Body System filters */}
      <div className="flex flex-wrap gap-3">
        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(v) => onFilterChange("category", v)}
          >
            <SelectTrigger className="h-8 text-sm" data-testid="import-filter-category">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-1 min-w-[160px]">
          <Label className="text-xs text-muted-foreground">Body System</Label>
          <Select
            value={filters.bodySystem || "all"}
            onValueChange={(v) => onFilterChange("bodySystem", v)}
          >
            <SelectTrigger className="h-8 text-sm" data-testid="import-filter-body-system">
              <SelectValue placeholder="All Systems" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Systems</SelectItem>
              {bodySystems.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Model grid */}
      <ScrollArea className="flex-1 min-h-0 border rounded-md">
        <div className="min-h-[300px]" data-testid="import-item-list">
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
              Loading models…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground text-sm h-[300px]">
              No models match your filters.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50 sticky top-0">
                <tr>
                  <th className="w-8 p-2" />
                  <th className="w-16 p-2" />
                  <th className="p-2 text-left font-medium">Title</th>
                  <th className="p-2 text-left font-medium">Category</th>
                  <th className="p-2 text-left font-medium">Body System</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((model) => {
                  const isDuplicate = duplicateIds.has(model.id);
                  const isSelected = selectedIds.has(model.id);
                  return (
                    <tr
                      key={model.id}
                      className={`border-b last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${
                        isDuplicate ? "bg-yellow-50 dark:bg-yellow-950/20" : ""
                      }`}
                      onClick={() => onToggleId(model.id)}
                    >
                      <td className="p-2 text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => onToggleId(model.id)}
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`import-checkbox-${model.id}`}
                        />
                      </td>
                      <td className="p-2">
                        {model.thumbnailUrl ? (
                          <img
                            src={model.thumbnailUrl}
                            alt={model.title}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="p-2 max-w-[200px]">
                        <div className="flex items-start gap-1.5">
                          {isDuplicate && (
                            <AlertTriangle
                              className="h-3.5 w-3.5 text-yellow-500 mt-0.5 flex-shrink-0"
                              aria-label="Already linked"
                            />
                          )}
                          <span className="font-medium line-clamp-2">{model.title}</span>
                        </div>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <Badge variant="secondary" className="text-xs">
                          {model.category}
                        </Badge>
                      </td>
                      <td className="p-2 text-muted-foreground whitespace-nowrap">
                        {model.bodySystem ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ImportBrowserDialog({
  open,
  onOpenChange,
  contentType,
  targetQuizId,
  targetCourseId,
  targetModuleId,
  targetLessonId,
  targetDeckId,
  onImportSuccess,
}: ImportBrowserDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [duplicateIds, setDuplicateIds] = useState<Set<string>>(new Set());

  const title = DIALOG_TITLES[contentType];
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "all" ? "" : value,
    }));
  };

  const handleToggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleClose = () => {
    setSearchQuery("");
    setFilters({});
    setSelectedIds(new Set());
    setDuplicateIds(new Set());
    onOpenChange(false);
  };

  const importMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      let url: string;
      let body: Record<string, unknown>;

      if (contentType === "questions") {
        url = `/api/lms/admin/quizzes/${targetQuizId}/import-questions`;
        body = { questionIds: ids };
      } else if (contentType === "flashcard-decks") {
        url = `/api/lms/admin/courses/${targetCourseId}/import-flashcard-decks`;
        body = { deckIds: ids, ...(targetModuleId ? { moduleId: targetModuleId } : {}) };
      } else if (contentType === "flashcards") {
        url = `/api/lms/admin/flashcard-decks/${targetDeckId}/import-flashcards`;
        body = { flashcardIds: ids };
      } else {
        // 3d-models — prefer lesson, fall back to module
        if (targetLessonId) {
          url = `/api/lms/admin/lessons/${targetLessonId}/import-3d-models`;
        } else {
          url = `/api/lms/admin/modules/${targetModuleId}/import-3d-models`;
        }
        body = { modelIds: ids };
      }

      const res = await apiRequest("POST", url, body);
      return res.json() as Promise<{ created: unknown[]; duplicateWarnings: string[] }>;
    },
    onSuccess: (data) => {
      // Show a warning toast for each duplicate
      for (const warning of data.duplicateWarnings ?? []) {
        toast({
          title: "Duplicate warning",
          description: warning,
          variant: "destructive",
        });
      }

      // Invalidate relevant query keys
      if (contentType === "questions" && targetQuizId) {
        queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/quizzes", targetQuizId, "questions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/quizzes", targetQuizId] });
      } else if (contentType === "flashcard-decks") {
        if (targetCourseId) {
          queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/courses", targetCourseId] });
        }
        queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      } else if (contentType === "flashcards" && targetDeckId) {
        queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks", targetDeckId] });
        queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/flashcard-decks"] });
      } else if (contentType === "3d-models") {
        if (targetLessonId) {
          queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/lessons", targetLessonId] });
        }
        if (targetModuleId) {
          queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/modules", targetModuleId] });
        }
      }

      onImportSuccess?.();
      handleClose();
    },
    onError: (error: unknown) => {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "An error occurred during import.",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    importMutation.mutate(Array.from(selectedIds));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col gap-3">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="import-search-input"
          />
        </div>

        {/* Content-type-specific browsing modes */}
        {contentType === "questions" ? (
          <QuestionBrowserContent
            searchQuery={searchQuery}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedIds={selectedIds}
            onToggleId={handleToggleId}
            duplicateIds={duplicateIds}
          />
        ) : contentType === "flashcard-decks" ? (
          <FlashcardDeckBrowserContent
            searchQuery={searchQuery}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedIds={selectedIds}
            onToggleId={handleToggleId}
            duplicateIds={duplicateIds}
          />
        ) : contentType === "flashcards" ? (
          <FlashcardBrowserContent
            searchQuery={searchQuery}
            selectedIds={selectedIds}
            onToggleId={handleToggleId}
          />
        ) : (
          <ModelBrowserContent
            searchQuery={searchQuery}
            filters={filters}
            onFilterChange={handleFilterChange}
            selectedIds={selectedIds}
            onToggleId={handleToggleId}
            duplicateIds={duplicateIds}
          />
        )}

        <DialogFooter className="flex-shrink-0 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? `${selectedIds.size} item${selectedIds.size !== 1 ? "s" : ""} selected`
              : "No items selected"}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={selectedIds.size === 0 || importMutation.isPending}
              data-testid="import-selected-button"
            >
              {importMutation.isPending ? "Importing…" : "Import Selected"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
