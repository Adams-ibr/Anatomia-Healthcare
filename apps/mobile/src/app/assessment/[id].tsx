import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Button, Card, colors, Heading, Notice, Screen } from '@/components/ui';
import { authApi } from '@/lib/auth-api';
import { useAuth } from '@/providers/auth-provider';

type Question = { id: string; type: string; question: string; options: string[] };
type Assessment = { id: string; courseId: string; courseTitle: string; title: string; description: string; timeLimit: number; passingScore: number; retakeLimit: number; attemptCount: number; questions: Question[] };
type Result = { attemptId: string; score: number; passed: boolean; correct: number; total: number; passingScore: number; certificateIssued: boolean; gradedAnswers: Record<string, { given: string | string[]; correct: string | string[] | null; isCorrect: boolean; explanation: string | null }> };

export default function AssessmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { session } = useAuth();
  const [assessment, setAssessment] = useState<Assessment | null>(null); const [answers, setAnswers] = useState<Record<string, string | string[]>>({}); const [result, setResult] = useState<Result | null>(null); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    if (!session) { router.replace('/sign-in'); return; }
    let active = true;
    authApi<{ assessment: Assessment }>(`/me/assessments/${encodeURIComponent(id)}`, { token: session.access_token })
      .then(({ assessment: value }) => { if (active) setAssessment(value); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not load assessment.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, session]);

  const submit = async () => {
    if (!session || !assessment) return;
    setSubmitting(true); setError('');
    try {
      const response = await authApi<{ result: Result }>(`/me/assessments/${encodeURIComponent(id)}/attempt`, { method: 'POST', token: session.access_token, body: { answers } });
      setResult(response.result);
      setAssessment(current => current ? { ...current, attemptCount: current.attemptCount + 1 } : current);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not submit your answers.'); }
    finally { setSubmitting(false); }
  };

  const setSingleAnswer = (questionId: string, value: string) => setAnswers(previous => ({ ...previous, [questionId]: value }));
  const toggleMultiAnswer = (questionId: string, value: string) => {
    const current = Array.isArray(answers[questionId]) ? answers[questionId] as string[] : [];
    setAnswers(previous => ({ ...previous, [questionId]: current.includes(value) ? current.filter(item => item !== value) : [...current, value] }));
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  if (!assessment) return <Screen><Button variant="secondary" onPress={() => router.back()}>‹  Back</Button><Notice>{error || 'Assessment not found.'}</Notice></Screen>;
  const attemptsRemain = assessment.attemptCount < assessment.retakeLimit;
  return <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}><ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 15 }}>
    <Button variant="secondary" onPress={() => router.back()}>‹  Back to course</Button>
    <Heading eyebrow={assessment.courseTitle}>{assessment.title}</Heading>
    <Card><Text style={{ color: colors.muted }}>{assessment.description || 'Answer each question, then submit to see your score.'}</Text><Text style={{ color: colors.ink, fontWeight: '700' }}>{assessment.questions.length} questions · Pass mark {assessment.passingScore}% · {assessment.attemptCount}/{assessment.retakeLimit} attempts used</Text></Card>
    {error ? <Notice>{error}</Notice> : null}
    {result ? <Card style={{ backgroundColor: result.passed ? colors.brandSoft : '#FCEDEA' }}><Text style={{ color: result.passed ? colors.brand : colors.danger, fontSize: 20, fontWeight: '800' }}>{result.passed ? 'Assessment passed' : 'Not passed yet'} · {result.score}%</Text><Text style={{ color: colors.ink }}>{result.correct} of {result.total} graded questions correct. {result.passed && result.certificateIssued ? 'Your certificate has been issued.' : ''}</Text></Card> : null}
    {assessment.questions.map((question, index) => {
      const submitted = result?.gradedAnswers[question.id]; const selectedValues = Array.isArray(answers[question.id]) ? answers[question.id] as string[] : [];
      return <Card key={question.id}><Text style={{ color: colors.muted, fontWeight: '800', fontSize: 12 }}>QUESTION {index + 1} · {question.type.toUpperCase()}</Text><Text style={{ color: colors.ink, fontSize: 17, fontWeight: '700' }}>{question.question}</Text>
        {question.type === 'essay' || question.type === 'short' || question.type === 'fill' ? <TextInput editable={!result && attemptsRemain} value={typeof answers[question.id] === 'string' ? answers[question.id] as string : ''} onChangeText={value => setSingleAnswer(question.id, value)} multiline={question.type === 'essay'} placeholder={question.type === 'essay' ? 'Write your response…' : 'Type your answer…'} placeholderTextColor="#9BA5A2" style={{ minHeight: question.type === 'essay' ? 110 : 48, borderWidth: 1, borderColor: colors.line, borderRadius: 12, backgroundColor: colors.paper, padding: 12, color: colors.ink, textAlignVertical: 'top' }} /> : null}
        {(question.type === 'mc' || question.type === 'multi') ? question.options.map((option, optionIndex) => { const value = String(optionIndex); const chosen = question.type === 'multi' ? selectedValues.includes(value) : answers[question.id] === option; return <Pressable key={`${question.id}-${optionIndex}`} disabled={Boolean(result) || !attemptsRemain} onPress={() => question.type === 'multi' ? toggleMultiAnswer(question.id, value) : setSingleAnswer(question.id, option)} style={{ padding: 12, borderWidth: 1, borderColor: chosen ? colors.brand : colors.line, borderRadius: 12, backgroundColor: chosen ? colors.brandSoft : colors.white }}><Text style={{ color: colors.ink }}>{chosen ? '●  ' : '○  '}{option}</Text></Pressable>; }) : null}
        {question.type === 'truefalse' ? ['true', 'false'].map(value => <Pressable key={value} disabled={Boolean(result) || !attemptsRemain} onPress={() => setSingleAnswer(question.id, value)} style={{ padding: 12, borderWidth: 1, borderColor: answers[question.id] === value ? colors.brand : colors.line, borderRadius: 12, backgroundColor: answers[question.id] === value ? colors.brandSoft : colors.white }}><Text style={{ color: colors.ink }}>{answers[question.id] === value ? '●  ' : '○  '}{value === 'true' ? 'True' : 'False'}</Text></Pressable>) : null}
        {submitted ? <Text style={{ color: submitted.isCorrect ? colors.brand : colors.danger, fontWeight: '600' }}>{submitted.isCorrect ? 'Correct' : `Incorrect${submitted.correct ? ` · Answer: ${question.type === 'multi' && typeof submitted.correct === 'string' ? submitted.correct.split(',').map(index => question.options[Number(index)] ?? index).join(', ') : Array.isArray(submitted.correct) ? submitted.correct.join(', ') : submitted.correct}` : ''}`}{submitted.explanation ? `\n${submitted.explanation}` : ''}</Text> : null}
      </Card>;
    })}
    {!result && attemptsRemain ? <Button onPress={() => void submit()} disabled={submitting}>{submitting ? 'Submitting…' : 'Submit assessment'}</Button> : !result ? <Notice>You have used all available attempts for this assessment.</Notice> : null}
  </ScrollView></Screen>;
}
