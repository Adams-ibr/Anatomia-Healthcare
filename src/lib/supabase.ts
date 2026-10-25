import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client with auth enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  }
})

// ============================================================================
// ADMIN USERS (auth.users table)
// Note: This requires service role access in production
// For user management in admin panel, consider using Supabase Auth Admin API
// ============================================================================

export const adminUsersApi = {
  // List all admin users - requires service role
  list: async () => {
    console.warn('adminUsersApi.list() requires service role key')
    return []
  },

  // Get user by ID - limited to current user or requires service role
  getById: async (id: string) => {
    console.warn('adminUsersApi.getById() requires service role key')
    return null
  },

  // Create admin user - use auth.signUp instead
  create: async (user: { email: string; password_hash: string; name: string; role?: string }) => {
    console.warn('adminUsersApi.create() should use auth.signUp()')
    throw new Error('Use auth.signUp() instead')
  },

  // Update admin user - limited to current user
  update: async (id: string, updates: Partial<{ name: string; role: string; is_active: boolean }>) => {
    console.warn('adminUsersApi.update() requires service role key')
    throw new Error('Not implemented')
  },

  // Delete admin user - requires service role
  delete: async (id: string) => {
    console.warn('adminUsersApi.delete() requires service role key')
    throw new Error('Not implemented')
  }
}

// ============================================================================
// MEMBERS (auth.users table - for user management, students/instructors)
// Note: For public instructor profiles, use teamApi (team_members table)
// ============================================================================

export const membersApi = {
  list: async (filters?: { search?: string; role?: string }) => {
    // For instructor role, use team_members table instead
    if (filters?.role === 'instructor') {
      return teamApi.list()
    }
    
    // For other roles, this would need auth.users access
    // which requires service role key, not available in client
    console.warn('membersApi.list() is not fully implemented for non-instructor roles')
    return []
  },

  getById: async (id: string) => {
    // Try team_members first
    try {
      const data = await teamApi.getById(id)
      return data
    } catch (err) {
      console.error('Member not found:', err)
      return null
    }
  },

  update: async (id: string, updates: any) => {
    // Update team member
    try {
      const data = await teamApi.update(id, updates)
      return data
    } catch (err) {
      console.error('Failed to update member:', err)
      throw err
    }
  }
}

// ============================================================================
// COURSES
// ============================================================================

export const coursesApi = {
  list: async (filters?: { search?: string; category?: string; status?: string; adminView?: boolean }) => {
    let query = supabase.from('courses').select('*')
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
    }
    // Only filter by category if it's not 'all' and has a value
    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category_id', filters.category)
    }
    // Admin view: support explicit status filter (all, draft, published, etc.)
    if (filters?.adminView) {
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }
      // No is_published filter for admin — they see everything
    } else if (filters?.status === 'published') {
      // Explicit published filter for public pages
      query = query.eq('is_published', true)
    } else if (!filters?.status) {
      // Default: public listing shows only published
      query = query.eq('is_published', true)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching courses:', error)
      throw error
    }
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_sections(*, lessons(*))')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  getBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_sections(*, lessons(*))')
      .eq('slug', slug)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (course: any) => {
    // Slugs are unique in the database. Use a UUID suffix and retry duplicate
    // key errors so simultaneous creates cannot fail on a slug collision.
    const baseSlug = (course.title || 'course')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'course'

    const payload: Record<string, any> = {
      title: course.title,
      category_id: course.category_id || course.category || course.categoryId,
      instructor_id: course.instructor_id || course.instructorId,
      level: course.level || 'Beginner',
      price: typeof course.price === 'number' ? course.price : (Number(course.price) || 0),
      duration: typeof course.duration === 'number' ? course.duration : (parseInt(course.duration, 10) || 0),
      has_certificate: course.has_certificate ?? course.hasCertificate ?? false,
      status: course.status || 'draft',
      description: course.description || ''
    }

    if (course.thumbnail) payload.thumbnail = course.thumbnail
    if (course.is_published !== undefined) payload.is_published = course.is_published
    const cleanedPayload = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined && v !== null)
    );
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const slug = `${baseSlug}-${crypto.randomUUID()}`
      const { data, error } = await supabase
        .from('courses')
        .insert({ ...cleanedPayload, slug })
        .select()
        .single()

      if (!error) return data
      if (error.code !== '23505' || attempt === 2) throw error
    }

    throw new Error('Could not create a course with a unique slug.')
  },

  update: async (id: string, updates: any) => {
    const payload: Record<string, any> = {}
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.slug !== undefined) payload.slug = updates.slug
    if (updates.category_id !== undefined || updates.category !== undefined || updates.categoryId !== undefined) {
      payload.category_id = updates.category_id ?? updates.category ?? updates.categoryId
    }
    if (updates.instructor_id !== undefined || updates.instructorId !== undefined) {
      payload.instructor_id = updates.instructor_id ?? updates.instructorId
    }
    if (updates.level !== undefined) payload.level = updates.level
    if (updates.price !== undefined) payload.price = typeof updates.price === 'number' ? updates.price : (Number(updates.price) || 0)
    if (updates.duration !== undefined) payload.duration = typeof updates.duration === 'number' ? updates.duration : (parseInt(updates.duration, 10) || 0)
    if (updates.has_certificate !== undefined || updates.hasCertificate !== undefined) {
      payload.has_certificate = updates.has_certificate ?? updates.hasCertificate
    }
    if (updates.status !== undefined) payload.status = updates.status
    if (updates.description !== undefined) payload.description = updates.description
    if (updates.thumbnail !== undefined) payload.thumbnail = updates.thumbnail
    if (updates.is_published !== undefined) payload.is_published = updates.is_published

    const { data, error } = await supabase
      .from('courses')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// ARTICLES
