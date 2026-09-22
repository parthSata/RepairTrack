'use client'

import Image from 'next/image'
import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { ImageLightbox } from '@/components/repairs/image-lightbox'
import { TrackSectionHeader } from '@/components/tracking/track-section-header'

type Props = {
  beforeUrl: string
  afterUrl: string
}

export function TrackRepairPhotos({ beforeUrl, afterUrl }: Props) {
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null)

  return (
    <>
      <Card className="w-full min-w-0 border-border">
        <CardContent className="flex w-full min-w-0 flex-col gap-4 p-4 sm:p-6">
          <TrackSectionHeader icon={ImageIcon} title="Repair photos" />
          <p className="-mt-1 text-sm text-muted-foreground">
            Before and after photos from the shop.
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {(
              [
                { src: beforeUrl, alt: 'Before repair' },
                { src: afterUrl, alt: 'After repair' },
              ] as const
            ).map((item) => (
              <button
                key={item.alt}
                type="button"
                onClick={() => setPreview(item)}
                className="group overflow-hidden rounded-xl border border-border bg-muted/20 text-left transition hover:ring-2 hover:ring-accent/40"
              >
                <div className="relative aspect-[4/3] w-full">
                  <Image
                    src={item.src}
                    alt={item.alt}
                    fill
                    unoptimized
                    className="object-cover transition duration-200 group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, 50vw"
                  />
                </div>
                <p className="px-3 py-2 text-sm font-medium text-foreground">{item.alt}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      <ImageLightbox
        open={Boolean(preview)}
        src={preview?.src ?? null}
        alt={preview?.alt ?? 'Repair photo'}
        onClose={() => setPreview(null)}
      />
    </>
  )
}
