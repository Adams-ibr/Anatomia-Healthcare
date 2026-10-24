import { supabase } from './supabase'

const IMAGE_BUCKET = 'admin-media'
const MAX_IMAGE_BYTES = 10 * 1024 * 1024

/** Upload an admin-selected image and return its public URL for the record. */
export async function uploadAdminImage(file: File, folder: string): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file (PNG, JPEG, WebP, or GIF).')
  if (file.size > MAX_IMAGE_BYTES) throw new Error('Images must be 10 MB or smaller.')
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError) throw userError
  if (!user) throw new Error('Please sign in again before uploading an image.')

  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'img'
  const path = `${folder}/${user.id}/${crypto.randomUUID()}.${extension}`
  const { error } = await supabase.storage.from(IMAGE_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false
  })
  if (error) throw error
  return supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path).data.publicUrl
}
