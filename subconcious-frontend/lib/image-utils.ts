/**
 * Client-Side Image Utilities
 *
 * Provides browser-native image compression using HTML Canvas,
 * UUID generation for local image IDs, Tiptap JSON tree
 * walking to resolve local image references to blob URLs, and
 * publishing local images to Cloudinary / Data URLs on public share.
 *
 * @module image-utils
 */

import { apiRequest } from './api'
import * as localDb from './local-db'

/** Prefix used in Tiptap JSON to reference locally stored images */
export const LOCAL_IMAGE_PREFIX = 'localimg://'

/**
 * Compress an image file using HTML Canvas.
 * Resizes to maxWidth (preserving aspect ratio) and converts to WebP.
 *
 * @param file - Original image file from drag/drop or file picker
 * @param maxWidth - Maximum pixel width (default 1920)
 * @param quality - WebP quality 0–1 (default 0.85)
 * @returns Compressed image as a Blob
 */
export function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      let { width, height } = img

      // Scale down if wider than maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Canvas toBlob returned null'))
          }
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image for compression'))

    // Load from file
    const reader = new FileReader()
    reader.onload = (e) => {
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Generate a unique ID for local image storage.
 */
export function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Store an image locally in IndexedDB and return its local reference URL.
 *
 * @param file - The original image file
 * @param pageId - The page this image belongs to
 * @returns Object with the image ID and a live blob: URL for immediate rendering
 */
export async function storeImageLocally(
  file: File,
  pageId: string
): Promise<{ imageId: string; blobUrl: string }> {
  // Compress the image
  const compressed = await compressImage(file)

  const imageId = generateImageId()

  // Save to IndexedDB
  await localDb.saveImage({
    id: imageId,
    blob: compressed,
    pageId,
    mimeType: 'image/webp',
    fileName: file.name,
    createdAt: new Date().toISOString(),
  })

  // Create a live blob URL for immediate rendering
  const blobUrl = URL.createObjectURL(compressed)
  blobUrlCache.set(imageId, blobUrl)

  return { imageId, blobUrl }
}

// ─── Blob URL Cache ─────────────────────────────────────────────────────

const blobUrlCache = new Map<string, string>()

/**
 * Get a blob URL for a local image, using a cache to avoid creating
 * duplicate blob URLs for the same image.
 */
export async function getCachedBlobUrl(imageId: string): Promise<string | null> {
  // Check cache first
  const cached = blobUrlCache.get(imageId)
  if (cached) return cached

  // Load from IndexedDB
  const url = await localDb.getImageUrl(imageId)
  if (url) {
    blobUrlCache.set(imageId, url)
  }
  return url
}

/**
 * Revoke all cached blob URLs (call on logout or page unload).
 */
export function revokeAllBlobUrls(): void {
  for (const url of blobUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  blobUrlCache.clear()
}

// ─── Tiptap JSON Image Resolution ───────────────────────────────────────

/**
 * Walk a Tiptap JSON document tree and resolve all `localimg://` src
 * references to live blob: URLs from IndexedDB.
 *
 * This is called when loading a page from local storage so that
 * images render correctly in the editor.
 *
 * @param content - Tiptap JSON content
 * @returns A new content object with resolved image URLs
 */
export async function resolveLocalImages(content: any): Promise<any> {
  if (!content) return content

  const resolved = JSON.parse(JSON.stringify(content))
  await walkAndResolve(resolved)
  return resolved
}

async function walkAndResolve(node: any): Promise<void> {
  if (!node || typeof node !== 'object') return

  // If this is an image node with a local reference
  if (
    node.type === 'image' &&
    node.attrs?.src &&
    typeof node.attrs.src === 'string' &&
    node.attrs.src.startsWith(LOCAL_IMAGE_PREFIX)
  ) {
    const imageId = node.attrs.src.slice(LOCAL_IMAGE_PREFIX.length)
    const blobUrl = await getCachedBlobUrl(imageId)
    if (blobUrl) {
      node.attrs.src = blobUrl
    }
  }

  // Recurse into children
  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      await walkAndResolve(child)
    }
  }
}

/**
 * Walk a Tiptap JSON document and replace blob: URLs back to
 * localimg:// references for storage. This is the inverse of
 * resolveLocalImages — called before saving to IndexedDB.
 *
 * @param content - Tiptap JSON with live blob: URLs
 * @returns Content with blob: URLs replaced by localimg:// references
 */
export function unresolveLocalImages(content: any): any {
  if (!content) return content

  const result = JSON.parse(JSON.stringify(content))
  walkAndUnresolve(result)
  return result
}

