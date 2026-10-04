import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client for database access only
// Note: Using existing Express session auth, not Supabase Auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

// ============================================================================
// ADMIN USERS (users table)
// ============================================================================

export const adminUsersApi = {
  // List all admin users
  list: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // Get user by ID
  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  // Create admin user
  create: async (user: { email: string; password: string; first_name?: string; last_name?: string; role?: string }) => {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update admin user
  update: async (id: string, updates: Partial<{ first_name: string; last_name: string; role: string; is_active: boolean }>) => {
    const { data, error } = await supabase
      .from('users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete admin user
  delete: async (id: string) => {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// ============================================================================
// MEMBERS (members table - students/users)
// ============================================================================

export const membersApi = {
  list: async (filters?: { search?: string; user_type?: string; membership_tier?: string }) => {
    let query = supabase.from('members').select('*')
    
    if (filters?.search) {
      query = query.or(`email.ilike.%${filters.search}%,first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%`)
    }
    if (filters?.user_type) {
      query = query.eq('user_type', filters.user_type)
    }
    if (filters?.membership_tier) {
      query = query.eq('membership_tier', filters.membership_tier)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  },

  update: async (id: string, updates: any) => {
    const { data, error } = await supabase
      .from('members')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}

// ============================================================================
// COURSES
// ============================================================================

export const coursesApi = {
  list: async (filters?: { search?: string; category?: string; is_published?: boolean }) => {
    let query = supabase.from('courses').select('*')
    
    if (filters?.search) {
      query = query.ilike('title', `%${filters.search}%`)
    }
    if (filters?.category) {
      query = query.eq('category', filters.category)
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }
    
    const { data, error} = await query.order('created_at', { ascending: false })
    if (error) throw error
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
      .update({ ...updates, updated_at: new Date().toISOString() })
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
    
    if (filters?.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
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
      .update({ ...updates, updated_at: new Date().toISOString() })
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
  list: async (filters?: { module_id?: string; is_published?: boolean }) => {
    let query = supabase.from('lessons').select('*')
    
    if (filters?.module_id) {
      query = query.eq('module_id', filters.module_id)
    }
    if (filters?.is_published !== undefined) {
      query = query.eq('is_published', filters.is_published)
    }
    
    const { data, error } = await query.order('order', { ascending: true })
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('lessons')
      .select('*, lesson_assets(*)')
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
      .update({ ...updates, updated_at: new Date().toISOString() })
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
// ENROLLMENTS
// ============================================================================

export const enrollmentsApi = {
  list: async (filters?: { member_id?: string; course_id?: string; status?: string }) => {
    let query = supabase.from('enrollments').select('*, members(*), courses(*)')
    
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
    if (error) throw error
    return data
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, members(*), courses(*)')
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
    
    if (error) throw error
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

  delete: async (id: string) => {
    const { error } = await supabase.from('enrollments').delete().eq('id', id)
    if (error) throw error
  }
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export const notificationsApi = {
  list: async (filters?: { member_id?: string; user_id?: string; is_read?: boolean }) => {
    let query = supabase.from('notifications').select('*')
    
    if (filters?.member_id) {
      query = query.eq('member_id', filters.member_id)
    }
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

  markAllAsRead: async (memberId?: string, userId?: string) => {
    let query = supabase.from('notifications').update({ is_read: true })
    
    if (memberId) {
      query = query.eq('member_id', memberId)
    }
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
  notifications: notificationsApi
}
