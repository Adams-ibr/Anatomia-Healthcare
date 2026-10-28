import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, Text, View } from 'react-native';
import { Card, colors, Heading, Notice, Screen } from '@/components/ui';
import { authApi } from '@/lib/auth-api';
import { useAuth } from '@/providers/auth-provider';

type Enrollment = { id: string; courseId: string; progress: number; status: string; course?: { title?: string; thumbnail?: string; subtitle?: string } };

export default function LearningScreen() {
  const { session } = useAuth(); const [rows, setRows] = useState<Enrollment[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!session) return;
    setLoading(true); setError('');
    try { const result = await authApi<{ enrollments: Enrollment[] }>('/me/enrollments', { token: session.access_token }); setRows(result.enrollments ?? []); }
    catch (e) { setError(e instanceof Error ? e.message : 'Could not load your learning library.'); }
    finally { setLoading(false); }
  }, [session]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));
  return <Screen><FlatList data={rows} keyExtractor={row => row.id} contentContainerStyle={{ gap: 14, paddingBottom: 32 }} ListHeaderComponent={<><Heading eyebrow="Your library">My learning</Heading>{error ? <Notice>{error}</Notice> : null}{loading ? <ActivityIndicator color={colors.brand} style={{ padding: 20 }} /> : null}{!loading && !error && rows.length === 0 ? <Card><Text style={{ color: colors.ink, fontWeight: '700' }}>Your learning starts here</Text><Text style={{ color: colors.muted, lineHeight: 21 }}>Courses you enroll in will appear in this library.</Text></Card> : null}</>} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: '/course-study/[id]', params: { id: item.courseId } })}><Card style={{ padding: 0, overflow: 'hidden' }}>{item.course?.thumbnail ? <Image source={{ uri: item.course.thumbnail }} style={{ height: 145, width: '100%' }} resizeMode="cover" /> : <View style={{ height: 100, backgroundColor: colors.brandSoft, justifyContent: 'center', padding: 18 }}><Text style={{ color: colors.brand, fontSize: 23, fontWeight: '700' }}>Anatomia</Text></View>}<View style={{ padding: 16, gap: 8 }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>{item.course?.title || 'Course'}</Text><Text style={{ color: colors.muted }}>{item.progress || 0}% complete · {item.status}</Text><View style={{ height: 6, backgroundColor: colors.line, borderRadius: 4 }}><View style={{ height: 6, width: `${Math.min(100, Math.max(0, item.progress || 0))}%`, backgroundColor: colors.brand, borderRadius: 4 }} /></View><Text style={{ color: colors.brand, fontWeight: '700' }}>{item.status === 'completed' ? 'Review course' : 'Continue learning'} →</Text></View></Card></Pressable>} /></Screen>;
}
