// Admin page type definitions that match Supabase schema

export type CourseStatus = 'draft' | 'published' | 'pending' | 'approved' | 'archived'
export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export interface Course {
  id: string
  title: string
  slug?: string
  description?: string
  category?: string
  level?: CourseLevel
  price?: number
  duration?: number
  status?: CourseStatus
  is_published?: boolean
  instructor_id?: string
  thumbnail_url?: string
  has_certificate?: boolean
  created_at?: string
  updated_at?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description?: string
  color?: string
  order?: number
  is_active?: boolean
  course_count?: number
  created_at?: string
  updated_at?: string
}

export interface Instructor {
  id: string
  name: string
  email: string
  title?: string
  headline?: string
  bio?: string
  avatar?: string
  skills?: string[]
  website?: string
  is_active?: boolean
  created_at?: string
  course_count?: number
  student_count?: number
  rating?: number
}

export interface User {
  id: string
  email: string
  first_name?: string
  last_name?: string
  role?: string
  is_active?: boolean
  avatar?: string
  created_at?: string
  updated_at?: string
  last_sign_in_at?: string
}

export interface Partner {
  id: string
  name: string
  logo?: string
  type?: string
  status?: string
  description?: string
  website?: string
  contact_name?: string
  contact_email?: string
  start_date?: string
  is_featured?: boolean
  order?: number
  created_at?: string
  updated_at?: string
}

export interface Product {
  id: string
  name: string
  sku?: string
  description?: string
  category?: string
  price?: number
  cost_price?: number
  stock?: number
  low_stock_threshold?: number
  image_url?: string
  is_active?: boolean
  is_digital?: boolean
  sales_count?: number
  order?: number
  created_at?: string
  updated_at?: string
}

export interface Article {
  id: string
  title: string
  slug?: string
  excerpt?: string
  content?: string
  cover_image?: string
  author_id?: string
  category?: string
  is_published?: boolean
  view_count?: number
  published_at?: string
  created_at?: string
  updated_at?: string
  tags?: string[]
}

// Helper type for list responses
export interface ListResponse<T> {
  data: T[]
  total: number
  page?: number
  perPage?: number
}
