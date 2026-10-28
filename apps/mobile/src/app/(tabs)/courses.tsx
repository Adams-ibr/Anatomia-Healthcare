import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, Text, View } from 'react-native';
import { Button, Card, colors, Heading, Notice, Screen } from '@/components/ui';
import { authApi } from '@/lib/auth-api';
import { requireSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type Course = { id: string; title: string; subtitle?: string; description: string; category?: string; categoryName?: string; level: string; duration?: number | string | null; price: number | null; discountPrice?: number; is_free?: boolean | null; thumbnail?: string | null; thumbnail_url?: string | null; status?: string };

export default function CoursesScreen() {
  const { role, session } = useAuth(); const [courses, setCourses] = useState<Course[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      if (role === 'instructor') {
        if (!session) throw new Error('Sign in to view your courses.');
        const result = await authApi<{ courses: Course[] }>('/me/courses', { token: session.access_token });
        setCourses(result.courses ?? []);
      } else {
        const { data, error: queryError } = await requireSupabase().from('courses').select('id,title,short_description,description,category,level,duration,price,is_free,thumbnail_url').eq('is_published', true).order('created_at', { ascending: false });
        if (queryError) throw queryError;
        setCourses((data ?? []) as Course[]);
      }
      setError('');
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load courses.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [role, session?.user.id]);
  useEffect(() => { void load(); }, [load]);
  return <Screen style={{ paddingTop: 28 }}><FlatList data={courses} keyExtractor={c => c.id} contentContainerStyle={{ gap: 14, paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} tintColor={colors.brand} />} ListHeaderComponent={<><Heading eyebrow={role === 'instructor' ? 'Teaching workspace' : 'Discover'}>{role === 'instructor' ? 'My courses' : 'Course library'}</Heading>{role === 'instructor' ? <Button onPress={() => router.push('/instructor/create-course')}>＋  Create a draft course</Button> : null}{error ? <Notice>{error}</Notice> : null}{loading ? <ActivityIndicator color={colors.brand} style={{ padding: 20 }} /> : null}{!loading && !error && courses.length === 0 ? <Card><Text style={{ color: colors.ink, fontWeight: '700' }}>Nothing here yet</Text><Text style={{ color: colors.muted }}>Courses available to your account will appear here.</Text></Card> : null}</>} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })}><Card style={{ padding: 0, overflow: 'hidden' }}>{item.thumbnail || item.thumbnail_url ? <Image source={{ uri: item.thumbnail || item.thumbnail_url! }} style={{ width: '100%', height: 150 }} resizeMode="cover" /> : <View style={{ height: 110, backgroundColor: colors.brandSoft, justifyContent: 'center', padding: 18 }}><Text style={{ color: colors.brand, fontSize: 24, fontWeight: '700' }}>Anatomia</Text></View>}<View style={{ padding: 16, gap: 8 }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>{item.title}</Text><Text numberOfLines={2} style={{ color: colors.muted, lineHeight: 20 }}>{item.subtitle || item.description}</Text><Text style={{ color: colors.brand, fontWeight: '700' }}>{item.is_free || !(item.discountPrice ?? item.price) ? 'Free' : `₦${Number(item.discountPrice ?? item.price).toLocaleString()}`} · {item.level} · {item.duration || 'Self-paced'}{role === 'instructor' && item.status ? ` · ${item.status}` : ''}</Text></View></Card></Pressable>} /></Screen>;
}
