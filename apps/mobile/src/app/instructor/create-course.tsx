import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Button, Card, colors, Field, Heading, Notice, Screen } from '@/components/ui';
import { authApi } from '@/lib/auth-api';
import { useAuth } from '@/providers/auth-provider';

type Category = { id: string; name: string };
type LessonDraft = { title: string; duration: string; content: string; videoUrl: string };
type SectionDraft = { title: string; lessons: LessonDraft[] };
const newLesson = (): LessonDraft => ({ title: '', duration: '', content: '', videoUrl: '' });

export default function CreateCourseScreen() {
  const { role, session } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('0');
  const [sections, setSections] = useState<SectionDraft[]>([{ title: '', lessons: [newLesson()] }]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [createdCourseId, setCreatedCourseId] = useState('');

  useEffect(() => {
    if (!session) { router.replace('/sign-in'); return; }
    if (role !== 'instructor' && role !== 'admin') { setError('Instructor access is required to create a course.'); setLoadingCategories(false); return; }
    let active = true;
    authApi<{ categories: Category[] }>('/categories', { token: session.access_token })
      .then(result => { if (active) { const values = result.categories ?? []; setCategories(values); setCategoryId(values[0]?.id ?? ''); } })
      .catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not load course categories.'); })
      .finally(() => { if (active) setLoadingCategories(false); });
    return () => { active = false; };
  }, [role, session]);

  const updateSection = (sectionIndex: number, change: Partial<SectionDraft>) => setSections(current => current.map((section, index) => index === sectionIndex ? { ...section, ...change } : section));
  const updateLesson = (sectionIndex: number, lessonIndex: number, change: Partial<LessonDraft>) => setSections(current => current.map((section, index) => index === sectionIndex ? { ...section, lessons: section.lessons.map((lesson, childIndex) => childIndex === lessonIndex ? { ...lesson, ...change } : lesson) } : section));

  const create = async () => {
    if (!session) { router.replace('/sign-in'); return; }
    if (!title.trim()) { setError('Enter a course title.'); return; }
    if (!categoryId) { setError('Select a course category.'); return; }
    if (sections.some(section => !section.title.trim() || !section.lessons.length || section.lessons.some(lesson => !lesson.title.trim()))) { setError('Give each section and lesson a title, and add at least one lesson to every section.'); return; }
    setSaving(true); setError('');
    let didCreateCourse = false;
    try {
      let courseId = createdCourseId;
      if (!courseId) {
        const created = await authApi<{ course: { id: string } }>('/me/courses', {
          method: 'POST', token: session.access_token,
          body: { title: title.trim(), description: description.trim(), categoryId, price: Number(price) || 0, level: 'Beginner', status: 'draft' }
        });
        courseId = created.course.id;
        didCreateCourse = true;
        setCreatedCourseId(courseId);
      }
      await authApi(`/me/courses/${encodeURIComponent(courseId)}/content`, {
        method: 'PUT', token: session.access_token,
        body: {
          sections: sections.map(section => ({ title: section.title.trim(), lessons: section.lessons.map(lesson => ({ title: lesson.title.trim(), type: lesson.videoUrl.trim() ? 'video' : 'text', duration: Number(lesson.duration) || 0, content: lesson.content.trim(), videoUrl: lesson.videoUrl.trim() })) })),
          objectives: [], requirements: [], faqs: [], assessments: []
        }
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? `${createdCourseId || didCreateCourse ? 'The draft exists, but its outline could not be saved' : 'Course creation did not finish'}: ${e.message}` : 'Course creation did not finish.');
    } finally { setSaving(false); }
  };

  return <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}><ScrollView contentContainerStyle={{ padding: 20, gap: 15, paddingBottom: 40 }}>
    <Button variant="secondary" onPress={() => router.back()}>‹  Back to courses</Button>
    <Heading eyebrow="Instructor workspace">Create a draft course</Heading>
    <Text style={{ color: colors.muted, lineHeight: 21 }}>Your new course will be saved as a draft. You can publish it after completing the required course setup in the web studio.</Text>
    {error ? <Notice>{error}</Notice> : null}
    <Card>
      <Field label="Course title" value={title} onChangeText={setTitle} placeholder="e.g. Foundations of Human Anatomy" />
      <Field label="Description" value={description} onChangeText={setDescription} placeholder="What will learners study?" multiline style={{ minHeight: 100, paddingTop: 14, textAlignVertical: 'top' }} />
      <Field label="Price in NGN (0 for free)" value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
      <Text style={{ color: colors.ink, fontWeight: '700' }}>Category</Text>
      {loadingCategories ? <ActivityIndicator color={colors.brand} /> : categories.length ? <View style={{ gap: 8 }}>{categories.map(category => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={{ padding: 13, borderRadius: 12, borderWidth: 1, borderColor: categoryId === category.id ? colors.brand : colors.line, backgroundColor: categoryId === category.id ? colors.brandSoft : colors.white }}><Text style={{ color: colors.ink, fontWeight: categoryId === category.id ? '700' : '500' }}>{categoryId === category.id ? '●  ' : '○  '}{category.name}</Text></Pressable>)}</View> : <Text style={{ color: colors.muted }}>No categories are available. Ask an administrator to add one first.</Text>}
    </Card>
    <Heading eyebrow="Course outline">Sections and lessons</Heading>
    {sections.map((section, sectionIndex) => <Card key={`section-${sectionIndex}`}>
      <Field label={`Section ${sectionIndex + 1}`} value={section.title} onChangeText={value => updateSection(sectionIndex, { title: value })} placeholder="Section title" />
      {section.lessons.map((lesson, lessonIndex) => <View key={`lesson-${sectionIndex}-${lessonIndex}`} style={{ padding: 13, gap: 8, borderRadius: 14, backgroundColor: colors.paper }}>
        <Text style={{ color: colors.brand, fontWeight: '800' }}>Lesson {lessonIndex + 1}</Text>
        <Field label="Lesson title" value={lesson.title} onChangeText={value => updateLesson(sectionIndex, lessonIndex, { title: value })} placeholder="Lesson title" />
        <Field label="Duration in minutes" value={lesson.duration} onChangeText={value => updateLesson(sectionIndex, lessonIndex, { duration: value })} keyboardType="number-pad" />
        <Field label="Lesson text" value={lesson.content} onChangeText={value => updateLesson(sectionIndex, lessonIndex, { content: value })} placeholder="Write lesson content…" multiline style={{ minHeight: 100, paddingTop: 14, textAlignVertical: 'top' }} />
        <Field label="Video URL (optional)" value={lesson.videoUrl} onChangeText={value => updateLesson(sectionIndex, lessonIndex, { videoUrl: value })} placeholder="https://…" keyboardType="url" />
        {section.lessons.length > 1 ? <Button variant="secondary" onPress={() => updateSection(sectionIndex, { lessons: section.lessons.filter((_, index) => index !== lessonIndex) })}>Remove lesson</Button> : null}
      </View>)}
      <Button variant="secondary" onPress={() => updateSection(sectionIndex, { lessons: [...section.lessons, newLesson()] })}>＋  Add lesson</Button>
      {sections.length > 1 ? <Button variant="secondary" onPress={() => setSections(current => current.filter((_, index) => index !== sectionIndex))}>Remove section</Button> : null}
    </Card>)}
    <Button variant="secondary" onPress={() => setSections(current => [...current, { title: '', lessons: [newLesson()] }])}>＋  Add section</Button>
    <Button onPress={() => void create()} disabled={saving || loadingCategories || !categories.length}>{saving ? 'Saving course…' : createdCourseId ? 'Retry saving course outline' : 'Save as draft'}</Button>
  </ScrollView></Screen>;
}
