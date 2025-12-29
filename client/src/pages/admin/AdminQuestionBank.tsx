import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Plus, Edit, Trash2, HelpCircle, Tag, Filter, Search } from "lucide-react";
import type { QuestionTopic, QuestionBankItem } from "@shared/schema";

interface QuestionBankItemWithOptions extends QuestionBankItem {
  options?: Array<{
    id: string;
    optionText: string;
    isCorrect: boolean;
    explanation: string | null;
    order: number;
  }>;
}

export default function AdminQuestionBank() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItemWithOptions | null>(null);
  const [editingTopic, setEditingTopic] = useState<QuestionTopic | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const [questionForm, setQuestionForm] = useState({
    question: "",
    questionType: "multiple_choice" as string,
    topicId: "",
    difficulty: "medium" as string,
    explanation: "",
    points: 1,
    tags: [] as string[],
    options: [
      { optionText: "", isCorrect: false, explanation: "" },
      { optionText: "", isCorrect: false, explanation: "" },
      { optionText: "", isCorrect: false, explanation: "" },
      { optionText: "", isCorrect: false, explanation: "" },
    ],
  });

  const [topicForm, setTopicForm] = useState({
    name: "",
    description: "",
    parentId: null as string | null,
    order: 0,
  });

  const { data: topics = [] } = useQuery<QuestionTopic[]>({
    queryKey: ["/api/lms/admin/question-topics"],
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<QuestionBankItem[]>({
    queryKey: ["/api/lms/admin/question-bank", filterTopic, filterDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterTopic) params.append("topicId", filterTopic);
      if (filterDifficulty) params.append("difficulty", filterDifficulty);
      const res = await fetch(`/api/lms/admin/question-bank?${params}`);
      return res.json();
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/lms/admin/question-bank", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-bank"] });
      setQuestionDialogOpen(false);
      resetQuestionForm();
      toast({ title: "Question created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create question", variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/lms/admin/question-bank/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-bank"] });
      setQuestionDialogOpen(false);
      setEditingQuestion(null);
      resetQuestionForm();
      toast({ title: "Question updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update question", variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/lms/admin/question-bank/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-bank"] });
      toast({ title: "Question deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete question", variant: "destructive" });
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/lms/admin/question-topics", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-topics"] });
      setTopicDialogOpen(false);
      resetTopicForm();
      toast({ title: "Topic created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create topic", variant: "destructive" });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiRequest(`/api/lms/admin/question-topics/${id}`, "PUT", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-topics"] });
      setTopicDialogOpen(false);
      setEditingTopic(null);
      resetTopicForm();
      toast({ title: "Topic updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update topic", variant: "destructive" });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/lms/admin/question-topics/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-topics"] });
      toast({ title: "Topic deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete topic", variant: "destructive" });
    },
  });

  const resetQuestionForm = () => {
    setQuestionForm({
      question: "",
      questionType: "multiple_choice",
      topicId: "",
      difficulty: "medium",
      explanation: "",
      points: 1,
      tags: [],
      options: [
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
      ],
    });
  };

  const resetTopicForm = () => {
    setTopicForm({
      name: "",
      description: "",
      parentId: null,
      order: 0,
    });
  };

  const handleEditQuestion = async (questionItem: QuestionBankItem) => {
    const res = await fetch(`/api/lms/admin/question-bank/${questionItem.id}`);
    const fullQuestion: QuestionBankItemWithOptions = await res.json();
    
    setEditingQuestion(fullQuestion);
    setQuestionForm({
      question: fullQuestion.question,
      questionType: fullQuestion.questionType,
      topicId: fullQuestion.topicId || "",
      difficulty: fullQuestion.difficulty || "medium",
      explanation: fullQuestion.explanation || "",
      points: fullQuestion.points || 1,
      tags: fullQuestion.tags || [],
      options: fullQuestion.options?.map((o) => ({
        optionText: o.optionText,
        isCorrect: o.isCorrect,
        explanation: o.explanation || "",
      })) || [
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
      ],
    });
    setQuestionDialogOpen(true);
  };

  const handleEditTopic = (topic: QuestionTopic) => {
    setEditingTopic(topic);
    setTopicForm({
      name: topic.name,
      description: topic.description || "",
      parentId: topic.parentId,
      order: topic.order || 0,
    });
    setTopicDialogOpen(true);
  };

  const handleSaveQuestion = () => {
    const data = {
      ...questionForm,
      topicId: questionForm.topicId || null,
      options: questionForm.options.filter((o) => o.optionText.trim()),
    };

    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleSaveTopic = () => {
    if (editingTopic) {
      updateTopicMutation.mutate({ id: editingTopic.id, data: topicForm });
    } else {
      createTopicMutation.mutate(topicForm);
    }
  };

  const addOption = () => {
    setQuestionForm((prev) => ({
      ...prev,
      options: [...prev.options, { optionText: "", isCorrect: false, explanation: "" }],
    }));
  };

  const removeOption = (index: number) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const updateOption = (index: number, field: string, value: any) => {
    setQuestionForm((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) =>
        i === index ? { ...opt, [field]: value } : opt
      ),
    }));
  };

  const filteredQuestions = questions.filter((q) =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case "multiple_choice":
        return "Multiple Choice";
      case "true_false":
        return "True/False";
      case "short_answer":
        return "Short Answer";
      default:
        return type;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold" data-testid="text-page-title">Question Bank</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="questions" data-testid="tab-questions">
            <HelpCircle className="w-4 h-4 mr-2" />
            Questions
          </TabsTrigger>
          <TabsTrigger value="topics" data-testid="tab-topics">
            <Tag className="w-4 h-4 mr-2" />
            Topics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>All Questions</CardTitle>
              <Button
                onClick={() => {
                  setEditingQuestion(null);
                  resetQuestionForm();
                  setQuestionDialogOpen(true);
                }}
                data-testid="button-add-question"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search questions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-questions"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <Select value={filterTopic} onValueChange={setFilterTopic}>
                    <SelectTrigger className="w-[180px]" data-testid="select-filter-topic">
                      <SelectValue placeholder="All Topics" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Topics</SelectItem>
                      {topics.map((topic) => (
                        <SelectItem key={topic.id} value={topic.id}>
                          {topic.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="w-[150px]" data-testid="select-filter-difficulty">
                      <SelectValue placeholder="All Levels" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Levels</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {questionsLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading questions...</div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions found. Create your first question to get started.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Question</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.map((question) => (
                      <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                        <TableCell className="max-w-[300px]">
                          <span className="line-clamp-2">{question.question}</span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="no-default-active-elevate">
                            {getQuestionTypeLabel(question.questionType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {topics.find((t) => t.id === question.topicId)?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <Badge className={`no-default-active-elevate ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty || "Not set"}
                          </Badge>
                        </TableCell>
                        <TableCell>{question.points || 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditQuestion(question)}
                              data-testid={`button-edit-question-${question.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteQuestionMutation.mutate(question.id)}
                              data-testid={`button-delete-question-${question.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <CardTitle>Question Topics</CardTitle>
              <Button
                onClick={() => {
                  setEditingTopic(null);
                  resetTopicForm();
                  setTopicDialogOpen(true);
                }}
                data-testid="button-add-topic"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Topic
              </Button>
            </CardHeader>
            <CardContent>
              {topics.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No topics found. Create your first topic to categorize questions.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topics.map((topic) => (
                      <TableRow key={topic.id} data-testid={`row-topic-${topic.id}`}>
                        <TableCell className="font-medium">{topic.name}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[300px]">
                          <span className="line-clamp-2">{topic.description || "-"}</span>
                        </TableCell>
                        <TableCell>{topic.order}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEditTopic(topic)}
                              data-testid={`button-edit-topic-${topic.id}`}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => deleteTopicMutation.mutate(topic.id)}
                              data-testid={`button-delete-topic-${topic.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={questionDialogOpen} onOpenChange={setQuestionDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? "Edit Question" : "Add New Question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Question Text</Label>
              <Textarea
                value={questionForm.question}
                onChange={(e) =>
                  setQuestionForm((prev) => ({ ...prev, question: e.target.value }))
                }
                placeholder="Enter the question text..."
                rows={3}
                data-testid="input-question-text"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Question Type</Label>
                <Select
                  value={questionForm.questionType}
                  onValueChange={(value) =>
                    setQuestionForm((prev) => ({ ...prev, questionType: value }))
                  }
                >
                  <SelectTrigger data-testid="select-question-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                    <SelectItem value="true_false">True/False</SelectItem>
                    <SelectItem value="short_answer">Short Answer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={questionForm.difficulty}
                  onValueChange={(value) =>
                    setQuestionForm((prev) => ({ ...prev, difficulty: value }))
                  }
                >
                  <SelectTrigger data-testid="select-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Topic</Label>
                <Select
                  value={questionForm.topicId}
                  onValueChange={(value) =>
                    setQuestionForm((prev) => ({ ...prev, topicId: value }))
                  }
                >
                  <SelectTrigger data-testid="select-topic">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Topic</SelectItem>
                    {topics.map((topic) => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  min={1}
                  value={questionForm.points}
                  onChange={(e) =>
                    setQuestionForm((prev) => ({
                      ...prev,
                      points: parseInt(e.target.value) || 1,
                    }))
                  }
                  data-testid="input-points"
                />
              </div>
            </div>

            {questionForm.questionType !== "short_answer" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Answer Options</Label>
                  <Button size="sm" variant="outline" onClick={addOption}>
                    <Plus className="w-3 h-3 mr-1" />
                    Add Option
                  </Button>
                </div>
                {questionForm.options.map((option, index) => (
                  <div key={index} className="flex items-start gap-2 p-3 border rounded-md">
                    <input
                      type={questionForm.questionType === "true_false" ? "radio" : "checkbox"}
                      name="correctOption"
                      checked={option.isCorrect}
                      onChange={(e) => {
                        if (questionForm.questionType === "true_false") {
                          setQuestionForm((prev) => ({
                            ...prev,
                            options: prev.options.map((opt, i) => ({
                              ...opt,
                              isCorrect: i === index,
                            })),
                          }));
                        } else {
                          updateOption(index, "isCorrect", e.target.checked);
                        }
                      }}
                      className="mt-3"
                      data-testid={`checkbox-option-correct-${index}`}
                    />
                    <div className="flex-1 space-y-2">
                      <Input
                        value={option.optionText}
                        onChange={(e) => updateOption(index, "optionText", e.target.value)}
                        placeholder={`Option ${index + 1}`}
                        data-testid={`input-option-text-${index}`}
                      />
                      <Input
                        value={option.explanation}
                        onChange={(e) => updateOption(index, "explanation", e.target.value)}
                        placeholder="Explanation (optional)"
                        className="text-sm"
                        data-testid={`input-option-explanation-${index}`}
                      />
                    </div>
                    {questionForm.options.length > 2 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeOption(index)}
                        data-testid={`button-remove-option-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div>
              <Label>General Explanation (optional)</Label>
              <Textarea
                value={questionForm.explanation}
                onChange={(e) =>
                  setQuestionForm((prev) => ({ ...prev, explanation: e.target.value }))
                }
                placeholder="Provide an explanation for the correct answer..."
                rows={2}
                data-testid="input-explanation"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveQuestion}
              disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
              data-testid="button-save-question"
            >
              {editingQuestion ? "Update Question" : "Create Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={topicDialogOpen} onOpenChange={setTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Topic Name</Label>
              <Input
                value={topicForm.name}
                onChange={(e) => setTopicForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Cardiovascular System"
                data-testid="input-topic-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={topicForm.description}
                onChange={(e) =>
                  setTopicForm((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Brief description of the topic..."
                rows={3}
                data-testid="input-topic-description"
              />
            </div>
            <div>
              <Label>Display Order</Label>
              <Input
                type="number"
                value={topicForm.order}
                onChange={(e) =>
                  setTopicForm((prev) => ({ ...prev, order: parseInt(e.target.value) || 0 }))
                }
                data-testid="input-topic-order"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTopicDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveTopic}
              disabled={createTopicMutation.isPending || updateTopicMutation.isPending}
              data-testid="button-save-topic"
            >
              {editingTopic ? "Update Topic" : "Create Topic"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
