import { v2 as cloudinary } from 'cloudinary'

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024
const CLOUDINARY_FOLDER = 'RepairTrack'

function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  const presetKey = process.env.CLOUDINARY_PRESET_KEY
  if (!cloudName || !apiKey || !apiSecret || !presetKey) throw new Error('Cloudinary is not configured')
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
  return { cloudName, apiKey, apiSecret, presetKey }
}

export function createLogoUploadData(shopId: string) {
  const { cloudName, apiKey, apiSecret, presetKey } = configureCloudinary()
  const timestamp = Math.floor(Date.now() / 1000)
  const publicId = `${CLOUDINARY_FOLDER}/shops/${shopId}/logo/${crypto.randomUUID()}`
  const signature = cloudinary.utils.api_sign_request({ public_id: publicId, timestamp, upload_preset: presetKey }, apiSecret)
  return {
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    publicId,
    signature,
    timestamp,
    apiKey,
    presetKey,
  }
}

export async function deleteObject(publicId: string) {
  configureCloudinary()
  await cloudinary.uploader.destroy(publicId, { invalidate: true, resource_type: 'image' })
}

export function logoPublicUrl(publicId: string) {
  const { cloudName } = configureCloudinary()
  return `https://res.cloudinary.com/${cloudName}/image/upload/${publicId}`
}

export { MAX_UPLOAD_SIZE }