// ============================================================================

export const articlesApi = {
  list: async (filters?: { search?: string; category?: string; is_published?: boolean }) => {
    let query = supabase.from('articles').select('*')
    
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single()
    if (error) throw error
    return data
  },

  getBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single()
    if (error) throw error
    return data
  },

  create: async (article: any) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Please sign in again before creating an article')
    const isPublished = article.status !== undefined
      ? article.status === 'published'
      : Boolean(article.is_published)
    const { data, error } = await supabase
      .from('articles')
      .insert({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt ?? '',
        content: article.content ?? '',
        cover_image: article.cover_image ?? article.coverImage ?? null,
        author_id: user.id,
        category: article.category ?? article.categoryName ?? 'General',
        is_published: isPublished,
        published_at: isPublished ? (article.published_at ?? new Date().toISOString()) : null,
        tags: article.tags ?? []
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const isPublished = updates.status !== undefined
      ? updates.status === 'published'
      : updates.is_published
    const { data, error } = await supabase
      .from('articles')
      .update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.slug !== undefined ? { slug: updates.slug } : {}),
        ...(updates.excerpt !== undefined ? { excerpt: updates.excerpt } : {}),
        ...(updates.content !== undefined ? { content: updates.content } : {}),
        ...(updates.cover_image !== undefined || updates.coverImage !== undefined ? { cover_image: updates.cover_image ?? updates.coverImage } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(isPublished !== undefined ? {
          is_published: isPublished,
          published_at: isPublished ? (updates.published_at ?? new Date().toISOString()) : null
        } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('articles').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// CONTACT MESSAGES
// ============================================================================

export const contactsApi = {
  list: async (filters?: { status?: string; is_starred?: boolean }) => {
    let query = supabase.from('contact_messages').select('*')
    
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.is_starred !== undefined) {
      query = query.eq('is_starred', filters.is_starred)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('contact_messages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  create: async (contact: { name: string; email: string; phone?: string; topic?: string; subject?: string; message: string }) => {
    const { data, error } = await supabase
      .from('contact_messages')
      .insert({ ...contact, topic: contact.topic ?? contact.subject ?? '', subject: contact.subject ?? contact.topic ?? '' })
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('contact_messages').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// FAQ
// ============================================================================

export const faqApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('faq_items')
      .select('*')
      .order('order', { ascending: true })
    
    if (error) throw error
    return data
  },

  create: async (faq: any) => {
    const { data: rows, error: orderError } = await supabase
      .from('faq_items')
      .select('order')
      .order('order', { ascending: false })
      .limit(1)
    if (orderError) throw orderError
    const { data, error } = await supabase
      .from('faq_items')
      .insert({
        question: faq.question,
        answer: faq.answer,
        category: faq.category ?? 'General',
        is_active: faq.isPublished ?? faq.is_active ?? true,
        order: faq.order ?? ((rows?.[0]?.order ?? -1) + 1)
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const payload = {
      ...(updates.question !== undefined ? { question: updates.question } : {}),
      ...(updates.answer !== undefined ? { answer: updates.answer } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.order !== undefined ? { order: updates.order } : {}),
      ...(updates.isPublished !== undefined || updates.is_active !== undefined
        ? { is_active: updates.isPublished ?? updates.is_active }
        : {}),
      updated_at: new Date().toISOString()
    }
    const { data, error } = await supabase
      .from('faq_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('faq_items').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// TEAM MEMBERS
// ============================================================================

export const teamApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .order('order', { ascending: true })
    
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (member: any) => {
    const { data, error } = await supabase
      .from('team_members')
      .insert(member)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('team_members')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('team_members').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// DEPARTMENTS
// ============================================================================

export const departmentsApi = {
  list: async (filters?: { is_active?: boolean }) => {
    let query = supabase.from('departments').select('*')
    
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (department: any) => {
    const { data, error } = await supabase
      .from('departments')
      .insert(department)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('departments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('departments').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// PRODUCTS
// ============================================================================

export const productsApi = {
  list: async (filters?: { category?: string; is_active?: boolean }) => {
    let query = supabase.from('products').select('*')
    
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (product: any) => {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// GALLERY
// ============================================================================

export const galleryApi = {
  list: async (filters?: { category?: string; is_published?: boolean }) => {
    let query = supabase.from('gallery_items').select('*')
    
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (item: any) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Please sign in again before uploading a gallery photo')
    if (!item.imageFile && !item.image_url) throw new Error('Choose an image to upload')

    let uploadedPath: string | null = null
    let imageUrl = item.image_url as string | undefined
    if (item.imageFile) {
      const file = item.imageFile as File
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-') || 'image'
      uploadedPath = `${user.id}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(uploadedPath, file, { contentType: file.type || undefined, upsert: false })
      if (uploadError) throw uploadError
      imageUrl = supabase.storage.from('gallery-images').getPublicUrl(uploadedPath).data.publicUrl
    }
    if (!imageUrl) throw new Error('The image upload did not return a public URL')

    const { data, error } = await supabase
      .from('gallery_items')
      .insert({
        title: item.title,
        description: item.description ?? '',
        category: item.category ?? 'General',
        image_url: imageUrl,
        uploaded_by: user.id,
        is_published: item.isPublished ?? item.is_published ?? true,
        tags: item.tags ?? [],
        view_count: 0
      })
      .select()
      .single()
    if (error) {
      if (uploadedPath) await supabase.storage.from('gallery-images').remove([uploadedPath])
      throw error
    }
    return data
  },

  update: async (id: string, updates: any) => {
    let uploadedPath: string | null = null
    let previousImageUrl: string | null = null
    const payload: Record<string, unknown> = {
      ...(updates.title !== undefined ? { title: updates.title } : {}),
      ...(updates.description !== undefined ? { description: updates.description } : {}),
      ...(updates.category !== undefined ? { category: updates.category } : {}),
      ...(updates.isPublished !== undefined || updates.is_published !== undefined ? { is_published: updates.isPublished ?? updates.is_published } : {}),
      ...(updates.tags !== undefined ? { tags: updates.tags } : {}),
      updated_at: new Date().toISOString()
    }
    if (updates.imageFile) {
      const { data: previous, error: previousError } = await supabase
        .from('gallery_items')
        .select('image_url')
        .eq('id', id)
        .single()
      if (previousError) throw previousError
      previousImageUrl = previous.image_url
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      if (!user) throw new Error('Please sign in again before changing a gallery photo')
      const file = updates.imageFile as File
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-') || 'image'
      uploadedPath = `${user.id}/${crypto.randomUUID()}-${safeName}`
      const { error: uploadError } = await supabase.storage
        .from('gallery-images')
        .upload(uploadedPath, file, { contentType: file.type || undefined, upsert: false })
      if (uploadError) throw uploadError
      payload.image_url = supabase.storage.from('gallery-images').getPublicUrl(uploadedPath).data.publicUrl
    }
    const { data, error } = await supabase
      .from('gallery_items')
      .update(payload)
      .eq('id', id)
      .select()
      .single()
    if (error) {
      if (uploadedPath) await supabase.storage.from('gallery-images').remove([uploadedPath])
      throw error
    }
    const previousPath = galleryStoragePath(previousImageUrl)
    if (uploadedPath && previousPath) await supabase.storage.from('gallery-images').remove([previousPath])
    return data
  },

  delete: async (id: string) => {
    const { data: item, error: fetchError } = await supabase
      .from('gallery_items')
      .select('image_url')
      .eq('id', id)
      .single()
    if (fetchError) throw fetchError
    const { error } = await supabase.from('gallery_items').delete().eq('id', id)
    if (error) throw error
    const path = galleryStoragePath(item.image_url)
    if (path) await supabase.storage.from('gallery-images').remove([path])
  }
}

function galleryStoragePath(imageUrl?: string | null) {
  if (!imageUrl) return null
  const marker = '/storage/v1/object/public/gallery-images/'
  const markerIndex = imageUrl.indexOf(marker)
  if (markerIndex < 0) return null
  const path = imageUrl.slice(markerIndex + marker.length).split('?')[0]
  try { return decodeURIComponent(path) } catch { return path }
}

// ============================================================================
// PARTNERS
// ============================================================================

export const partnersApi = {
  list: async (filters?: { is_active?: boolean; type?: string; status?: string }) => {
    let query = supabase.from('partners').select('*')
    
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('partners')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (partner: any) => {
    const { data, error } = await supabase
      .from('partners')
      .insert(partner)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('partners')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('partners').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// CAREERS (Job Postings)
// ============================================================================

export const careersApi = {
  list: async (filters?: { is_active?: boolean; status?: string; type?: string }) => {
    let query = supabase.from('careers').select('*')
    
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    if (filters?.type) {
      query = query.eq('type', filters.type)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('careers')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (job: any) => {
    const { data, error } = await supabase
      .from('careers')
      .insert(job)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('careers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('careers').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// JOB APPLICATIONS
// ============================================================================

export const applicationsApi = {
  list: async (filters?: { job_id?: string; status?: string }) => {
    let query = supabase.from('job_applications').select('*, careers(title)')
    
    if (filters?.job_id) {
      query = query.eq('job_id', filters.job_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*, careers(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (application: { job_id: string; name: string; email: string; phone: string; location: string; experience: number; cover_letter: string; portfolio_url?: string | null; resume_url?: string | null; start_date: string }) => {
    const { data, error } = await supabase
      .from('job_applications')
      .insert({ ...application, status: 'pending' })
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('job_applications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('job_applications').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// NEWSLETTER SUBSCRIPTIONS
// ============================================================================

export const newsletterApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  create: async (email: string) => {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email: email.trim().toLowerCase() })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('newsletter_subscriptions').delete().eq('id', id)
    if (error) throw error
  },

  deleteByEmail: async (email: string) => {
    const { error } = await supabase.from('newsletter_subscriptions').delete().eq('email', email)
    if (error) throw error
  }
}

// ============================================================================
// CATEGORIES
// ============================================================================

export const categoriesApi = {
  list: async (filters?: { is_active?: boolean }) => {
    let query = supabase.from('categories').select('*')

    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }

    const { data, error } = await query.order('name', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (category: any) => {
    const slug = category.slug?.trim() || (category.name || 'category')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    const { data, error } = await supabase
      .from('categories')
      .insert({ ...category, slug: slug || 'category' })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// COURSE MODULES
// ============================================================================

export const modulesApi = {
  list: async (courseId?: string) => {
    let query = (supabase as any).from('course_sections').select('*')
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    const { data, error } = await query.order('position', { ascending: true })
    if (error) throw error
    return (data ?? []).map((section: any) => ({
      ...section,
      order: section.position,
      description: null,
      is_published: true,
      created_at: null
    }))
  },

  getById: async (id: string) => {
    const { data, error } = await (supabase as any)
      .from('course_sections')
      .select('*, lessons(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return { ...data, order: data.position, description: null, is_published: true, created_at: null }
  },

  create: async (module: any) => {
    const { data, error } = await (supabase as any)
      .from('course_sections')
      .insert({ course_id: module.course_id, title: module.title, position: module.order ?? module.position ?? 0 })
      .select()
      .single()
    
    if (error) throw error
    return { ...data, order: data.position, description: null, is_published: true, created_at: null }
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await (supabase as any)
      .from('course_sections')
      .update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.order !== undefined || updates.position !== undefined ? { position: updates.order ?? updates.position } : {})
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { ...data, order: data.position, description: null, is_published: true, created_at: null }
  },

  delete: async (id: string) => {
    const { error } = await (supabase as any).from('course_sections').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// LESSONS
// ============================================================================

export const lessonsApi = {
  list: async (filters?: { module_id?: string }) => {
    let query = (supabase as any).from('lessons').select('*')
    
    if (filters?.module_id) {
      query = query.eq('section_id', filters.module_id)
    }
    
    const { data, error } = await query.order('position', { ascending: true })
    if (error) throw error
    return (data ?? []).map((lesson: any) => ({
      ...lesson,
      module_id: lesson.section_id,
      content_type: lesson.type,
      order: lesson.position,
      description: null,
      is_free: false,
      is_published: true,
      created_at: null,
      updated_at: null
    }))
  },

  getById: async (id: string) => {
    const { data, error } = await (supabase as any)
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return {
      ...data,
      module_id: data.section_id,
      content_type: data.type,
      order: data.position,
      description: null,
      is_free: false,
      is_published: true,
      created_at: null,
      updated_at: null
    }
  },

  create: async (lesson: any) => {
    const { data, error } = await (supabase as any)
      .from('lessons')
      .insert({
        section_id: lesson.module_id ?? lesson.section_id,
        title: lesson.title,
        type: lesson.content_type ?? lesson.type ?? 'video',
        duration: lesson.duration ?? 0,
        content: lesson.content ?? '',
        video_url: lesson.video_url || null,
        position: lesson.order ?? lesson.position ?? 0
      })
      .select()
      .single()
    
    if (error) throw error
    return { ...data, module_id: data.section_id, content_type: data.type, order: data.position, description: null, is_free: false, is_published: true, created_at: null, updated_at: null }
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await (supabase as any)
      .from('lessons')
      .update({
        ...(updates.title !== undefined ? { title: updates.title } : {}),
        ...(updates.content_type !== undefined || updates.type !== undefined ? { type: updates.content_type ?? updates.type } : {}),
        ...(updates.duration !== undefined ? { duration: updates.duration } : {}),
        ...(updates.content !== undefined ? { content: updates.content ?? '' } : {}),
        ...(updates.video_url !== undefined ? { video_url: updates.video_url || null } : {}),
        ...(updates.order !== undefined || updates.position !== undefined ? { position: updates.order ?? updates.position } : {}),
        ...(updates.module_id !== undefined || updates.section_id !== undefined ? { section_id: updates.module_id ?? updates.section_id } : {})
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return { ...data, module_id: data.section_id, content_type: data.type, order: data.position, description: null, is_free: false, is_published: true, created_at: null, updated_at: null }
  },

  delete: async (id: string) => {
    const { error } = await (supabase as any).from('lessons').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// COURSE EDITOR
// ============================================================================

export const courseStudioApi = {
  getFull: async (id: string) => {
    const db = supabase as any
    const [courseResult, sectionsResult, objectivesResult, requirementsResult, faqsResult, assessmentsResult] = await Promise.all([
      db.from('courses').select('*').eq('id', id).single(),
      db.from('course_sections').select('*, lessons(*)').eq('course_id', id).order('position', { ascending: true }),
      db.from('course_objectives').select('*').eq('course_id', id).order('position', { ascending: true }),
      db.from('course_requirements').select('*').eq('course_id', id).order('position', { ascending: true }),
      db.from('course_faqs').select('*').eq('course_id', id),
      db.from('assessments').select('*, assessment_questions(*)').eq('course_id', id)
    ])
    for (const result of [courseResult, sectionsResult, objectivesResult, requirementsResult, faqsResult, assessmentsResult]) {
      if (result.error) throw result.error
    }
    const course = courseResult.data
    return {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle ?? '',
      description: course.description ?? '',
      longDescription: course.long_description ?? '',
      categoryId: course.category_id,
      instructorId: course.instructor_id,
      thumbnail: course.thumbnail ?? '',
      price: Number(course.price ?? 0),
      discountPrice: course.discount_price == null ? undefined : Number(course.discount_price),
      rating: Number(course.rating ?? 0),
      reviewCount: course.review_count ?? 0,
      studentCount: course.student_count ?? 0,
      duration: course.duration ?? 0,
      level: course.level,
      language: course.language ?? 'English',
      lastUpdated: course.last_updated,
      hasCertificate: course.has_certificate ?? false,
      isFeatured: course.is_featured ?? false,
      isTrending: course.is_trending ?? false,
      isNew: course.is_new ?? false,
      status: course.status,
      createdAt: course.created_at,
      objectives: (objectivesResult.data ?? []).map((row: any) => row.text),
      requirements: (requirementsResult.data ?? []).map((row: any) => row.text),
      sections: (sectionsResult.data ?? []).map((section: any) => ({
        id: section.id,
        title: section.title,
        lessons: (section.lessons ?? []).sort((a: any, b: any) => a.position - b.position).map((lesson: any) => ({
          id: lesson.id,
          title: lesson.title,
          type: lesson.type,
          duration: lesson.duration ?? 0,
          content: lesson.content ?? '',
          videoUrl: lesson.video_url ?? undefined,
          resourceUrl: lesson.resource_url ?? undefined
        }))
      })),
      assessments: (assessmentsResult.data ?? []).map((assessment: any) => ({
        id: assessment.id,
        title: assessment.title,
        description: assessment.description ?? '',
        timeLimit: assessment.time_limit,
        passingScore: assessment.passing_score,
        retakeLimit: assessment.retake_limit,
        questions: (assessment.assessment_questions ?? []).sort((a: any, b: any) => a.position - b.position).map((question: any) => ({
          id: question.id,
          type: question.type,
          question: question.question,
          options: question.options ?? [],
          answer: question.answer ?? '',
          explanation: question.explanation ?? ''
        }))
      })),
      faqs: (faqsResult.data ?? []).map((faq: any) => ({ q: faq.question, a: faq.answer }))
    }
  },

  create: async (input: any) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Please sign in again before creating a course')
    const title = input.title?.trim() || 'Untitled course'
    const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'course'}-${crypto.randomUUID()}`
    const { data, error } = await (supabase as any).from('courses').insert({
      slug,
      title,
      subtitle: input.subtitle ?? '',
      description: input.description ?? '',
      long_description: input.longDescription ?? '',
      category_id: input.categoryId,
      instructor_id: input.instructorId ?? user.id,
      thumbnail: input.thumbnail || null,
      price: input.price ?? 0,
      discount_price: input.discountPrice ?? null,
      level: input.level ?? 'Beginner',
      language: input.language ?? 'English',
      duration: input.duration ?? 0,
      has_certificate: input.hasCertificate ?? false,
      status: input.status ?? 'draft',
      is_published: input.status === 'published'
    }).select('id').single()
    if (error) throw error
    return data.id as string
  },

  saveContent: async (id: string, content: any) => {
    const db = supabase as any
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Please sign in again before saving this course')

    const { error: courseError } = await db.from('courses').update({
      title: content.title,
      subtitle: content.subtitle ?? '',
      description: content.description ?? '',
      long_description: content.longDescription ?? '',
      category_id: content.categoryId,
      level: content.level,
      language: content.language ?? 'English',
      thumbnail: content.thumbnail || null,
      price: content.price ?? 0,
      discount_price: content.discountPrice ?? null,
      duration: content.sections?.reduce((total: number, section: any) => total + (section.lessons ?? []).reduce((sum: number, lesson: any) => sum + (lesson.duration ?? 0), 0), 0) ?? 0,
      has_certificate: content.hasCertificate ?? false,
      status: content.status ?? 'draft',
      is_published: content.status === 'published',
      last_updated: new Date().toISOString()
    }).eq('id', id)
    if (courseError) throw courseError

    const { data: oldSections, error: oldSectionsError } = await db.from('course_sections').select('id').eq('course_id', id)
    if (oldSectionsError) throw oldSectionsError
    const sectionIds = (oldSections ?? []).map((row: any) => row.id)
    if (sectionIds.length) {
      const { error } = await db.from('lessons').delete().in('section_id', sectionIds)
      if (error) throw error
    }
    const { error: deleteSectionsError } = await db.from('course_sections').delete().eq('course_id', id)
    if (deleteSectionsError) throw deleteSectionsError

    const { data: oldAssessments, error: oldAssessmentsError } = await db.from('assessments').select('id').eq('course_id', id)
    if (oldAssessmentsError) throw oldAssessmentsError
    const assessmentIds = (oldAssessments ?? []).map((row: any) => row.id)
    if (assessmentIds.length) {
      const { error } = await db.from('assessment_questions').delete().in('assessment_id', assessmentIds)
      if (error) throw error
    }
    const { error: deleteAssessmentsError } = await db.from('assessments').delete().eq('course_id', id)
    if (deleteAssessmentsError) throw deleteAssessmentsError

    for (const table of ['course_objectives', 'course_requirements', 'course_faqs']) {
      const { error } = await db.from(table).delete().eq('course_id', id)
      if (error) throw error
    }

    for (const [position, text] of (content.objectives ?? []).entries()) {
      const { error } = await db.from('course_objectives').insert({ course_id: id, text, position })
      if (error) throw error
    }
    for (const [position, text] of (content.requirements ?? []).entries()) {
      const { error } = await db.from('course_requirements').insert({ course_id: id, text, position })
      if (error) throw error
    }
    for (const [position, section] of (content.sections ?? []).entries()) {
      const { data: savedSection, error } = await db.from('course_sections').insert({ course_id: id, title: section.title, position }).select('id').single()
      if (error) throw error
      const lessons = (section.lessons ?? []).map((lesson: any, lessonPosition: number) => ({
        section_id: savedSection.id,
        title: lesson.title,
        type: lesson.type ?? 'video',
        duration: lesson.duration ?? 0,
        content: lesson.content ?? '',
        video_url: lesson.videoUrl || null,
        resource_url: lesson.resourceUrl || null,
        position: lessonPosition
      }))
      if (lessons.length) {
        const { error: lessonsError } = await db.from('lessons').insert(lessons)
        if (lessonsError) throw lessonsError
      }
    }
    for (const faq of (content.faqs ?? []).filter((row: any) => row.q || row.a)) {
      const { error } = await db.from('course_faqs').insert({ course_id: id, question: faq.q || '', answer: faq.a || '' })
      if (error) throw error
    }
    for (const assessment of content.assessments ?? []) {
      const { data: savedAssessment, error } = await db.from('assessments').insert({
        course_id: id,
        title: assessment.title || 'Assessment',
        description: assessment.description ?? '',
        time_limit: assessment.timeLimit ?? 30,
        passing_score: assessment.passingScore ?? 60,
        retake_limit: assessment.retakeLimit ?? 3
      }).select('id').single()
      if (error) throw error
      const questions = (assessment.questions ?? []).map((question: any, position: number) => ({
        assessment_id: savedAssessment.id,
        type: question.type ?? 'mc',
        question: question.question || 'Question',
        options: question.options ?? [],
        answer: question.answer ?? '',
        explanation: question.explanation ?? '',
        position
      }))
      if (questions.length) {
        const { error: questionsError } = await db.from('assessment_questions').insert(questions)
        if (questionsError) throw questionsError
      }
    }
  }
}


// ============================================================================
// ANATOMY MODELS
// ============================================================================

export const anatomyModelsApi = {
  list: async (filters?: { category?: string; body_system?: string; is_published?: boolean }) => {
    let query = supabase.from('anatomy_models').select('*')
    
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.body_system) {
      query = query.eq('body_system', filters.body_system)
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('anatomy_models')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (model: any) => {
    const { data, error } = await supabase
      .from('anatomy_models')
      .insert(model)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('anatomy_models')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('anatomy_models').delete().eq('id', id)
    if (error) throw error
  },

  uploadAsset: async (file: File, path: string) => {
    const { error } = await supabase.storage
      .from('anatomy-models')
      .upload(path, file, { cacheControl: '3600', upsert: false })
    if (error) throw error
    const { data } = supabase.storage.from('anatomy-models').getPublicUrl(path)
    return data.publicUrl
  },

  removeAssets: async (urls: Array<string | null | undefined>) => {
    const paths = urls.flatMap((url) => {
      if (!url) return []
      const marker = '/storage/v1/object/public/anatomy-models/'
      const index = url.indexOf(marker)
      return index >= 0 ? [decodeURIComponent(url.slice(index + marker.length))] : []
    })
    if (!paths.length) return
    const { error } = await supabase.storage.from('anatomy-models').remove(paths)
    if (error) throw error
  }
}

// ============================================================================
// FLASHCARD DECKS
// ============================================================================

export const flashcardDecksApi = {
  list: async (filters?: { course_id?: string; is_published?: boolean }) => {
    let query = supabase.from('flashcard_decks').select('*, flashcards(count)')
    
    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id)
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .select('*, flashcards(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (deck: any) => {
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError) throw userError
    if (!user) throw new Error('Please sign in again before creating a flashcard deck')

    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert({
        user_id: user.id,
        title: deck.name ?? deck.title,
        description: deck.description ?? '',
        category: deck.category ?? 'General',
        is_published: deck.is_published ?? false,
        ...(deck.course_id ? { course_id: deck.course_id } : {})
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .update({
        ...(updates.name !== undefined || updates.title !== undefined ? { title: updates.name ?? updates.title } : {}),
        ...(updates.description !== undefined ? { description: updates.description } : {}),
        ...(updates.category !== undefined ? { category: updates.category } : {}),
        ...(updates.is_published !== undefined ? { is_published: updates.is_published } : {}),
        ...(updates.course_id !== undefined ? { course_id: updates.course_id } : {})
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// FLASHCARDS
// ============================================================================

export const flashcardsApi = {
  list: async (deckId?: string) => {
    let query = supabase.from('flashcards').select('*')
    
    if (deckId) {
      query = query.eq('deck_id', deckId)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (flashcard: any) => {
    const { data, error } = await supabase
      .from('flashcards')
      .insert({
        deck_id: flashcard.deck_id ?? flashcard.deckId,
        front: flashcard.front,
        back: flashcard.back,
        card_type: flashcard.card_type ?? flashcard.type ?? 'learning',
        image_url: flashcard.image_url ?? flashcard.imageUrl ?? null,
        options: flashcard.options ?? null,
        correct_answer: flashcard.correct_answer ?? flashcard.correctAnswer ?? null,
        explanation: flashcard.explanation ?? null,
        order: flashcard.order ?? 0
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('flashcards')
      .update({
        ...(updates.front !== undefined ? { front: updates.front } : {}),
        ...(updates.back !== undefined ? { back: updates.back } : {}),
        ...(updates.type !== undefined || updates.card_type !== undefined ? { card_type: updates.type ?? updates.card_type } : {}),
        ...(updates.imageUrl !== undefined || updates.image_url !== undefined ? { image_url: updates.imageUrl ?? updates.image_url ?? null } : {}),
        ...(updates.options !== undefined ? { options: updates.options } : {}),
        ...(updates.correctAnswer !== undefined || updates.correct_answer !== undefined ? { correct_answer: updates.correctAnswer ?? updates.correct_answer ?? null } : {}),
        ...(updates.explanation !== undefined ? { explanation: updates.explanation } : {}),
        ...(updates.order !== undefined ? { order: updates.order } : {})
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('flashcards').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// QUESTION BANK
// ============================================================================

export const questionBankApi = {
  list: async (filters?: { topic_id?: string; difficulty?: string; is_active?: boolean }) => {
    let query = supabase.from('question_bank').select('*, question_bank_options(*), question_topic_links(topic_id)')
    
    if (filters?.topic_id) {
      query = query.eq('topic_id', filters.topic_id)
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty', filters.difficulty)
    }
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('question_bank')
      .select('*, question_bank_options(*), question_topic_links(topic_id)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (question: any) => {
    const topicIds: string[] = question.topicIds ?? question.topic_ids ?? []
    const { data, error } = await supabase
      .from('question_bank')
      .insert({
        question: question.question,
        question_type: question.type === 'true-false' ? 'truefalse' : 'mc',
        difficulty: question.difficulty ?? 'medium',
        explanation: question.explanation ?? '',
        points: question.points ?? 1,
        is_active: question.isActive ?? question.is_active ?? true,
        topic_id: topicIds[0] ?? null,
        tags: topicIds
      })
      .select()
      .single()
    
    if (error) throw error
    try {
      await replaceQuestionChildren(data.id, question.options ?? [], topicIds)
    } catch (childError) {
      await supabase.from('question_bank').delete().eq('id', data.id)
      throw childError
    }
    return data
  },

  update: async (id: string, updates: any) => {
    const topicIds: string[] | undefined = updates.topicIds ?? updates.topic_ids
    const { data, error } = await supabase
      .from('question_bank')
      .update({
        ...(updates.question !== undefined ? { question: updates.question } : {}),
        ...(updates.type !== undefined ? { question_type: updates.type === 'true-false' ? 'truefalse' : 'mc' } : {}),
        ...(updates.difficulty !== undefined ? { difficulty: updates.difficulty } : {}),
        ...(updates.explanation !== undefined ? { explanation: updates.explanation } : {}),
        ...(updates.points !== undefined ? { points: updates.points } : {}),
        ...(updates.isActive !== undefined ? { is_active: updates.isActive } : {}),
        ...(topicIds !== undefined ? { topic_id: topicIds[0] ?? null, tags: topicIds } : {}),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    if (updates.options !== undefined || topicIds !== undefined) {
      const { error: optionsDeleteError } = await supabase.from('question_bank_options').delete().eq('question_id', id)
      if (optionsDeleteError) throw optionsDeleteError
      const { error: topicsDeleteError } = await supabase.from('question_topic_links').delete().eq('question_id', id)
      if (topicsDeleteError) throw topicsDeleteError
      await replaceQuestionChildren(id, updates.options ?? [], topicIds ?? [])
    }
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('question_bank').delete().eq('id', id)
    if (error) throw error
  }
}

async function replaceQuestionChildren(questionId: string, options: any[], topicIds: string[]) {
  const normalizedOptions = options.map((option, index) => ({
    option_text: option.text,
    is_correct: Boolean(option.isCorrect),
    order: index
  }))
  if (normalizedOptions.length) {
    const { error } = await supabase.from('question_bank_options').insert(
      normalizedOptions.map(option => ({ ...option, question_id: questionId }))
    )
    if (error) throw error
  }
  if (topicIds.length) {
    const { error } = await supabase.from('question_topic_links').insert(
      [...new Set(topicIds)].map(topic_id => ({ question_id: questionId, topic_id }))
    )
    if (error) {
      await supabase.from('question_bank_options').delete().eq('question_id', questionId)
      throw error
    }
  }
}

// ============================================================================
// QUESTION TOPICS
// ============================================================================

export const questionTopicsApi = {
  list: async () => {
    const { data, error } = await supabase
      .from('question_topics')
      .select('*')
      .order('order', { ascending: true })
    if (error) throw error
    return data
  },

  create: async (topic: { name: string; slug: string; description?: string; category?: string }) => {
    const { data, error } = await supabase
      .from('question_topics')
      .insert(topic)
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id: string, updates: { name?: string; slug?: string; description?: string; category?: string }) => {
    const { data, error } = await supabase
      .from('question_topics')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('question_topics').delete().eq('id', id)
    if (error) throw error
  }
}



export const enrollmentsApi = {
  list: async (filters?: { member_id?: string; course_id?: string; status?: string }) => {
    let query = supabase.from('enrollments').select('*, courses(*)')
    
    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }
    if (filters?.course_id) {
      query = query.eq('course_id', filters.course_id)
    }
    if (filters?.status) {
      query = query.eq('status', filters.status)
    }
    
    const { data, error } = await query.order('enrolled_at', { ascending: false })
    if (error) {
      console.error('Error fetching enrollments:', error)
      throw error
    }
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (enrollment: any) => {
    const { data, error } = await supabase
      .from('enrollments')
      .insert(enrollment)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating enrollment:', error)
      throw error
    }
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('enrollments')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  updateProgress: async (memberId: string, courseId: string, progress: number) => {
    const { data, error } = await supabase
      .from('enrollments')
      .update({ progress })
      .eq('member_id', memberId)
      .eq('course_id', courseId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('enrollments').delete().eq('id', id)
    if (error) throw error
  }
}


// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notificationsApi = {
  list: async (filters?: { user_id?: string; is_read?: boolean }) => {
    let query = supabase.from('notifications').select('*')
    
    if (filters?.user_id) {
      query = query.eq('user_id', filters.user_id)
    }
    if (filters?.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  markAsRead: async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
    
    if (error) throw error
  },

  markAllAsRead: async (userId?: string) => {
    let query = supabase.from('notifications').update({ is_read: true })
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { error } = await query
    if (error) throw error
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('notifications').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// PLATFORM SETTINGS
// ============================================================================

export interface PlatformSettingsData {
  platformName: string
  supportEmail: string
  defaultCurrency: string
  instructorShare: number
  primaryColor: string
  tagline: string
  refundWindowDays: number
  passingScore: number
  welcomeEmail: boolean
  completionEmail: boolean
  assignmentReminders: boolean
  weeklyDigest: boolean
  paymentProvider: string
  paystackPublicKey?: string
  updatedAt?: string
}

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettingsData = {
  platformName: 'Anatomia Healthcare',
  supportEmail: 'support@anatomia.co',
  defaultCurrency: 'USD',
  instructorShare: 70,
  primaryColor: '#0D9488',
  tagline: 'Advancing Healthcare Education',
  refundWindowDays: 14,
  passingScore: 75,
  welcomeEmail: true,
  completionEmail: true,
  assignmentReminders: true,
  weeklyDigest: true,
  paymentProvider: 'paystack',
  paystackPublicKey: (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_PAYSTACK_PUBLIC_KEY) || ''
}

export const settingsApi = {
  get: async (): Promise<PlatformSettingsData> => {
    try {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('anatomia:settings') : null
      let localData: Partial<PlatformSettingsData> = {}
      if (cached) {
        try { localData = JSON.parse(cached) } catch {}
      }

      if (error || !data) {
        return { ...DEFAULT_PLATFORM_SETTINGS, ...localData }
      }

      return {
        platformName: data.platform_name || localData.platformName || DEFAULT_PLATFORM_SETTINGS.platformName,
        supportEmail: data.support_email || localData.supportEmail || DEFAULT_PLATFORM_SETTINGS.supportEmail,
        defaultCurrency: data.default_currency || localData.defaultCurrency || DEFAULT_PLATFORM_SETTINGS.defaultCurrency,
        instructorShare: data.instructor_share ?? localData.instructorShare ?? DEFAULT_PLATFORM_SETTINGS.instructorShare,
        primaryColor: data.primary_color || localData.primaryColor || DEFAULT_PLATFORM_SETTINGS.primaryColor,
        tagline: data.tagline ?? localData.tagline ?? DEFAULT_PLATFORM_SETTINGS.tagline,
        refundWindowDays: data.refund_window_days ?? localData.refundWindowDays ?? DEFAULT_PLATFORM_SETTINGS.refundWindowDays,
        passingScore: data.passing_score ?? localData.passingScore ?? DEFAULT_PLATFORM_SETTINGS.passingScore,
        welcomeEmail: data.welcome_email ?? localData.welcomeEmail ?? DEFAULT_PLATFORM_SETTINGS.welcomeEmail,
        completionEmail: data.completion_email ?? localData.completionEmail ?? DEFAULT_PLATFORM_SETTINGS.completionEmail,
        assignmentReminders: data.assignment_reminders ?? localData.assignmentReminders ?? DEFAULT_PLATFORM_SETTINGS.assignmentReminders,
        weeklyDigest: data.weekly_digest ?? localData.weeklyDigest ?? DEFAULT_PLATFORM_SETTINGS.weeklyDigest,
        paymentProvider: 'paystack',
        paystackPublicKey: localData.paystackPublicKey || DEFAULT_PLATFORM_SETTINGS.paystackPublicKey,
        updatedAt: data.updated_at
      }
    } catch {
      const cached = typeof localStorage !== 'undefined' ? localStorage.getItem('anatomia:settings') : null
      let localData: Partial<PlatformSettingsData> = {}
      if (cached) {
        try { localData = JSON.parse(cached) } catch {}
      }
      return { ...DEFAULT_PLATFORM_SETTINGS, ...localData }
    }
  },

  update: async (updates: Partial<PlatformSettingsData>): Promise<PlatformSettingsData> => {
    const dbPayload: Record<string, any> = {
      updated_at: new Date().toISOString()
    }
    if (updates.platformName !== undefined) dbPayload.platform_name = updates.platformName
    if (updates.supportEmail !== undefined) dbPayload.support_email = updates.supportEmail
    if (updates.defaultCurrency !== undefined) dbPayload.default_currency = updates.defaultCurrency
    if (updates.instructorShare !== undefined) dbPayload.instructor_share = Number(updates.instructorShare)
    if (updates.primaryColor !== undefined) dbPayload.primary_color = updates.primaryColor
    if (updates.tagline !== undefined) dbPayload.tagline = updates.tagline
    if (updates.refundWindowDays !== undefined) dbPayload.refund_window_days = Number(updates.refundWindowDays)
    if (updates.passingScore !== undefined) dbPayload.passing_score = Number(updates.passingScore)
    if (updates.welcomeEmail !== undefined) dbPayload.welcome_email = Boolean(updates.welcomeEmail)
    if (updates.completionEmail !== undefined) dbPayload.completion_email = Boolean(updates.completionEmail)
    if (updates.assignmentReminders !== undefined) dbPayload.assignment_reminders = Boolean(updates.assignmentReminders)
    if (updates.weeklyDigest !== undefined) dbPayload.weekly_digest = Boolean(updates.weeklyDigest)

    try {
      await supabase
        .from('platform_settings')
        .upsert({ id: true, ...dbPayload })
    } catch (err) {
      console.warn('Could not persist settings to Supabase, saving locally:', err)
    }

    const current = await settingsApi.get()
    const merged = { ...current, ...updates, updatedAt: new Date().toISOString() }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('anatomia:settings', JSON.stringify(merged))
    }
    return merged
  }
}

// Export all APIs as a single object for convenience
export const api = {
  users: adminUsersApi,
  members: membersApi,
  courses: coursesApi,
  categories: categoriesApi,
  modules: modulesApi,
  lessons: lessonsApi,
  articles: articlesApi,
  contacts: contactsApi,
  faq: faqApi,
  team: teamApi,
  departments: departmentsApi,
  products: productsApi,
  gallery: galleryApi,
  partners: partnersApi,
  careers: careersApi,
  applications: applicationsApi,
  newsletter: newsletterApi,
  anatomyModels: anatomyModelsApi,
  flashcardDecks: flashcardDecksApi,
  flashcards: flashcardsApi,
  questionBank: questionBankApi,
  enrollments: enrollmentsApi,
  notifications: notificationsApi,
  settings: settingsApi
}
