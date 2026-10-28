import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, colors, Heading, Notice, Screen } from '@/components/ui';
import { authApi } from '@/lib/auth-api';
import { useAuth } from '@/providers/auth-provider';

type Lesson = { id: string; title: string; type?: string; duration?: number; content?: string; videoUrl?: string; resourceUrl?: string };
type Section = { id: string; title: string; lessons: Lesson[] };
type Course = { id: string; title: string; sections?: Section[]; hasCertificate?: boolean };
type Enrollment = { id: string; courseId: string; progress: number; status: string; completedLessons: string[]; currentLessonId?: string; certificateIssued?: boolean; certificateId?: string };
type Certificate = { id: string; courseId: string; verificationCode: string; issuedAt: string; course?: { title?: string } };
type AssessmentSummary = { id: string; courseId: string; title: string; description?: string; attemptCount: number; retakeLimit: number; bestScore: number | null; passed: boolean };

export default function CourseStudyScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { session } = useAuth();
  const [course, setCourse] = useState<Course | null>(null); const [enrollment, setEnrollment] = useState<Enrollment | null>(null); const [certificates, setCertificates] = useState<Certificate[]>([]); const [assessments, setAssessments] = useState<AssessmentSummary[]>([]); const [selected, setSelected] = useState<Lesson | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState('');
  const lessons = useMemo(() => (course?.sections ?? []).flatMap(section => section.lessons ?? []), [course]);
  useEffect(() => {
    if (!session) { router.replace('/sign-in'); return; }
    let active = true; setLoading(true);
    Promise.all([authApi<{ course: Course }>(`/courses/${encodeURIComponent(id)}/full`, { token: session.access_token }), authApi<{ enrollments: Enrollment[] }>('/me/enrollments', { token: session.access_token }), authApi<{ certificates: Certificate[] }>('/me/certificates', { token: session.access_token }), authApi<{ assessments: AssessmentSummary[] }>('/me/assessments', { token: session.access_token })])
      .then(([courseResult, enrollmentResult, certificateResult, assessmentResult]) => { if (!active) return; const found = enrollmentResult.enrollments.find(row => row.courseId === id); setCourse(courseResult.course); setEnrollment(found ?? null); setCertificates(certificateResult.certificates ?? []); setAssessments((assessmentResult.assessments ?? []).filter(a => a.courseId === id)); const flat = (courseResult.course.sections ?? []).flatMap(section => section.lessons ?? []); setSelected(flat.find(lesson => lesson.id === found?.currentLessonId) ?? flat[0] ?? null); })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not load this course.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id, session]);

  const markComplete = async () => {
    if (!session || !course || !enrollment || !selected) return;
    setSaving(true); setError('');
    try {
      const completedLessons = [...new Set([...enrollment.completedLessons, selected.id])];
      const result = await authApi<{ enrollment: Enrollment }>(`/me/enrollments/${encodeURIComponent(course.id)}`, { method: 'PATCH', token: session.access_token, body: { completedLessons, currentLessonId: selected.id } });
      setEnrollment(result.enrollment);
      if (result.enrollment.certificateIssued) {
        const certs = await authApi<{ certificates: Certificate[] }>('/me/certificates', { token: session.access_token });
        setCertificates(certs.certificates ?? []);
      }
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save lesson progress.'); }
    finally { setSaving(false); }
  };

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  if (!course) return <Screen><Button variant="secondary" onPress={() => router.back()}>‹  Back</Button><Notice>{error || 'Course not found.'}</Notice></Screen>;
  if (!enrollment) return <Screen><Button variant="secondary" onPress={() => router.back()}>‹  Back</Button><Heading>{course.title}</Heading><Notice>You are not enrolled in this course yet.</Notice></Screen>;
  const certificate = certificates.find(item => item.courseId === course.id);
  return <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}><ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
    <Button variant="secondary" onPress={() => router.back()}>‹  Back to learning</Button>
    <Heading eyebrow="Course study">{course.title}</Heading>
    {error ? <Notice>{error}</Notice> : null}
    <Card><Text style={{ color: colors.ink, fontWeight: '700' }}>Your progress · {enrollment.progress ?? 0}%</Text><View style={{ height: 7, backgroundColor: colors.line, borderRadius: 5 }}><View style={{ height: 7, width: `${Math.min(100, Math.max(0, enrollment.progress ?? 0))}%`, backgroundColor: colors.brand, borderRadius: 5 }} /></View>{enrollment.certificateIssued ? <Text style={{ color: colors.brand, fontWeight: '700' }}>Certificate issued</Text> : null}</Card>
    {selected ? <Card><Text style={{ color: colors.muted, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{selected.type || 'LESSON'}{selected.duration ? ` · ${selected.duration} MIN` : ''}</Text><Text style={{ color: colors.ink, fontSize: 22, fontWeight: '700' }}>{selected.title}</Text>{selected.videoUrl ? <Pressable onPress={() => void Linking.openURL(selected.videoUrl!)}><Text style={{ color: colors.brand, fontWeight: '700' }}>Open lesson video ↗</Text></Pressable> : null}{selected.content ? <Text style={{ color: colors.ink, fontSize: 16, lineHeight: 25 }}>{selected.content}</Text> : <Text style={{ color: colors.muted }}>No text content for this lesson.</Text>}{selected.resourceUrl ? <Pressable onPress={() => void Linking.openURL(selected.resourceUrl!)}><Text style={{ color: colors.brand, fontWeight: '700' }}>Open lesson resource ↗</Text></Pressable> : null}<Button onPress={() => void markComplete()} disabled={saving || enrollment.completedLessons.includes(selected.id)}>{saving ? 'Saving progress…' : enrollment.completedLessons.includes(selected.id) ? 'Lesson completed' : 'Mark lesson complete'}</Button></Card> : <Notice>This course has no lessons yet.</Notice>}
    <Heading eyebrow="Curriculum">{lessons.length} lessons</Heading>
    {(course.sections ?? []).map(section => <Card key={section.id}><Text style={{ color: colors.ink, fontSize: 17, fontWeight: '700' }}>{section.title}</Text>{(section.lessons ?? []).map(lesson => { const done = enrollment.completedLessons.includes(lesson.id); return <Pressable key={lesson.id} onPress={() => setSelected(lesson)} style={{ paddingVertical: 11, borderTopWidth: 1, borderTopColor: colors.line, flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}><Text style={{ flex: 1, color: selected?.id === lesson.id ? colors.brand : colors.ink, fontWeight: selected?.id === lesson.id ? '700' : '500' }}>{done ? '✓  ' : ''}{lesson.title}</Text><Text style={{ color: colors.muted }}>{lesson.duration ? `${lesson.duration}m` : '›'}</Text></Pressable>; })}</Card>)}
    {assessments.length ? <><Heading eyebrow="Check your knowledge">Assessments</Heading>{assessments.map(assessment => <Card key={assessment.id}><Text style={{ color: colors.ink, fontWeight: '700', fontSize: 17 }}>{assessment.title}</Text>{assessment.description ? <Text style={{ color: colors.muted }}>{assessment.description}</Text> : null}<Text style={{ color: assessment.passed ? colors.brand : colors.muted }}>{assessment.passed ? `Passed · best score ${assessment.bestScore}%` : `Attempts ${assessment.attemptCount}/${assessment.retakeLimit}`}</Text><Button variant="secondary" onPress={() => router.push({ pathname: '/assessment/[id]', params: { id: assessment.id } })}>{assessment.passed ? 'Review result' : 'Take assessment'}</Button></Card>)}</> : null}
    {certificate ? <Card style={{ backgroundColor: colors.brandSoft }}><Text style={{ color: colors.brand, fontSize: 18, fontWeight: '700' }}>Certificate ready</Text><Text style={{ color: colors.ink }}>Verification code: {certificate.verificationCode}</Text><Text style={{ color: colors.muted }}>Issued {new Date(certificate.issuedAt).toLocaleDateString()}</Text></Card> : enrollment.progress >= 100 && course.hasCertificate ? <Notice>Your lessons are complete. If this course has a required assessment, pass it to receive the certificate.</Notice> : null}
  </ScrollView></Screen>;
}
