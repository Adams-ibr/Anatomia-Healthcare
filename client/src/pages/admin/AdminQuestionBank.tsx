import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, HelpCircle, Tag, Filter, Search, Upload } from "lucide-react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { BulkUploadDialog } from "@/components/admin/BulkUploadDialog";
import type { QuestionTopic, QuestionBankItem } from "@shared/schema";

interface QuestionOption {
  optionText: string;
  isCorrect: boolean;
  explanation?: string;
}

interface QuestionBankItemWithOptions extends QuestionBankItem {
  options?: QuestionOption[];
}

const QUESTION_CSV_TEMPLATE = `question,questionType,difficulty,points,option1,option1Correct,option2,option2Correct,option3,option3Correct,option4,option4Correct,explanation
"What is the largest bone in the human body?",multiple_choice,easy,1,"Femur",true,"Tibia",false,"Humerus",false,"Pelvis",false,"The femur is the longest and strongest bone."
"The heart has four chambers",true_false,easy,1,"True",true,"False",false,"","","","","The heart has two atria and two ventricles."`;

const QUESTION_JSON_TEMPLATE = [
  {
    question: "What is the largest bone in the human body?",
    questionType: "multiple_choice",
    difficulty: "easy",
    points: 1,
    explanation: "The femur is the longest and strongest bone.",
    options: [
      { optionText: "Femur", isCorrect: true },
      { optionText: "Tibia", isCorrect: false },
      { optionText: "Humerus", isCorrect: false },
      { optionText: "Pelvis", isCorrect: false },
    ],
  },
];

const questionFormSchema = z.object({
  question: z.string().min(1, "Question text is required"),
  questionType: z.string().default("multiple_choice"),
  topicId: z.string().optional(),
  difficulty: z.string().default("medium"),
  points: z.coerce.number().min(1).default(1),
  explanation: z.string().optional(),
});