function walkAndUnresolve(node: any): void {
  if (!node || typeof node !== 'object') return

  if (
    node.type === 'image' &&
    node.attrs?.src &&
    typeof node.attrs.src === 'string' &&
    node.attrs.src.startsWith('blob:')
  ) {
    // Find the imageId from the blob URL cache
    for (const [imageId, blobUrl] of blobUrlCache.entries()) {
      if (blobUrl === node.attrs.src) {
        node.attrs.src = `${LOCAL_IMAGE_PREFIX}${imageId}`
        break
      }
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      walkAndUnresolve(child)
    }
  }
}

// ─── Public Publishing Image Converter ─────────────────────────────────

/**
 * Uploads a binary blob to Cloudinary using backend signed parameters.
 * Returns public HTTPS URL if successful, or null on failure.
 */
export async function uploadBlobToCloudinary(blob: Blob, fileName = 'image.webp'): Promise<string | null> {
  try {
    const signData = await apiRequest('/upload/sign')
    if (!signData?.signature || !signData?.apiKey || !signData?.cloudName) {
      return null
    }

    const formData = new FormData()
    formData.append('file', blob, fileName)
    formData.append('api_key', signData.apiKey)
    formData.append('timestamp', signData.timestamp.toString())
    formData.append('signature', signData.signature)
    formData.append('folder', signData.folder)

    const cloudRes = await fetch(
      `https://api.cloudinary.com/v1_1/${signData.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    )

    if (cloudRes.ok) {
      const cloudData = await cloudRes.json()
      if (cloudData.secure_url) {
        return cloudData.secure_url
      }
    } else {
      const errText = await cloudRes.text()
      console.warn('[Cloudinary upload failed]', cloudRes.status, errText)
    }
  } catch (err) {
    console.warn('[uploadBlobToCloudinary error]', err)
  }
  return null
}

/**
 * Convert a blob to a Base64 data URL string.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })
}

/**
 * Convert local images in a document to publicly accessible URLs (Cloudinary CDN or compressed Base64 Data URL)
 * when a page is published to the web.
 *
 * @param pageId - The ID of the page being published
 * @param content - The Tiptap document content
 */
export async function publishLocalImages(pageId: string, content: any): Promise<any> {
  if (!content) return content

  const result = JSON.parse(JSON.stringify(content))

  // 1. Get all local images associated with this page
  const localImages = await localDb.getImagesByPage(pageId)
  const imageMap = new Map<string, Blob>()
  for (const img of localImages) {
    imageMap.set(img.id, img.blob)
  }

  // 2. Walk the document and publish every local image
  await walkAndPublishNode(result, imageMap)

  return result
}

async function walkAndPublishNode(node: any, imageMap: Map<string, Blob>): Promise<void> {
  if (!node || typeof node !== 'object') return

  if (
    node.type === 'image' &&
    node.attrs?.src &&
    typeof node.attrs.src === 'string'
  ) {
    const src: string = node.attrs.src
    let blob: Blob | null = null
    let fileName = node.attrs.alt || 'image.webp'

    // Case A: localimg://img_...
    if (src.startsWith(LOCAL_IMAGE_PREFIX)) {
      const imageId = src.slice(LOCAL_IMAGE_PREFIX.length)
      blob = imageMap.get(imageId) || null
      if (!blob) {
        const record = await localDb.getImage(imageId)
        if (record) {
          blob = record.blob
          if (record.fileName) fileName = record.fileName
        }
      }
    }
    // Case B: blob:http://...
    else if (src.startsWith('blob:')) {
      // Find from image map / cache
      for (const [imageId, blobUrl] of blobUrlCache.entries()) {
        if (blobUrl === src) {
          blob = imageMap.get(imageId) || null
          if (!blob) {
            const record = await localDb.getImage(imageId)
            if (record) {
              blob = record.blob
              if (record.fileName) fileName = record.fileName
            }
          }
          break
        }
      }
      // If still not found, fetch live blob
      if (!blob) {
        try {
          const res = await fetch(src)
          if (res.ok) blob = await res.blob()
        } catch {
          // ignore
        }
      }
    }

    if (blob) {
      // 1. Try uploading to Cloudinary
      let publicUrl = await uploadBlobToCloudinary(blob, fileName)

      // 2. Fallback to inline Base64 data URL if Cloudinary is unavailable
      if (!publicUrl) {
        publicUrl = await blobToDataUrl(blob)
      }

      if (publicUrl) {
        node.attrs.src = publicUrl
      }
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      await walkAndPublishNode(child, imageMap)
    }
  }
}
