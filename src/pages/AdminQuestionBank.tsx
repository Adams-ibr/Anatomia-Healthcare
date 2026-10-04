import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CheckCircle, ChevronLeft, ChevronRight, Download, FileText, Filter,
  HelpCircle, Loader2, MoreVertical, PencilLine, Plus, Search,
  Tag, Trash2, Upload, X, Eye, Copy
} from 'lucide-react'
import { useApp } from '../lib/store'
import { Badge, Button, EmptyState, Modal, Tabs } from '../components/ui'
import { cn, formatDate } from '../lib/utils'

type QuestionType = 'multiple-choice' | 'true-false'
type DifficultyLevel = 'easy' | 'medium' | 'hard'

interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

interface Question {
  id: string
  type: QuestionType
  question: string
  explanation: string
  difficulty: DifficultyLevel
  topicIds: string[]
  topics: string[]
  options: QuestionOption[]
  correctAnswer?: boolean // for true/false
  points: number
  isActive: boolean
  timesUsed: number
  createdAt: string
  updatedAt: string
}

interface Topic {
  id: string
  name: string
  description: string
  category: string
  questionCount: number
  createdAt: string
  updatedAt: string
}

export default function AdminQuestionBank() {
  const { toast } = useApp()
  const { t } = useTranslation()

  const [activeTab, setActiveTab] = useState<'questions' | 'topics'>('questions')

  // Questions state
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsTotal, setQuestionsTotal] = useState(0)
  const [questionsPage, setQuestionsPage] = useState(1)
  const questionsPerPage = 10

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicsTotal, setTopicsTotal] = useState(0)
  const [topicsPage, setTopicsPage] = useState(1)
  const topicsPerPage = 15

  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | QuestionType>('all')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | DifficultyLevel>('all')
  const [topicFilter, setTopicFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  // Modals
  const [creatingQuestion, setCreatingQuestion] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null)
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null)

  const [creatingTopic, setCreatingTopic] = useState(false)
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null)
  const [deletingTopic, setDeletingTopic] = useState<Topic | null>(null)

  const [bulkImportOpen, setBulkImportOpen] = useState(false)

  // Mock data
  useEffect(() => {
    setLoading(true)
    setTimeout(() => {
      const mockTopics: Topic[] = [
        {
          id: 't1',
          name: 'Heart Anatomy',
          description: 'Questions about heart structure and chambers',
          category: 'Cardiovascular System',
          questionCount: 15,
          createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 't2',
          name: 'Blood Circulation',
          description: 'Pulmonary and systemic circulation',
          category: 'Cardiovascular System',
          questionCount: 12,
          createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 't3',
          name: 'Bone Structure',
          description: 'Types and classification of bones',
          category: 'Skeletal System',
          questionCount: 20,
          createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      const mockQuestions: Question[] = [
        {
          id: 'q1',
          type: 'multiple-choice',
          question: 'How many chambers does the human heart have?',
          explanation: 'The human heart has four chambers: two atria (upper chambers) and two ventricles (lower chambers). The right side receives deoxygenated blood while the left side pumps oxygenated blood.',
          difficulty: 'easy',
          topicIds: ['t1'],
          topics: ['Heart Anatomy'],
          options: [
            { id: 'o1', text: 'Two', isCorrect: false },
            { id: 'o2', text: 'Three', isCorrect: false },
            { id: 'o3', text: 'Four', isCorrect: true },
            { id: 'o4', text: 'Five', isCorrect: false }
          ],
          points: 1,
          isActive: true,
          timesUsed: 45,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'q2',
          type: 'true-false',
          question: 'The left ventricle pumps blood to the lungs.',
          explanation: 'FALSE. The left ventricle pumps oxygenated blood to the body through the aorta. The right ventricle pumps deoxygenated blood to the lungs through the pulmonary artery.',
          difficulty: 'medium',
          topicIds: ['t1', 't2'],
          topics: ['Heart Anatomy', 'Blood Circulation'],
          options: [],
          correctAnswer: false,
          points: 1,
          isActive: true,
          timesUsed: 32,
          createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'q3',
          type: 'multiple-choice',
          question: 'Which valve separates the left atrium from the left ventricle?',
          explanation: 'The mitral valve (also called the bicuspid valve) separates the left atrium from the left ventricle and prevents backflow of blood.',
          difficulty: 'hard',
          topicIds: ['t1'],
          topics: ['Heart Anatomy'],
          options: [
            { id: 'o5', text: 'Tricuspid valve', isCorrect: false },
            { id: 'o6', text: 'Mitral valve', isCorrect: true },
            { id: 'o7', text: 'Aortic valve', isCorrect: false },
            { id: 'o8', text: 'Pulmonary valve', isCorrect: false }
          ],
          points: 2,
          isActive: true,
          timesUsed: 18,
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]

      // Apply filters for questions
      let filteredQuestions = mockQuestions
      if (search) {
        filteredQuestions = filteredQuestions.filter(q =>
          q.question.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (typeFilter !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.type === typeFilter)
      }
      if (difficultyFilter !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.difficulty === difficultyFilter)
      }
      if (topicFilter !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => q.topicIds.includes(topicFilter))
      }

      // Apply filters for topics
      let filteredTopics = mockTopics
      if (search && activeTab === 'topics') {
        filteredTopics = filteredTopics.filter(t =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.description.toLowerCase().includes(search.toLowerCase())
        )
      }
      if (categoryFilter !== 'all') {
        filteredTopics = filteredTopics.filter(t => t.category === categoryFilter)
      }

      setQuestions(filteredQuestions)
      setQuestionsTotal(filteredQuestions.length)
      setTopics(filteredTopics)
      setTopicsTotal(filteredTopics.length)
      setLoading(false)
    }, 500)
  }, [search, typeFilter, difficultyFilter, topicFilter, categoryFilter, activeTab])

  const questionsTotalPages = Math.max(1, Math.ceil(questionsTotal / questionsPerPage))
  const topicsTotalPages = Math.max(1, Math.ceil(topicsTotal / topicsPerPage))

  const categories = Array.from(new Set(topics.map(t => t.category)))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Question Bank</h1>
          <p className="mt-1 text-sm text-muted">
            Manage quiz questions and organize them by topics
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
            <Upload className="h-4 w-4" />
            Bulk Import
          </Button>
          <Button onClick={() => activeTab === 'questions' ? setCreatingQuestion(true) : setCreatingTopic(true)}>
            <Plus className="h-4 w-4" />
            {activeTab === 'questions' ? 'Add Question' : 'Add Topic'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-brand-50 p-2 text-brand-700">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{questions.length}</p>
              <p className="text-xs text-muted">Total Questions</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-success/10 p-2 text-success">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{questions.filter(q => q.isActive).length}</p>
              <p className="text-xs text-muted">Active</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-warning/10 p-2 text-warning">
              <Tag className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{topics.length}</p>
              <p className="text-xs text-muted">Topics</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-card bg-danger/10 p-2 text-danger">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{categories.length}</p>
              <p className="text-xs text-muted">Categories</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'questions', label: `Questions (${questions.length})` },
          { id: 'topics', label: `Topics (${topics.length})` }
        ]}
        active={activeTab}
        onChange={(id) => setActiveTab(id as any)}
      />

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="relative sm:col-span-2">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search questions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base pl-9"
                />
              </div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="input-base"
              >
                <option value="all">All Types</option>
                <option value="multiple-choice">Multiple Choice</option>
                <option value="true-false">True/False</option>
              </select>
              <select
                value={difficultyFilter}
                onChange={(e) => setDifficultyFilter(e.target.value as any)}
                className="input-base"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div className="mt-3">
              <select
                value={topicFilter}
                onChange={(e) => setTopicFilter(e.target.value)}
                className="input-base"
              >
                <option value="all">All Topics</option>
                {topics.map(topic => (
                  <option key={topic.id} value={topic.id}>{topic.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Questions List */}
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="card animate-pulse p-6">
                  <div className="h-4 w-2/3 rounded bg-line" />
                  <div className="mt-2 h-3 w-1/3 rounded bg-line" />
                </div>
              ))}
            </div>
          ) : questions.length === 0 ? (
            <EmptyState
              icon={<HelpCircle className="h-12 w-12" />}
              title="No questions found"
              message="Create your first question or import questions in bulk"
              action={
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setBulkImportOpen(true)}>
                    <Upload className="h-4 w-4" />
                    Bulk Import
                  </Button>
                  <Button onClick={() => setCreatingQuestion(true)}>
                    <Plus className="h-4 w-4" />
                    Add Question
                  </Button>
                </div>
              }
            />
          ) : (
            <>
              <div className="space-y-3">
                {questions.map((question) => (
                  <div
                    key={question.id}
                    className="card group p-5 transition-all hover:border-brand-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge color={
                            question.type === 'multiple-choice' ? 'brand' : 'warning'
                          }>
                            {question.type === 'multiple-choice' ? 'Multiple Choice' : 'True/False'}
                          </Badge>
                          <Badge color={
                            question.difficulty === 'easy' ? 'success' :
                            question.difficulty === 'medium' ? 'warning' : 'danger'
                          }>
                            {question.difficulty}
                          </Badge>
                          <Badge color={question.isActive ? 'success' : 'line'}>
                            {question.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="font-medium text-ink">{question.question}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {question.topics.map((topic, idx) => (
                            <Badge key={idx}>
                              <Tag className="h-3 w-3" />
                              {topic}
                            </Badge>
                          ))}
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-xs text-muted">
                          <span>{question.points} point{question.points !== 1 ? 's' : ''}</span>
                          <span>Used {question.timesUsed} times</span>
                          <span>Updated {formatDate(question.updatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setViewingQuestion(question)}
                          className="rounded-card p-2 text-ink hover:bg-line/40"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            // Duplicate question
                            toast('Success', 'Question duplicated')
                          }}
                          className="rounded-card p-2 text-ink hover:bg-line/40"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingQuestion(question)}
                          className="rounded-card p-2 text-ink hover:bg-line/40"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingQuestion(question)}
                          className="rounded-card p-2 text-danger hover:bg-danger/5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {questionsTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">
                    Showing {(questionsPage - 1) * questionsPerPage + 1} to {Math.min(questionsPage * questionsPerPage, questionsTotal)} of {questionsTotal} questions
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setQuestionsPage(p => Math.max(1, p - 1))}
                      disabled={questionsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setQuestionsPage(p => Math.min(questionsTotalPages, p + 1))}
                      disabled={questionsPage === questionsTotalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Topics Tab */}
      {activeTab === 'topics' && (
        <>
          {/* Filters */}
          <div className="card p-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search topics..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input-base pl-9"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="input-base"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Topics Grid */}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="card animate-pulse p-6">
                  <div className="h-4 w-2/3 rounded bg-line" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-line" />
                </div>
              ))}
            </div>
          ) : topics.length === 0 ? (
            <EmptyState
              icon={<Tag className="h-12 w-12" />}
              title="No topics found"
              message="Create your first topic to organize questions"
              action={
                <Button onClick={() => setCreatingTopic(true)}>
                  <Plus className="h-4 w-4" />
                  Add Topic
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {topics.map((topic) => (
                  <div
                    key={topic.id}
                    className="card group p-5 transition-all hover:border-brand-200"
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-semibold text-ink">{topic.name}</h3>
                      <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => setEditingTopic(topic)}
                          className="rounded-card p-1 text-ink hover:bg-line/40"
                        >
                          <PencilLine className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setDeletingTopic(topic)}
                          className="rounded-card p-1 text-danger hover:bg-danger/5"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-muted mb-3">{topic.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge color="brand">{topic.category}</Badge>
                      <span className="text-sm text-muted">{topic.questionCount} questions</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {topicsTotalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted">
                    Showing {(topicsPage - 1) * topicsPerPage + 1} to {Math.min(topicsPage * topicsPerPage, topicsTotal)} of {topicsTotal} topics
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setTopicsPage(p => Math.max(1, p - 1))}
                      disabled={topicsPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setTopicsPage(p => Math.min(topicsTotalPages, p + 1))}
                      disabled={topicsPage === topicsTotalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Question Modals */}
      {(creatingQuestion || editingQuestion) && (
        <QuestionFormModal
          question={editingQuestion}
          topics={topics}
          onClose={() => {
            setCreatingQuestion(false)
            setEditingQuestion(null)
          }}
          onSuccess={() => {
            setCreatingQuestion(false)
            setEditingQuestion(null)
            toast('Success', editingQuestion ? 'Question updated' : 'Question created')
          }}
        />
      )}

      {viewingQuestion && (
        <QuestionViewModal
          question={viewingQuestion}
          onClose={() => setViewingQuestion(null)}
        />
      )}

      {deletingQuestion && (
        <Modal open={true} onClose={() => setDeletingQuestion(null)} title="Delete Question">
          <p className="text-sm text-muted">
            Are you sure you want to delete this question? This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeletingQuestion(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast('Success', 'Question deleted successfully')
                setDeletingQuestion(null)
              }}
              className="flex-1 bg-danger hover:bg-danger/90"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {/* Topic Modals */}
      {(creatingTopic || editingTopic) && (
        <TopicFormModal
          topic={editingTopic}
          onClose={() => {
            setCreatingTopic(false)
            setEditingTopic(null)
          }}
          onSuccess={() => {
            setCreatingTopic(false)
            setEditingTopic(null)
            toast('Success', editingTopic ? 'Topic updated' : 'Topic created')
          }}
        />
      )}

      {deletingTopic && (
        <Modal open={true} onClose={() => setDeletingTopic(null)} title="Delete Topic">
          <p className="text-sm text-muted">
            Are you sure you want to delete "{deletingTopic.name}"? Questions tagged with this topic will not be deleted but will lose this tag. This action cannot be undone.
          </p>
          <div className="mt-6 flex gap-2">
            <Button variant="outline" onClick={() => setDeletingTopic(null)} className="flex-1">
              Cancel
            </Button>
            <Button
              onClick={() => {
                toast('Success', 'Topic deleted successfully')
                setDeletingTopic(null)
              }}
              className="flex-1 bg-danger hover:bg-danger/90"
            >
              Delete
            </Button>
          </div>
        </Modal>
      )}

      {/* Bulk Import Modal */}
      {bulkImportOpen && (
        <BulkImportModal
          onClose={() => setBulkImportOpen(false)}
          onSuccess={(count) => {
            setBulkImportOpen(false)
            toast('Success', `Imported ${count} questions successfully`)
          }}
        />
      )}
    </div>
  )
}

function QuestionFormModal({ question, topics, onClose, onSuccess }: {
  question?: Question | null
  topics: Topic[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    type: question?.type || 'multiple-choice' as QuestionType,
    question: question?.question || '',
    explanation: question?.explanation || '',
    difficulty: question?.difficulty || 'medium' as DifficultyLevel,
    topicIds: question?.topicIds || [] as string[],
    points: question?.points || 1,
    isActive: question?.isActive ?? true,
    correctAnswer: question?.correctAnswer ?? true
  })

  const [options, setOptions] = useState<QuestionOption[]>(
    question?.options || [
      { id: '1', text: '', isCorrect: false },
      { id: '2', text: '', isCorrect: false },
      { id: '3', text: '', isCorrect: false },
      { id: '4', text: '', isCorrect: false }
    ]
  )

  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onSuccess()
    }, 1000)
  }

  const updateOption = (id: string, field: 'text' | 'isCorrect', value: string | boolean) => {
    setOptions(options.map(opt =>
      opt.id === id ? { ...opt, [field]: value } : opt
    ))
  }

  const addOption = () => {
    setOptions([...options, { id: Date.now().toString(), text: '', isCorrect: false }])
  }

  const removeOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter(opt => opt.id !== id))
    }
  }

  return (
    <Modal open={true} onClose={onClose} title={question ? 'Edit Question' : 'Create Question'} size="large">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type */}
        <div>
          <label className="label-base">Question Type</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'multiple-choice' })}
              className={cn(
                'rounded-card border-2 p-3 text-left transition-all',
                formData.type === 'multiple-choice'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-line hover:border-brand-200'
              )}
            >
              <p className="font-medium">Multiple Choice</p>
              <p className="text-xs text-muted">4+ answer options</p>
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'true-false' })}
              className={cn(
                'rounded-card border-2 p-3 text-left transition-all',
                formData.type === 'true-false'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-line hover:border-brand-200'
              )}
            >
              <p className="font-medium">True/False</p>
              <p className="text-xs text-muted">Binary choice</p>
            </button>
          </div>
        </div>

        {/* Question */}
        <div>
          <label className="label-base">Question</label>
          <textarea
            value={formData.question}
            onChange={(e) => setFormData({ ...formData, question: e.target.value })}
            className="input-base"
            rows={3}
            placeholder="Enter your question..."
            required
          />
        </div>

        {/* Options for Multiple Choice */}
        {formData.type === 'multiple-choice' && (
          <div>
            <label className="label-base">Answer Options</label>
            <div className="mt-2 space-y-2">
              {options.map((option, index) => (
                <div key={option.id} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={option.isCorrect}
                    onChange={() => {
                      setOptions(options.map(opt => ({
                        ...opt,
                        isCorrect: opt.id === option.id
                      })))
                    }}
                    className="rounded-full border-line"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                    className="input-base flex-1"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(option.id)}
                      className="rounded-card p-2 text-danger hover:bg-danger/5"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 6 && (
              <Button type="button" variant="outline" onClick={addOption} className="mt-2">
                <Plus className="h-4 w-4" />
                Add Option
              </Button>
            )}
          </div>
        )}

        {/* Correct Answer for True/False */}
        {formData.type === 'true-false' && (
          <div>
            <label className="label-base">Correct Answer</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, correctAnswer: true })}
                className={cn(
                  'rounded-card border-2 p-3 transition-all',
                  formData.correctAnswer
                    ? 'border-success bg-success/10'
                    : 'border-line hover:border-success'
                )}
              >
                True
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, correctAnswer: false })}
                className={cn(
                  'rounded-card border-2 p-3 transition-all',
                  !formData.correctAnswer
                    ? 'border-danger bg-danger/10'
                    : 'border-line hover:border-danger'
                )}
              >
                False
              </button>
            </div>
          </div>
        )}

        {/* Explanation */}
        <div>
          <label className="label-base">Explanation</label>
          <textarea
            value={formData.explanation}
            onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
            className="input-base"
            rows={3}
            placeholder="Explain the correct answer..."
            required
          />
        </div>

        {/* Difficulty & Points */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-base">Difficulty</label>
            <select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as DifficultyLevel })}
              className="input-base"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label className="label-base">Points</label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 1 })}
              className="input-base"
              min="1"
              max="10"
            />
          </div>
        </div>

        {/* Topics */}
        <div>
          <label className="label-base">Topics (select multiple)</label>
          <div className="mt-2 grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
            {topics.map(topic => (
              <label key={topic.id} className="flex items-center gap-2 rounded-card border border-line p-2 hover:bg-line/20">
                <input
                  type="checkbox"
                  checked={formData.topicIds.includes(topic.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({ ...formData, topicIds: [...formData.topicIds, topic.id] })
                    } else {
                      setFormData({ ...formData, topicIds: formData.topicIds.filter(id => id !== topic.id) })
                    }
                  }}
                  className="rounded border-line"
                />
                <span className="text-sm">{topic.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="question-active"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="rounded border-line"
          />
          <label htmlFor="question-active" className="text-sm text-ink">
            Active (available for use in quizzes)
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              question ? 'Update Question' : 'Create Question'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function QuestionViewModal({ question, onClose }: { question: Question; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} title="Question Preview">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge color={question.type === 'multiple-choice' ? 'brand' : 'warning'}>
            {question.type === 'multiple-choice' ? 'Multiple Choice' : 'True/False'}
          </Badge>
          <Badge color={
            question.difficulty === 'easy' ? 'success' :
            question.difficulty === 'medium' ? 'warning' : 'danger'
          }>
            {question.difficulty}
          </Badge>
          <Badge>{question.points} point{question.points !== 1 ? 's' : ''}</Badge>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Question</h3>
          <p className="text-ink">{question.question}</p>
        </div>

        {question.type === 'multiple-choice' && question.options.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Options</h3>
            <div className="space-y-2">
              {question.options.map((option) => (
                <div
                  key={option.id}
                  className={cn(
                    'rounded-card border p-3',
                    option.isCorrect ? 'border-success bg-success/5' : 'border-line'
                  )}
                >
                  <div className="flex items-center gap-2">
                    {option.isCorrect && <CheckCircle className="h-4 w-4 text-success" />}
                    <span className="text-sm">{option.text}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'true-false' && (
          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Correct Answer</h3>
            <Badge color={question.correctAnswer ? 'success' : 'danger'}>
              {question.correctAnswer ? 'TRUE' : 'FALSE'}
            </Badge>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-ink mb-2">Explanation</h3>
          <p className="text-sm text-muted">{question.explanation}</p>
        </div>

        {question.topics.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-ink mb-2">Topics</h3>
            <div className="flex flex-wrap gap-1">
              {question.topics.map((topic, idx) => (
                <Badge key={idx}>{topic}</Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={onClose} className="w-full">Close</Button>
      </div>
    </Modal>
  )
}

function TopicFormModal({ topic, onClose, onSuccess }: { topic?: Topic | null; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: topic?.name || '',
    description: topic?.description || '',
    category: topic?.category || 'Cardiovascular System'
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      onSuccess()
    }, 1000)
  }

  return (
    <Modal open={true} onClose={onClose} title={topic ? 'Edit Topic' : 'Create Topic'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label-base">Topic Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input-base"
            placeholder="e.g., Heart Anatomy"
            required
          />
        </div>

        <div>
          <label className="label-base">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input-base"
            rows={3}
            placeholder="Brief description of this topic..."
            required
          />
        </div>

        <div>
          <label className="label-base">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="input-base"
            placeholder="e.g., Cardiovascular System"
            required
          />
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              topic ? 'Update Topic' : 'Create Topic'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function BulkImportModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (count: number) => void }) {
  const [importType, setImportType] = useState<'csv' | 'json'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)

  const csvTemplate = `type,question,difficulty,points,topic,option1,option2,option3,option4,correctOption,explanation
multiple-choice,How many chambers does the heart have?,easy,1,Heart Anatomy,Two,Three,Four,Five,3,The heart has four chambers...
true-false,The left ventricle pumps blood to the lungs.,medium,1,Blood Circulation,,,,,false,FALSE. The left ventricle pumps to the body...`

  const jsonTemplate = `[
  {
    "type": "multiple-choice",
    "question": "How many chambers does the heart have?",
    "difficulty": "easy",
    "points": 1,
    "topics": ["Heart Anatomy"],
    "options": [
      { "text": "Two", "isCorrect": false },
      { "text": "Three", "isCorrect": false },
      { "text": "Four", "isCorrect": true },
      { "text": "Five", "isCorrect": false }
    ],
    "explanation": "The heart has four chambers..."
  }
]`

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return

    setImporting(true)
    setTimeout(() => {
      setImporting(false)
      onSuccess(25) // Mock import count
    }, 2000)
  }

  const downloadTemplate = () => {
    const content = importType === 'csv' ? csvTemplate : jsonTemplate
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `questions-template.${importType}`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Modal open={true} onClose={onClose} title="Bulk Import Questions">
      <form onSubmit={handleImport} className="space-y-4">
        <div>
          <label className="label-base">Import Format</label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setImportType('csv')}
              className={cn(
                'rounded-card border-2 p-3 text-center transition-all',
                importType === 'csv'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-line hover:border-brand-200'
              )}
            >
              <FileText className="mx-auto h-6 w-6 mb-1" />
              <span className="text-sm font-medium">CSV</span>
            </button>
            <button
              type="button"
              onClick={() => setImportType('json')}
              className={cn(
                'rounded-card border-2 p-3 text-center transition-all',
                importType === 'json'
                  ? 'border-brand-500 bg-brand-50'
                  : 'border-line hover:border-brand-200'
              )}
            >
              <FileText className="mx-auto h-6 w-6 mb-1" />
              <span className="text-sm font-medium">JSON</span>
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="label-base">Upload File</label>
            <button
              type="button"
              onClick={downloadTemplate}
              className="text-sm text-brand-700 hover:text-brand-800 flex items-center gap-1"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </div>
          <input
            type="file"
            accept={importType === 'csv' ? '.csv' : '.json'}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="input-base"
            required
          />
        </div>

        <div className="rounded-card border border-line bg-surface p-4 text-sm text-muted">
          <p className="font-medium text-ink mb-2">Required Fields:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Type: multiple-choice or true-false</li>
            <li>Question: The question text</li>
            <li>Difficulty: easy, medium, or hard</li>
            <li>Points: Number of points (1-10)</li>
            <li>Topics: Question topics/tags</li>
            <li>Options & Explanation</li>
          </ul>
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={importing} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" disabled={importing || !file} className="flex-1">
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Import Questions
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
