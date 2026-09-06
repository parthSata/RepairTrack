'use client'

import { Check, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { shopProfileSchema, type ShopProfile } from '@/features/shop/schemas'
import { useShopProfile } from '@/features/shop/queries'
import { useUpdateShopProfile } from '@/features/shop/mutations'
import type { ShopProfileResponse } from '@/features/shop/schemas'
import { ShopLogoUploader } from './shop-logo-uploader'

function FieldError({ message }: { message?: string }) { return message ? <p className="animate-in fade-in text-sm text-destructive">{message}</p> : null }

export function ShopProfileForm({ initialData }: { initialData?: ShopProfileResponse | null }) {
  const shopQuery = useShopProfile(initialData)
  if (shopQuery.isPending && !initialData) return <ShopProfileSkeleton />
  if (shopQuery.isError || !shopQuery.data) return <Alert><div className="flex items-center justify-between gap-4"><span>We could not load your shop profile. Please try again.</span><Button type="button" variant="outline" onClick={() => void shopQuery.refetch()}>Retry</Button></div></Alert>
  return <ShopProfileEditor key={shopQuery.data.id} profile={shopQuery.data} />
}

function ShopProfileEditor({ profile }: { profile: ShopProfileResponse }) {
  const updateShop = useUpdateShopProfile()
  const [saved, setSaved] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(profile.logoPreviewUrl)
  const { register, handleSubmit, setValue, formState: { errors, isDirty, isValid } } = useForm<ShopProfile>({ resolver: zodResolver(shopProfileSchema), mode: 'onBlur', defaultValues: profile })
  async function onSubmit(values: ShopProfile) {
    setSaved(false)
    try {
      await updateShop.mutateAsync(values)
      setSaved(true)
    } catch {}
  }

  return <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-3">
    <Card className="h-fit border-border shadow-[0_8px_24px_rgba(24,33,43,0.08)]"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Shop identity</p><h2 className="mt-2 text-lg font-semibold">Your storefront</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">A clear logo helps your team recognize the workspace.</p><div className="mt-6"><ShopLogoUploader previewUrl={logoPreview} onUploaded={(key, preview) => { setValue('logoUrl', key, { shouldDirty: true, shouldValidate: true }); setLogoPreview(preview) }} onRemoved={() => { setValue('logoUrl', '', { shouldDirty: true, shouldValidate: true }); setLogoPreview(null) }} /></div></CardContent></Card>
    <div className="space-y-8 lg:col-span-2">
      <section className="space-y-5"><div className="border-b border-border pb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Basic Information</p><p className="mt-1 text-sm text-muted-foreground">The name customers and your team will see.</p></div><div className="space-y-2"><Label htmlFor="shopName">Shop name</Label><Input id="shopName" autoComplete="organization" {...register('shopName')} /><FieldError message={errors.shopName?.message} /></div></section>
      <section className="space-y-5"><div className="border-b border-border pb-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-steel">Contact Details</p><p className="mt-1 text-sm text-muted-foreground">Keep your shop contact details current.</p></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" type="tel" autoComplete="tel" {...register('phone')} /><FieldError message={errors.phone?.message} /></div><div className="space-y-2"><Label htmlFor="email">Email <span className="font-normal text-muted-foreground">(login email)</span></Label><Input id="email" type="email" autoComplete="email" disabled value={profile.email} /><input type="hidden" {...register('email')} /><p className="text-xs text-muted-foreground">This is your verified login email and cannot be changed here.</p><FieldError message={errors.email?.message} /></div></div><div className="space-y-2"><Label htmlFor="address">Address</Label><Textarea id="address" autoComplete="street-address" {...register('address')} /><FieldError message={errors.address?.message} /></div></section>
      <section className="space-y-5"><div className="space-y-2"><Label htmlFor="businessInfo">Business information <span className="font-normal text-muted-foreground">(optional)</span></Label><Textarea id="businessInfo" {...register('businessInfo')} /><FieldError message={errors.businessInfo?.message} /></div></section>
      {updateShop.isError && <Alert>We could not save your shop profile. Check your connection and try again.</Alert>}
      <div className="flex items-center justify-end gap-4 border-t border-border pt-5"><span aria-live="polite" className="text-sm text-success">{saved && <><Check className="mr-1 inline h-4 w-4" />Changes saved</>}</span><Button type="submit" variant="accent" disabled={!isDirty || !isValid || updateShop.isPending} className="gap-2">{updateShop.isPending && <LoaderCircle className="h-4 w-4 animate-spin" />}{updateShop.isPending ? 'Saving...' : 'Save Changes'}</Button></div>
    </div>
  </form>
}

function ShopProfileSkeleton() { return <div className="grid gap-6 lg:grid-cols-3"><div className="h-96 animate-pulse rounded-lg border border-border bg-muted lg:col-span-1" /><div className="space-y-8 lg:col-span-2"><div className="h-40 animate-pulse rounded-lg bg-muted" /><div className="h-56 animate-pulse rounded-lg bg-muted" /><div className="h-40 animate-pulse rounded-lg bg-muted" /></div></div> }