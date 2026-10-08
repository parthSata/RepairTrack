'use client'

import { Eye, EyeOff, ImagePlus, LoaderCircle, Trash2, Upload } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ImageLightbox } from '@/components/repairs/image-lightbox'
import type { RepairPhotoItem, RepairPhotosPayload } from '@/features/repairs/queries'
import type { RepairPhotoType } from '@/features/repairs/photos/schemas'
import {
  useConfirmRepairPhoto,
  useDeleteRepairPhoto,
  useRequestRepairPhotoUploadUrl,
  useSetRepairPhotosVisibility,
} from '@/features/repairs/photos/mutations'
import { cn } from '@/lib/utils'

type Props = {
  repairId: string
  photos: RepairPhotosPayload
}

function visibilityBadge(photos: RepairPhotosPayload) {
  if (photos.customerPhotosHidden) {
    return { label: 'Hidden', className: 'bg-muted text-muted-foreground' }
  }
  if (photos.customerVisible) {
    return { label: 'Customer visible', className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' }
  }
  return { label: 'Internal', className: 'bg-amber-500/10 text-amber-800 dark:text-amber-400' }
}

function RepairPhotoSlot({
  repairId,
  type,
  label,
  photo,
  canMutate,
  busy,
}: {
  repairId: string
  type: RepairPhotoType
  label: string
  photo: RepairPhotoItem | null
  canMutate: boolean
  busy: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const requestUpload = useRequestRepairPhotoUploadUrl(repairId)
  const confirmUpload = useConfirmRepairPhoto(repairId)
  const deletePhoto = useDeleteRepairPhoto(repairId)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const uploading =
    requestUpload.isPending || confirmUpload.isPending || (progress > 0 && progress < 100)

  async function selectFile(file: File | undefined) {
    if (!file || !canMutate) return
    setError(null)
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError('Choose a JPEG, PNG, or WebP image up to 5MB.')
      return
    }
    try {
      const data = await requestUpload.mutateAsync({
        type,
        contentType: file.type as 'image/jpeg' | 'image/png' | 'image/webp',
        size: file.size,
      })
      const body = new FormData()
      body.append('file', file)
      body.append('api_key', data.apiKey)
      body.append('timestamp', String(data.timestamp))
      body.append('signature', data.signature)
      body.append('upload_preset', data.presetKey)
      body.append('public_id', data.publicId)
      body.append('overwrite', 'true')
      await apiClient.post(data.uploadUrl, body, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) =>
          setProgress(event.progress ? Math.round(event.progress * 100) : 0),
      })
      await confirmUpload.mutateAsync({ type, publicId: data.publicId })
      setProgress(0)
    } catch {
      setError('Upload failed. Please try again.')
      setProgress(0)
    }
  }

  return (
    <div className="space-y-2.5 rounded-xl border border-border/70 bg-muted/10 p-3 sm:p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</h4>
      </div>

      <button
        type="button"
        disabled={!photo && !canMutate}
        onClick={() => {
          if (photo) {
            setLightboxOpen(true)
          } else if (canMutate && !busy && !uploading) {
            inputRef.current?.click()
          }
        }}
        className={cn(
          'group relative flex h-40 sm:h-44 w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-muted/20 transition',
          photo && 'cursor-zoom-in border-solid hover:ring-2 hover:ring-accent/40',
          !photo && canMutate && 'cursor-pointer hover:border-accent/60 hover:bg-accent/5',
        )}
      >
        {photo ? (
          <div className="relative h-full w-full">
            <Image
              src={photo.url}
              alt={label}
              fill
              unoptimized
              className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/35 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
              <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
                <Eye className="h-3.5 w-3.5" />
                View full size
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center px-4 text-center">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
              <ImagePlus className="h-4.5 w-4.5 text-muted-foreground" />
            </div>
            <p className="mt-2 text-xs font-medium text-foreground">
              No {label.toLowerCase()} photo yet
            </p>
            {canMutate && (
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                Click or use button to upload
              </p>
            )}
          </div>
        )}
      </button>

      {uploading && (
        <div
          aria-label={`Upload progress ${progress}%`}
          className="h-1.5 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-accent transition-[width] duration-200"
            style={{ width: `${Math.max(progress, 8)}%` }}
          />
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
        <div className="flex flex-wrap items-center gap-2">
          {canMutate && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              disabled={busy || uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Upload className="h-3.5 w-3.5" />
              )}
              {photo ? 'Replace' : 'Upload'}
            </Button>
          )}
          {photo && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => setLightboxOpen(true)}
            >
              <Eye className="h-3.5 w-3.5" />
              Preview
            </Button>
          )}
        </div>
        {photo && canMutate && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={busy || uploading || deletePhoto.isPending}
            onClick={() => deletePhoto.mutate(type)}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          void selectFile(event.target.files?.[0])
          event.target.value = ''
        }}
      />

      <ImageLightbox
        open={lightboxOpen}
        src={photo?.url ?? null}
        alt={label}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  )
}

export function RepairPhotosSection({ repairId, photos }: Props) {
  const setVisibility = useSetRepairPhotosVisibility(repairId)
  const badge = visibilityBadge(photos)
  const busy = setVisibility.isPending

  return (
    <section className="space-y-3.5 rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-foreground">Repair photos</h3>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
            Before and after photos (recommended: 4:3 or 16:9, max 5MB). Shown to customer at Ready for Pickup.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className={cn('font-medium', badge.className)}>
            {badge.label}
          </Badge>
          {photos.canHide && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              disabled={busy}
              onClick={() => setVisibility.mutate({ hidden: !photos.customerPhotosHidden })}
            >
              {photos.customerPhotosHidden ? (
                <>
                  <Eye className="h-3.5 w-3.5" /> Unhide
                </>
              ) : (
                <>
                  <EyeOff className="h-3.5 w-3.5" /> Hide from customer
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <RepairPhotoSlot
          repairId={repairId}
          type="BEFORE"
          label="Before repair"
          photo={photos.before}
          canMutate={photos.canMutate}
          busy={busy}
        />
        <RepairPhotoSlot
          repairId={repairId}
          type="AFTER"
          label="After repair"
          photo={photos.after}
          canMutate={photos.canMutate}
          busy={busy}
        />
      </div>
    </section>
  )
}
