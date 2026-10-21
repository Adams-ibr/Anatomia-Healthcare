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
      query = query.eq('category', filters.category)
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
      .select('*, course_modules(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  getBySlug: async (slug: string) => {
    const { data, error } = await supabase
      .from('courses')
      .select('*, course_modules(*)')
      .eq('slug', slug)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (course: any) => {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('courses')
      .update(updates) // remove updated_at if not in schema (courses table has last_updated)
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
    const { data, error } = await supabase
      .from('articles')
      .insert(article)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('articles')
      .update({ ...updates, updated_at: new Date().toISOString() })
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
    const { data, error } = await supabase
      .from('faq_items')
      .insert(faq)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('faq_items')
      .update(updates)
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
    const { data, error } = await supabase
      .from('gallery_items')
      .insert(item)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('gallery_items')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('gallery_items').delete().eq('id', id)
    if (error) throw error
  }
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
    let query = supabase.from('job_applications').select('*')
    
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
      .insert({ email })
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
    let query = supabase.from('course_categories').select('*')
    
    // There is no is_active column on categories table
    const { data, error } = await query.order('name', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('course_categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (category: any) => {
    const { data, error } = await supabase
      .from('course_categories')
      .insert(category)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('course_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('course_categories').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// COURSE MODULES
// ============================================================================

export const modulesApi = {
  list: async (courseId?: string) => {
    let query = supabase.from('course_modules').select('*')
    
    if (courseId) {
      query = query.eq('course_id', courseId)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('course_modules')
      .select('*, lessons(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (module: any) => {
    const { data, error } = await supabase
      .from('course_modules')
      .insert(module)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('course_modules').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// LESSONS
// ============================================================================

export const lessonsApi = {
  list: async (filters?: { module_id?: string }) => {
    let query = supabase.from('lessons').select('*')
    
    if (filters?.module_id) {
      query = query.eq('module_id', filters.module_id)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (lesson: any) => {
    const { data, error } = await supabase
      .from('lessons')
      .insert(lesson)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('lessons')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id)
    if (error) throw error
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
  }
}

// ============================================================================
// FLASHCARD DECKS
// ============================================================================

export const flashcardDecksApi = {
  list: async (filters?: { course_id?: string; is_published?: boolean }) => {
    let query = supabase.from('flashcard_decks').select('*')
    
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
    const { data, error } = await supabase
      .from('flashcard_decks')
      .insert(deck)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('flashcard_decks')
      .update(updates)
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
      .insert(flashcard)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('flashcards')
      .update(updates)
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
    let query = supabase.from('question_bank').select('*, question_bank_options(*)')
    
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
      .select('*, question_bank_options(*)')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  create: async (question: any) => {
    const { data, error } = await supabase
      .from('question_bank')
      .insert(question)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('question_bank')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  delete: async (id: string) => {
    const { error } = await supabase.from('question_bank').delete().eq('id', id)
    if (error) throw error
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

  create: async (topic: { name: string; slug: string; description?: string }) => {
    const { data, error } = await supabase
      .from('question_topics')
      .insert(topic)
      .select()
      .single()
    if (error) throw error
    return data
  },

  update: async (id: string, updates: { name?: string; slug?: string; description?: string }) => {
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
