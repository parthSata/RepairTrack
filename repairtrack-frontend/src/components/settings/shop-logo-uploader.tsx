'use client'

import { AlertTriangle, ImagePlus, LoaderCircle, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { createPortal } from 'react-dom'
import { useRef, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { useRequestLogoUploadUrl } from '@/features/shop/mutations'
import { Button } from '@/components/ui/button'

type Props = { previewUrl?: string | null; onUploaded: (key: string, previewUrl: string) => void; onRemoved: () => void }

export function ShopLogoUploader({ previewUrl, onUploaded, onRemoved }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const requestUpload = useRequestLogoUploadUrl()
  const [preview, setPreview] = useState(previewUrl)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  async function selectFile(file: File | undefined) {
    if (!file) return
    setError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, or WebP image up to 5MB.')
      return
    }
    try {
      const contentType = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/webp' ? file.type : null
      const extension = contentType === 'image/jpeg' ? 'jpg' : contentType === 'image/png' ? 'png' : contentType === 'image/webp' ? 'webp' : null
      if (!contentType || !extension) throw new Error('Unsupported image')
      const data = await requestUpload.mutateAsync({ contentType, size: file.size, extension })
      const uploadBody = new FormData()
      uploadBody.append('file', file)
      uploadBody.append('api_key', data.apiKey)
      uploadBody.append('timestamp', String(data.timestamp))
      uploadBody.append('signature', data.signature)
      uploadBody.append('upload_preset', data.presetKey)
      uploadBody.append('public_id', data.publicId)
      const uploadResult = await apiClient.post<{ secure_url?: string }>(data.uploadUrl, uploadBody, { headers: { 'Content-Type': 'multipart/form-data' }, onUploadProgress: (event) => setProgress(event.progress ? Math.round(event.progress * 100) : 0) })
      const nextPreview = uploadResult.data.secure_url ?? data.previewUrl ?? URL.createObjectURL(file)
      setPreview(nextPreview)
      onUploaded(data.key, nextPreview)
    } catch {
      setError('Logo upload failed. Please try again.')
      setProgress(0)
    }
  }

  function removeLogo() {
    setPreview(null)
    onRemoved()
    setShowDeleteDialog(false)
  }

  const isUploading = requestUpload.isPending || progress > 0 && progress < 100
  return <div className="space-y-4">
    <div className="flex h-44 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/40">
      {preview ? <Image src={preview} alt="Shop logo preview" width={176} height={176} priority unoptimized className="h-full w-full object-contain p-5" /> : <div className="text-center"><ImagePlus className="mx-auto h-8 w-8 text-steel" /><p className="mt-3 text-sm font-medium">Upload logo</p><p className="mt-1 text-xs text-muted-foreground">JPEG, PNG, or WebP up to 5MB</p></div>}
    </div>
    {isUploading && <div aria-label={`Upload progress ${progress}%`} className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-[width] duration-200" style={{ width: `${progress}%` }} /></div>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2">
      <Button type="button" variant="outline" className="gap-2" disabled={isUploading} onClick={() => inputRef.current?.click()}>{isUploading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {preview ? 'Replace logo' : 'Choose logo'}</Button>
      {preview && <Button type="button" variant="ghost" className="gap-2" disabled={isUploading} onClick={() => setShowDeleteDialog(true)}><X className="h-4 w-4" />Remove</Button>}
    </div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={(event) => { void selectFile(event.target.files?.[0]); event.target.value = '' }} />
    {showDeleteDialog && typeof document !== 'undefined' && createPortal(<div className="fixed inset-0 z-50 overflow-y-auto bg-foreground/70 p-4 backdrop-blur-xs sm:p-6" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowDeleteDialog(false) }}>
      <div className="flex min-h-full items-center justify-center">
      <div role="dialog" aria-modal="true" aria-labelledby="delete-logo-title" aria-describedby="delete-logo-description" className="my-auto w-full max-w-md rounded-lg border border-border bg-card p-5 shadow-[0_16px_40px_rgba(24,33,43,0.18)] sm:p-6">
        <div className="flex items-start gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"><AlertTriangle className="h-5 w-5" /></div><div><h2 id="delete-logo-title" className="text-lg font-semibold">Delete shop logo?</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">This will remove the logo when you save your shop profile.</p></div></div>
        <p id="delete-logo-description" className="sr-only">Confirm whether to remove the current shop logo.</p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end"><Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setShowDeleteDialog(false)}>Cancel</Button><Button type="button" className="w-full bg-accent text-accent-foreground hover:bg-accent/90 sm:w-auto" onClick={removeLogo}>Delete logo</Button></div>
      </div>
      </div>
    </div>, document.body)}
  </div>
}