import { useEffect, useState } from 'react'
import { Image, Upload } from 'lucide-react'

export function ImageUploadField({ label, value, onChange, required = false }: {
  label: string
  value?: string
  onChange: (file: File | null) => void
  required?: boolean
}) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(value || '')
  useEffect(() => {
    if (!file) { setPreview(value || ''); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, value])

  return <div>
    <label className="label-base">{label}{required ? ' *' : ' (Optional)'}</label>
    {preview ? <img src={preview} alt="Selected image preview" className="mb-2 h-28 w-full rounded-card object-cover" /> : <div className="mb-2 flex h-24 items-center justify-center rounded-card bg-paper text-muted"><Image className="h-6 w-6" /></div>}
    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-card border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-paper">
      <Upload className="h-4 w-4" /> {file ? 'Choose a different image' : 'Choose image from device'}
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" required={required && !value} className="sr-only" onChange={(event) => {
        const next = event.target.files?.[0] ?? null
        setFile(next)
        onChange(next)
      }} />
    </label>
    {file && <p className="mt-1 text-xs text-muted">{file.name}</p>}
    <p className="mt-1 text-xs text-muted">PNG, JPEG, WebP, or GIF · up to 10 MB</p>
  </div>
}
