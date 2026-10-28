import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Button, Card, colors, Heading, Loading, Notice, Screen } from '@/components/ui';
import { requireSupabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

type Course = { id: string; title: string; short_description: string | null; description: string; category: string; level: string; duration: string | null; price: number | null; is_free: boolean | null; thumbnail_url: string | null };

export default function HomeScreen() {
  const { session, role, signOut } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [refreshing, setRefreshing] = useState(false);
  const displayName = session?.user.user_metadata?.full_name || session?.user.email?.split('@')[0] || 'Learner';
  const loadCourses = useCallback(async () => {
    setError('');
    try {
      let query = requireSupabase().from('courses').select('id,title,short_description,description,category,level,duration,price,is_free,thumbnail_url').eq('is_published', true).order('created_at', { ascending: false }).limit(20);
      if (role === 'instructor') query = requireSupabase().from('courses').select('id,title,short_description,description,category,level,duration,price,is_free,thumbnail_url').eq('created_by', session?.user.id).order('created_at', { ascending: false }).limit(20);
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      setCourses((data ?? []) as Course[]);
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not load courses.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [role, session?.user.id]);
  useEffect(() => { void loadCourses(); }, [loadCourses]);

  if (!session) { router.replace('/sign-in'); return null; }
  const refresh = () => { setRefreshing(true); void loadCourses(); };
  return <Screen style={{ paddingHorizontal: 0, paddingTop: 0 }}>
    <FlatList data={courses} keyExtractor={(item) => item.id} contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 24, paddingBottom: 42, gap: 14 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.brand} />}
      ListHeaderComponent={<>
        <View style={{ paddingTop: 22, paddingBottom: 22 }}>
          <Text style={{ color: colors.brand, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 10 }}>{role === 'instructor' ? 'INSTRUCTOR SPACE' : 'ANATOMIA LEARNING'}</Text>
          <Text style={{ fontSize: 28, lineHeight: 34, color: colors.ink, fontWeight: '700', letterSpacing: -0.5 }}>Good day, {displayName}</Text>
          <Text style={{ color: colors.muted, fontSize: 15, marginTop: 8 }}>{role === 'instructor' ? 'Your teaching workspace, wherever you go.' : 'A little progress, every day.'}</Text>
        </View>
        <Card style={{ backgroundColor: colors.brand, borderColor: colors.brand, paddingVertical: 22 }}>
          <Text style={{ color: '#D2E4DB', fontSize: 12, fontWeight: '700', letterSpacing: 1.1 }}>{role === 'instructor' ? 'TEACH WITH ANATOMIA' : 'YOUR NEXT CHAPTER'}</Text>
          <Text style={{ color: colors.white, fontSize: 22, fontWeight: '700', lineHeight: 29, marginTop: 8 }}>{role === 'instructor' ? 'Keep your courses moving.' : 'Learn the human body, one idea at a time.'}</Text>
          <Text style={{ color: '#E6EFEB', fontSize: 14, lineHeight: 21, marginTop: 7 }}>{role === 'instructor' ? 'Course authoring and learner tools are coming to the mobile workspace.' : 'Explore practical courses built for curious minds and healthcare professionals.'}</Text>
          {role === 'instructor' ? <View style={{ marginTop: 16, alignSelf: 'flex-start' }}><Button variant="secondary" onPress={() => router.push('/courses')}>View my courses</Button></View> : null}
        </Card>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 30, marginBottom: 2 }}><View><Text style={{ color: colors.ink, fontSize: 21, fontWeight: '700' }}>{role === 'instructor' ? 'Your courses' : 'Explore courses'}</Text><Text style={{ color: colors.muted, fontSize: 13, marginTop: 5 }}>{role === 'instructor' ? 'Courses you teach' : 'Handpicked learning to get you started'}</Text></View><Pressable onPress={() => router.push('/courses')}><Text style={{ color: colors.brand, fontWeight: '700' }}>See all</Text></Pressable></View>
        {error ? <Notice>{error}</Notice> : null}
        {loading ? <View style={{ padding: 24, alignItems: 'center' }}><ActivityIndicator color={colors.brand} /></View> : null}
        {!loading && courses.length === 0 && !error ? <Card style={{ marginTop: 10 }}><Text style={{ color: colors.ink, fontWeight: '700', fontSize: 16 }}>{role === 'instructor' ? 'No courses assigned yet' : 'No published courses yet'}</Text><Text style={{ color: colors.muted, lineHeight: 21 }}>When courses are available, they will appear here from your Anatomia account.</Text></Card> : null}
      </>} renderItem={({ item }) => <Pressable onPress={() => router.push({ pathname: '/course/[id]', params: { id: item.id } })} style={({ pressed }) => [pressed && { opacity: 0.8 }]}><Card style={{ padding: 0, overflow: 'hidden' }}>
        {item.thumbnail_url ? <Image source={{ uri: item.thumbnail_url }} style={{ height: 150, width: '100%', backgroundColor: colors.brandSoft }} resizeMode="cover" /> : <View style={{ height: 122, backgroundColor: colors.brandSoft, justifyContent: 'center', paddingHorizontal: 18 }}><Text style={{ color: colors.brand, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{item.category.toUpperCase()}</Text><Text style={{ color: colors.brand, fontSize: 26, fontWeight: '700', marginTop: 8 }}>Anatomia</Text></View>}
        <View style={{ padding: 16, gap: 8 }}><Text style={{ color: colors.ink, fontSize: 18, fontWeight: '700' }}>{item.title}</Text><Text numberOfLines={2} style={{ color: colors.muted, fontSize: 14, lineHeight: 20 }}>{item.short_description || item.description}</Text><Text style={{ color: colors.brand, fontSize: 13, fontWeight: '700' }}>{item.is_free || !item.price ? 'Free' : `₦${Number(item.price).toLocaleString()}`}  ·  {item.level}  ·  {item.duration || 'Self-paced'}</Text></View>
      </Card></Pressable>} ListFooterComponent={<View style={{ marginTop: 18 }}><Button variant="secondary" onPress={async () => { await signOut(); router.replace('/sign-in'); }}>Sign out</Button></View>} />
  </Screen>;
}
