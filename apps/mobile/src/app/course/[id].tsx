import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, AppState, Image, Linking, ScrollView, Text, View } from 'react-native';
import { Button, Card, colors, Heading, Notice, Screen } from '@/components/ui';
import { authApi } from '@/lib/auth-api';
import { useAuth } from '@/providers/auth-provider';

type Lesson = { id: string; title: string; type?: string; duration?: number; content?: string; videoUrl?: string };
type Course = { id: string; title: string; description: string; subtitle?: string; categoryName?: string; level: string; duration: number | string; price: number; discountPrice?: number; thumbnail?: string; hasCertificate?: boolean; sections?: { id: string; title: string; lessons: Lesson[] }[] };
export default function CourseDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>(); const { session } = useAuth(); const [course, setCourse] = useState<Course | null>(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [enrolled, setEnrolled] = useState(false); const [pendingReference, setPendingReference] = useState('');
  useEffect(() => { let active = true; setLoading(true); Promise.all([authApi<{ course: Course }>(`/courses/${encodeURIComponent(id)}/full`), session ? authApi<{ enrollments: { courseId: string }[] }>('/me/enrollments') : Promise.resolve({ enrollments: [] })]).then(([result, mine]) => { if (!active) return; setCourse(result.course); setEnrolled(mine.enrollments.some(e => e.courseId === id)); }).catch(e => { if (active) setError(e instanceof Error ? e.message : 'Could not load this course.'); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, [id, session]);
  const verifyPayment = async () => {
    if (!session || !pendingReference) return;
    setSaving(true); setError('');
    try {
      await authApi(`/checkout/verify`, { method: 'POST', body: { reference: pendingReference }, token: session.access_token });
      setPendingReference(''); setEnrolled(true);
    } catch (e) { setError(e instanceof Error ? e.message : 'Payment has not been confirmed yet.'); }
    finally { setSaving(false); }
  };
  useEffect(() => {
    let wasBackgrounded = false;
    const subscription = AppState.addEventListener('change', state => {
      if (state !== 'active') wasBackgrounded = true;
      else if (wasBackgrounded && pendingReference) { wasBackgrounded = false; void verifyPayment(); }
    });
    return () => subscription.remove();
  }, [pendingReference, session]);
  const startLearning = async () => {
    if (!course) return;
    if (enrolled) { router.push({ pathname: '/course-study/[id]', params: { id } }); return; }
    if (!session) { router.push('/sign-in'); return; }
    const price = Number(course.discountPrice ?? course.price) || 0;
    setSaving(true); setError('');
    try {
      const checkout = await authApi<{ authorizationUrl?: string; reference?: string; enrollments?: unknown[] }>('/checkout', { method: 'POST', body: { courseIds: [id], ...(price > 0 ? { paymentMethod: 'paystack' } : {}) }, token: session.access_token });
      if (checkout.authorizationUrl && checkout.reference) {
        setPendingReference(checkout.reference);
        await Linking.openURL(checkout.authorizationUrl);
        return;
      }
      setEnrolled(true); router.push({ pathname: '/course-study/[id]', params: { id } });
    }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not enroll in this course.'); }
    finally { setSaving(false); }
  };
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}><ActivityIndicator color={colors.brand} /></View>;
  return <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}><ScrollView contentContainerStyle={{ paddingBottom: 32 }}>{course?.thumbnail ? <Image source={{ uri: course.thumbnail }} style={{ height: 240, width: '100%', backgroundColor: colors.brandSoft }} resizeMode="cover" /> : <View style={{ height: 210, justifyContent: 'center', padding: 24, backgroundColor: colors.brandSoft }}><Text style={{ color: colors.brand, fontSize: 32, fontWeight: '700' }}>Anatomia</Text></View>}<View style={{ padding: 22, gap: 16 }}><Button variant="secondary" onPress={() => router.back()}>‹  Back to courses</Button>{error ? <Notice>{error}</Notice> : null}{pendingReference ? <><Notice>Complete payment with Paystack, then return here to confirm your enrollment.</Notice><Button variant="secondary" onPress={() => void verifyPayment()} disabled={saving}>{saving ? 'Checking payment…' : 'I have completed payment · Verify'}</Button></> : null}{!course && !error ? <Notice>This course is not available.</Notice> : null}{course ? <><Text style={{ color: colors.brand, fontWeight: '800', letterSpacing: 1 }}>{course.categoryName || 'ANATOMIA'}</Text><Heading>{course.title}</Heading><Card><Text style={{ color: colors.muted, fontWeight: '600' }}>{course.level}  ·  {course.duration || 'Self-paced'}  ·  {(Number(course.discountPrice ?? course.price) || 0) === 0 ? 'Free' : `₦${Number(course.discountPrice ?? course.price).toLocaleString()}`}</Text></Card><Text style={{ color: colors.ink, fontSize: 16, lineHeight: 25 }}>{course.description || course.subtitle || 'Course information will be available soon.'}</Text><Card><Text style={{ color: colors.ink, fontWeight: '700' }}>Course includes</Text><Text style={{ color: colors.muted, lineHeight: 21 }}>{course.sections?.reduce((sum, section) => sum + section.lessons.length, 0) ?? 0} lessons · {course.hasCertificate ? 'Certificate of completion' : 'Lifetime access'}</Text></Card><Button onPress={() => void startLearning()} disabled={saving || Boolean(pendingReference)}>{saving ? 'Starting checkout…' : enrolled ? 'Continue learning' : (Number(course.discountPrice ?? course.price) || 0) === 0 ? 'Enroll for free' : 'Pay securely with Paystack'}</Button></> : null}</View></ScrollView></Screen>;
}