const topicFormSchema = z.object({
  name: z.string().min(1, "Topic name is required"),
  description: z.string().optional(),
  order: z.coerce.number().default(0),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;
type TopicFormValues = z.infer<typeof topicFormSchema>;

export default function AdminQuestionBank() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("questions");
  const [questionDialogOpen, setQuestionDialogOpen] = useState(false);
  const [topicDialogOpen, setTopicDialogOpen] = useState(false);
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<QuestionBankItemWithOptions | null>(null);
  const [editingTopic, setEditingTopic] = useState<QuestionTopic | null>(null);
  const [filterTopic, setFilterTopic] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [questionOptions, setQuestionOptions] = useState<QuestionOption[]>([
    { optionText: "", isCorrect: true, explanation: "" },
    { optionText: "", isCorrect: false, explanation: "" },
    { optionText: "", isCorrect: false, explanation: "" },
    { optionText: "", isCorrect: false, explanation: "" },
  ]);

  const questionForm = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      question: "",
      questionType: "multiple_choice",
      topicId: "",
      difficulty: "medium",
      points: 1,
      explanation: "",
    },
  });

  const topicForm = useForm<TopicFormValues>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      name: "",
      description: "",
      order: 0,
    },
  });

  const { data: questions = [], isLoading: questionsLoading } = useQuery<QuestionBankItemWithOptions[]>({
    queryKey: ["/api/lms/admin/question-bank"],
    select: (data) => {
      return Array.isArray(data) ? data : [];
    },
  });

  const { data: topics = [], isLoading: topicsLoading } = useQuery<QuestionTopic[]>({
    queryKey: ["/api/lms/admin/question-topics"],
    select: (data) => {
      return Array.isArray(data) ? data : [];
    },
  });

  const createQuestionMutation = useMutation({
    mutationFn: async (data: QuestionFormValues) => {
      const payload = {
        ...data,
        topicId: data.topicId || null,
        explanation: data.explanation || null,
        options: questionOptions.filter(o => o.optionText.trim()),
      };
      const response = await apiRequest("POST", "/api/lms/admin/question-bank", payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-bank"] });
      toast({ title: "Question created successfully" });
      handleCloseQuestionDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create question", description: error.message, variant: "destructive" });
    },
  });

  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: QuestionFormValues }) => {
      const payload = {
        ...data,
        topicId: data.topicId || null,
        explanation: data.explanation || null,
        options: questionOptions.filter(o => o.optionText.trim()),
      };
      const response = await apiRequest("PUT", `/api/lms/admin/question-bank/${id}`, payload);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-bank"] });
      toast({ title: "Question updated successfully" });
      handleCloseQuestionDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update question", description: error.message, variant: "destructive" });
    },
  });

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/question-bank/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-bank"] });
      toast({ title: "Question deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete question", description: error.message, variant: "destructive" });
    },
  });

  const createTopicMutation = useMutation({
    mutationFn: async (data: TopicFormValues) => {
      const response = await apiRequest("POST", "/api/lms/admin/question-topics", {
        ...data,
        description: data.description || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-topics"] });
      toast({ title: "Topic created successfully" });
      handleCloseTopicDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create topic", description: error.message, variant: "destructive" });
    },
  });

  const updateTopicMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: TopicFormValues }) => {
      const response = await apiRequest("PUT", `/api/lms/admin/question-topics/${id}`, {
        ...data,
        description: data.description || null,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-topics"] });
      toast({ title: "Topic updated successfully" });
      handleCloseTopicDialog();
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update topic", description: error.message, variant: "destructive" });
    },
  });

  const deleteTopicMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/lms/admin/question-topics/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-topics"] });
      toast({ title: "Topic deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete topic", description: error.message, variant: "destructive" });
    },
  });

  const handleCloseQuestionDialog = () => {
    setQuestionDialogOpen(false);
    setEditingQuestion(null);
    questionForm.reset({
      question: "",
      questionType: "multiple_choice",
      topicId: "",
      difficulty: "medium",
      points: 1,
      explanation: "",
    });
    setQuestionOptions([
      { optionText: "", isCorrect: true, explanation: "" },
      { optionText: "", isCorrect: false, explanation: "" },
      { optionText: "", isCorrect: false, explanation: "" },
      { optionText: "", isCorrect: false, explanation: "" },
    ]);
  };

  const handleCloseTopicDialog = () => {
    setTopicDialogOpen(false);
    setEditingTopic(null);
    topicForm.reset({
      name: "",
      description: "",
      order: 0,
    });
  };

  const handleOpenQuestionDialog = (question?: QuestionBankItemWithOptions) => {
    if (question) {
      setEditingQuestion(question);
      questionForm.reset({
        question: question.question,
        questionType: question.questionType || "multiple_choice",
        topicId: question.topicId || "",
        difficulty: question.difficulty || "medium",
        points: question.points || 1,
        explanation: question.explanation || "",
      });
      if (question.options && question.options.length > 0) {
        const opts = question.options.map(o => ({
          optionText: o.optionText,
          isCorrect: o.isCorrect,
          explanation: o.explanation || "",
        }));
        while (opts.length < 4) {
          opts.push({ optionText: "", isCorrect: false, explanation: "" });
        }
        setQuestionOptions(opts);
      } else if (question.questionType === "true_false") {
        setQuestionOptions([
          { optionText: "True", isCorrect: true, explanation: "" },
          { optionText: "False", isCorrect: false, explanation: "" },
        ]);
      }
    } else {
      setEditingQuestion(null);
      questionForm.reset({
        question: "",
        questionType: "multiple_choice",
        topicId: "",
        difficulty: "medium",
        points: 1,
        explanation: "",
      });
      setQuestionOptions([
        { optionText: "", isCorrect: true, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
      ]);
    }
    setQuestionDialogOpen(true);
  };

  const handleOpenTopicDialog = (topic?: QuestionTopic) => {
    if (topic) {
      setEditingTopic(topic);
      topicForm.reset({
        name: topic.name,
        description: topic.description || "",
        order: topic.order || 0,
      });
    } else {
      setEditingTopic(null);
      topicForm.reset({
        name: "",
        description: "",
        order: 0,
      });
    }
    setTopicDialogOpen(true);
  };

  const onQuestionSubmit = (data: QuestionFormValues) => {
    if (editingQuestion) {
      updateQuestionMutation.mutate({ id: editingQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const onTopicSubmit = (data: TopicFormValues) => {
    if (editingTopic) {
      updateTopicMutation.mutate({ id: editingTopic.id, data });
    } else {
      createTopicMutation.mutate(data);
    }
  };

  const watchQuestionType = questionForm.watch("questionType");

  const handleQuestionTypeChange = (value: string) => {
    questionForm.setValue("questionType", value);
    if (value === "true_false") {
      setQuestionOptions([
        { optionText: "True", isCorrect: true, explanation: "" },
        { optionText: "False", isCorrect: false, explanation: "" },
      ]);
    } else {
      setQuestionOptions([
        { optionText: "", isCorrect: true, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
        { optionText: "", isCorrect: false, explanation: "" },
      ]);
    }
  };

  const filteredQuestions = questions.filter((q) => {
    if (filterTopic !== "all" && q.topicId !== filterTopic) return false;
    if (filterDifficulty !== "all" && q.difficulty !== filterDifficulty) return false;
    if (searchQuery && !q.question.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case "easy": return "secondary";
      case "medium": return "default";
      case "hard": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <AdminLayout title="Question Bank">
      <div className="space-y-6">
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setBulkUploadOpen(true)}
                    data-testid="button-bulk-upload"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Bulk Upload
                  </Button>
                  <Button onClick={() => handleOpenQuestionDialog()} data-testid="button-add-question">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Question
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search questions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      data-testid="input-search"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-muted-foreground" />
                    <Select value={filterTopic} onValueChange={setFilterTopic}>
                      <SelectTrigger className="w-[150px]" data-testid="select-filter-topic">
                        <SelectValue placeholder="All Topics" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Topics</SelectItem>
                        {topics.map((topic) => (
                          <SelectItem key={topic.id} value={topic.id}>
                            {topic.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                      <SelectTrigger className="w-[120px]" data-testid="select-filter-difficulty">
                        <SelectValue placeholder="All Levels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
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
                    <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No questions found</p>
                    <p className="text-sm">Add your first question to get started</p>
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
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuestions.map((question) => (
                        <TableRow key={question.id} data-testid={`row-question-${question.id}`}>
                          <TableCell className="max-w-xs truncate">{question.question}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {question.questionType === "true_false" ? "True/False" : "Multiple Choice"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {topics.find((t) => t.id === question.topicId)?.name || "-"}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getDifficultyBadgeVariant(question.difficulty || "medium")}>
                              {question.difficulty || "medium"}
                            </Badge>
                          </TableCell>
                          <TableCell>{question.points || 1}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenQuestionDialog(question)}
                                data-testid={`button-edit-${question.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Delete this question?")) {
                                    deleteQuestionMutation.mutate(question.id);
                                  }
                                }}
                                data-testid={`button-delete-${question.id}`}
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
                <Button onClick={() => handleOpenTopicDialog()} data-testid="button-add-topic">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Topic
                </Button>
              </CardHeader>
              <CardContent>
                {topicsLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading topics...</div>
                ) : topics.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No topics yet</p>
                    <p className="text-sm">Create topics to organize your questions</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Order</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topics.map((topic) => (
                        <TableRow key={topic.id} data-testid={`row-topic-${topic.id}`}>
                          <TableCell className="font-medium">{topic.name}</TableCell>
                          <TableCell className="max-w-xs truncate">{topic.description || "-"}</TableCell>
                          <TableCell>{topic.order || 0}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenTopicDialog(topic)}
                                data-testid={`button-edit-topic-${topic.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => {
                                  if (confirm("Delete this topic?")) {
                                    deleteTopicMutation.mutate(topic.id);
                                  }
                                }}
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

        <Dialog open={questionDialogOpen} onOpenChange={(open) => !open && handleCloseQuestionDialog()}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingQuestion ? "Edit Question" : "Add New Question"}</DialogTitle>
              <DialogDescription>Create a question for the question bank</DialogDescription>
            </DialogHeader>
            <Form {...questionForm}>
              <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
                <FormField
                  control={questionForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Text</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder="Enter your question here..." data-testid="input-question" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={questionForm.control}
                    name="questionType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Question Type</FormLabel>
                        <Select value={field.value} onValueChange={handleQuestionTypeChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-question-type">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                            <SelectItem value="true_false">True/False</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={questionForm.control}
                    name="difficulty"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Difficulty</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger data-testid="select-difficulty">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="easy">Easy</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="hard">Hard</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={questionForm.control}
                    name="topicId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select value={field.value || "none"} onValueChange={(v) => field.onChange(v === "none" ? "" : v)}>
                          <FormControl>
                            <SelectTrigger data-testid="select-topic">
                              <SelectValue placeholder="No Topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No Topic</SelectItem>
                            {topics.map((topic) => (
                              <SelectItem key={topic.id} value={topic.id}>
                                {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={questionForm.control}
                    name="points"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Points</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} data-testid="input-points" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <FormLabel>Answer Options</FormLabel>
                  <RadioGroup
                    value={questionOptions.findIndex(o => o.isCorrect).toString()}
                    onValueChange={(val) => {
                      const newOptions = questionOptions.map((o, i) => ({
                        ...o,
                        isCorrect: i === parseInt(val),
                      }));
                      setQuestionOptions(newOptions);
                    }}
                  >
                    {questionOptions.map((option, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 border rounded-md">
                        <RadioGroupItem value={index.toString()} id={`option-${index}`} className="mt-1" />
                        <div className="flex-1 space-y-2">
                          <Input
                            value={option.optionText}
                            onChange={(e) => {
                              const newOptions = [...questionOptions];
                              newOptions[index].optionText = e.target.value;
                              setQuestionOptions(newOptions);
                            }}
                            placeholder={watchQuestionType === "true_false" ? (index === 0 ? "True" : "False") : `Option ${index + 1}`}
                            disabled={watchQuestionType === "true_false"}
                            data-testid={`input-option-${index}`}
                          />
                          <Input
                            value={option.explanation || ""}
                            onChange={(e) => {
                              const newOptions = [...questionOptions];
                              newOptions[index].explanation = e.target.value;
                              setQuestionOptions(newOptions);
                            }}
                            placeholder="Explanation (optional)"
                            className="text-sm"
                            data-testid={`input-option-explanation-${index}`}
                          />
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                  {watchQuestionType === "multiple_choice" && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQuestionOptions([...questionOptions, { optionText: "", isCorrect: false, explanation: "" }]);
                      }}
                      data-testid="button-add-option"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Option
                    </Button>
                  )}
                </div>

                <FormField
                  control={questionForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>General Explanation (Optional)</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={2} placeholder="Provide an explanation for the correct answer..." data-testid="input-explanation" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseQuestionDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createQuestionMutation.isPending || updateQuestionMutation.isPending}
                    data-testid="button-save-question"
                  >
                    {createQuestionMutation.isPending || updateQuestionMutation.isPending 
                      ? "Saving..." 
                      : (editingQuestion ? "Update Question" : "Create Question")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={topicDialogOpen} onOpenChange={(open) => !open && handleCloseTopicDialog()}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTopic ? "Edit Topic" : "Add New Topic"}</DialogTitle>
            </DialogHeader>
            <Form {...topicForm}>
              <form onSubmit={topicForm.handleSubmit(onTopicSubmit)} className="space-y-4">
                <FormField
                  control={topicForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Topic Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Cardiovascular System" data-testid="input-topic-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={topicForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={3} placeholder="Brief description of the topic..." data-testid="input-topic-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={topicForm.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-topic-order" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={handleCloseTopicDialog}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createTopicMutation.isPending || updateTopicMutation.isPending}
                    data-testid="button-save-topic"
                  >
                    {createTopicMutation.isPending || updateTopicMutation.isPending 
                      ? "Saving..." 
                      : (editingTopic ? "Update Topic" : "Create Topic")}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <BulkUploadDialog
          open={bulkUploadOpen}
          onOpenChange={setBulkUploadOpen}
          title="Bulk Upload Questions"
          description="Upload multiple questions at once using CSV or JSON format. Download the template for the correct format."
          csvTemplate={QUESTION_CSV_TEMPLATE}
          jsonTemplate={QUESTION_JSON_TEMPLATE}
          templateFileName="question_bank_template"
          onUpload={async (data) => {
            const items = data.map((row: any) => {
              if (row.options) {
                return row;
              }
              const options = [];
              for (let i = 1; i <= 4; i++) {
                const text = row[`option${i}`];
                if (text) {
                  options.push({
                    optionText: text,
                    isCorrect: row[`option${i}Correct`] === true || row[`option${i}Correct`] === "true",
                  });
                }
              }
              return {
                question: row.question,
                questionType: row.questionType || "multiple_choice",
                difficulty: row.difficulty || "medium",
                points: row.points || 1,
                explanation: row.explanation || "",
                options,
              };
            });
            
            const response = await apiRequest("POST", "/api/lms/admin/question-bank/bulk-import", { items });
            const result = await response.json();
            
            if (result.failed > 0) {
              toast({
                title: `Imported ${result.imported} questions with ${result.failed} errors`,
                variant: "destructive",
              });
            } else {
              toast({ title: `Successfully imported ${result.imported} questions` });
            }
            
            queryClient.invalidateQueries({ queryKey: ["/api/lms/admin/question-bank"] });
          }}
        />
      </div>
    </AdminLayout>
  );
}
