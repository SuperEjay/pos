/**
 * Event image uploads via Supabase Storage S3 API.
 * See: https://supabase.com/docs/guides/storage/s3/authentication
 *
 * Required env (both repos): VITE_SUPABASE_DEJA_BROS_ACCESS_KEY_ID,
 * VITE_SUPABASE_DEJA_BROS_SECRET_ACCESS_KEY.
 * Optional: VITE_SUPABASE_S3_ENDPOINT, VITE_SUPABASE_S3_REGION (defaults derived from VITE_SUPABASE_URL).
 * S3 endpoint must be for the same project as VITE_SUPABASE_URL (e.g. https://YOUR_PROJECT_REF.storage.supabase.co/storage/v1/s3).
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const BUCKET =
  (import.meta.env.VITE_SUPABASE_EVENTS_BUCKET as string) || 'deja-bros-events'

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const maxSizeBytes = 5 * 1024 * 1024 // 5MB

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string)?.replace(/\/$/, '') ?? ''
const s3Endpoint =
  (import.meta.env.VITE_SUPABASE_S3_ENDPOINT as string) ||
  (supabaseUrl
    ? supabaseUrl.replace('supabase.co', 'storage.supabase.co') + '/storage/v1/s3'
    : '')
const s3Region =
  (import.meta.env.VITE_SUPABASE_S3_REGION as string) || 'ap-southeast-1'
const accessKeyId = import.meta.env.VITE_SUPABASE_DEJA_BROS_ACCESS_KEY_ID as string
const secretAccessKey = import.meta.env.VITE_SUPABASE_DEJA_BROS_SECRET_ACCESS_KEY as string

const BUCKET_NOT_FOUND_MESSAGE = `Storage bucket "${BUCKET}" not found. Ensure S3 endpoint matches your Supabase project (same as VITE_SUPABASE_URL). Create the bucket in Supabase: Storage → New bucket → name: ${BUCKET} → Public.`

function safeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100) || 'image'
}

function getS3Client(): S3Client | null {
  if (!s3Endpoint || !s3Region || !accessKeyId || !secretAccessKey) return null
  return new S3Client({
    forcePathStyle: true,
    region: s3Region,
    endpoint: s3Endpoint,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })
}

/**
 * Upload an image via Supabase Storage S3 API and return its public URL.
 * Uses S3 access keys (VITE_SUPABASE_DEJA_BROS_ACCESS_KEY_ID / SECRET_ACCESS_KEY)
 * and endpoint (VITE_SUPABASE_S3_ENDPOINT or derived from VITE_SUPABASE_URL).
 * See: https://supabase.com/docs/guides/storage/s3/authentication
 */
export async function uploadEventImage(file: File): Promise<string> {
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Use JPEG, PNG, WebP, or GIF.')
  }
  if (file.size > maxSizeBytes) {
    throw new Error('File too large. Maximum size is 5MB.')
  }

  const client = getS3Client()
  if (!client) {
    throw new Error(
      'Storage not configured. Set VITE_SUPABASE_DEJA_BROS_ACCESS_KEY_ID and VITE_SUPABASE_DEJA_BROS_SECRET_ACCESS_KEY (and VITE_SUPABASE_S3_ENDPOINT / VITE_SUPABASE_S3_REGION if needed).',
    )
  }

  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const id = crypto.randomUUID()
  const filename = `${id}-${safeFilename(file.name)}`
  const key = `events/${year}/${month}/${filename}`

  try {
    const arrayBuffer = await file.arrayBuffer()
    await client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: new Uint8Array(arrayBuffer),
        ContentType: file.type,
        CacheControl: 'max-age=3600',
      }),
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    if (msg.toLowerCase().includes('bucket') && msg.toLowerCase().includes('not found')) {
      throw new Error(BUCKET_NOT_FOUND_MESSAGE)
    }
    if (msg.toLowerCase().includes('no such bucket')) {
      throw new Error(BUCKET_NOT_FOUND_MESSAGE)
    }
    throw err
  }

  if (!supabaseUrl) {
    throw new Error('VITE_SUPABASE_URL is required to build the public image URL.')
  }
  const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${key}`
  return publicUrl
}

/** Storage is configured when S3 keys (and endpoint/region) are set. */
export function isStorageConfigured(): boolean {
  return Boolean(
    s3Endpoint &&
      s3Region &&
      accessKeyId &&
      secretAccessKey &&
      supabaseUrl,
  )
}
