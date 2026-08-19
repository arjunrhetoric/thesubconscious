import {
  saveImage,
  getImage,
  getImageUrl,
  type LocalImage,
} from './local-db'

export const LOCAL_IMAGE_PREFIX = 'subconscious-local://'

// ─── AES-256 Client-Side Image Encryption & Decryption ───────────────────

export async function encryptImageBuffer(
  buffer: ArrayBuffer,
  keyHex?: string
): Promise<{ encryptedBlob: Blob; keyHex: string }> {
  let cryptoKey: CryptoKey
  let generatedKeyHex = keyHex

  if (keyHex) {
    const rawKey = new Uint8Array(
      keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    )
    cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      rawKey,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
  } else {
    cryptoKey = await window.crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const rawKey = await window.crypto.subtle.exportKey('raw', cryptoKey)
    generatedKeyHex = Array.from(new Uint8Array(rawKey))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  // 12-byte cryptographically secure random IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12))

  const ciphertext = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    cryptoKey,
    buffer
  )

  // Package [12-byte IV] + [Ciphertext]
  const combined = new Uint8Array(iv.byteLength + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.byteLength)

  return {
    encryptedBlob: new Blob([combined], { type: 'application/octet-stream' }),
    keyHex: generatedKeyHex!,
  }
}

export async function decryptImageBuffer(
  encryptedBuffer: ArrayBuffer,
  keyHex: string
): Promise<string> {
  const rawKey = new Uint8Array(
    keyHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
  )
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    rawKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  )

  const bytes = new Uint8Array(encryptedBuffer)
  const iv = bytes.slice(0, 12)
  const ciphertext = bytes.slice(12)

  const decrypted = await window.crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    cryptoKey,
    ciphertext
  )

  const blob = new Blob([decrypted], { type: 'image/webp' })
  return URL.createObjectURL(blob)
}

// ─── Image Compression (Canvas WebP) ────────────────────────────────────

export async function compressImage(
  file: File | Blob,
  maxWidth = 1920,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(img.src)
      let { width, height } = img

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return resolve(file instanceof Blob ? file : new Blob([file]))
      }

      ctx.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            resolve(file instanceof Blob ? file : new Blob([file]))
          }
        },
        'image/webp',
        quality
      )
    }
    img.onerror = () => reject(new Error('Failed to load image for compression'))
  })
}

// ─── Store Image Locally in IndexedDB ───────────────────────────────────

export async function storeImageLocally(
  file: File,
  pageId: string
): Promise<{ id: string; imageId: string; localSrc: string; blobUrl: string }> {
  const compressedBlob = await compressImage(file)
  const id = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

  const localImage: LocalImage = {
    id,
    blob: compressedBlob,
    pageId,
    mimeType: 'image/webp',
    fileName: file.name || 'image.webp',
    createdAt: new Date().toISOString(),
  }

  await saveImage(localImage)

  const localSrc = `${LOCAL_IMAGE_PREFIX}${id}`
  const blobUrl = URL.createObjectURL(compressedBlob)

  return { id, imageId: id, localSrc, blobUrl }
}

// ─── Memory Blob URL Cache ──────────────────────────────────────────────

const blobUrlCache = new Map<string, string>()

export async function resolveLocalImages(content: any): Promise<any> {
  if (!content) return content
  const clone = JSON.parse(JSON.stringify(content))

  async function traverse(node: any) {
    if (!node) return

    if (node.type === 'image' && node.attrs?.src) {
      const src: string = node.attrs.src
      if (src.startsWith(LOCAL_IMAGE_PREFIX)) {
        const id = src.replace(LOCAL_IMAGE_PREFIX, '')
        let blobUrl = blobUrlCache.get(id)
        if (!blobUrl) {
          blobUrl = (await getImageUrl(id)) || src
          if (blobUrl && blobUrl.startsWith('blob:')) {
            blobUrlCache.set(id, blobUrl)
          }
        }
        node.attrs.src = blobUrl
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        await traverse(child)
      }
    }
  }

  await traverse(clone)
  return clone
}

export function unresolveLocalImages(content: any): any {
  if (!content) return content
  const clone = JSON.parse(JSON.stringify(content))

  // Reverse mapping from blob URL -> localSrc
  const reverseMap = new Map<string, string>()
  for (const [id, blobUrl] of blobUrlCache.entries()) {
    reverseMap.set(blobUrl, `${LOCAL_IMAGE_PREFIX}${id}`)
  }

  function traverse(node: any) {
    if (!node) return

    if (node.type === 'image' && node.attrs?.src) {
      const src: string = node.attrs.src
      if (src.startsWith('blob:') && reverseMap.has(src)) {
        node.attrs.src = reverseMap.get(src)!
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        traverse(child)
      }
    }
  }

  traverse(clone)
  return clone
}

// ─── Encrypt & Publish Local Images to Cloudinary on Share ──────────────

export async function publishLocalImages(
  pageId: string,
  content: any
): Promise<any> {
  if (!content) return content
  const clone = JSON.parse(JSON.stringify(content))
  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'

  // Correct token key from auth store
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('sb_token') : null

  async function traverse(node: any) {
    if (!node) return

    if (node.type === 'image' && node.attrs?.src) {
      const src: string = node.attrs.src
      let localId = ''

      if (src.startsWith(LOCAL_IMAGE_PREFIX)) {
        localId = src.replace(LOCAL_IMAGE_PREFIX, '')
      } else if (src.startsWith('blob:')) {
        for (const [id, blobUrl] of blobUrlCache.entries()) {
          if (blobUrl === src) {
            localId = id
            break
          }
        }
      }

      if (localId) {
        const imageRecord = await getImage(localId)
        if (imageRecord && imageRecord.blob) {
          let uploaded = false

          if (token) {
            try {
              // 1. Obtain signature from backend
              const signRes = await fetch(`${backendUrl}/api/v1/upload/sign`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              const signData = await signRes.json()

              if (signData.success) {
                // 2. Encrypt image bytes with AES-256-GCM
                const arrayBuffer = await imageRecord.blob.arrayBuffer()
                const { encryptedBlob, keyHex } = await encryptImageBuffer(arrayBuffer)

                const formData = new FormData()
                // Cloudinary accepts .dat as raw binary encrypted stream
                formData.append('file', encryptedBlob, 'encrypted_asset.dat')
                formData.append('api_key', signData.apiKey)
                formData.append('timestamp', signData.timestamp.toString())
                formData.append('signature', signData.signature)
                formData.append('folder', signData.folder)

                const uploadRes = await fetch(
                  `https://api.cloudinary.com/v1_1/${signData.cloudName}/raw/upload`,
                  {
                    method: 'POST',
                    body: formData,
                  }
                )

                const uploadJson = await uploadRes.json()
                if (uploadJson.secure_url) {
                  // Attach #encKey hash to secure url for client-side decryption
                  node.attrs.src = `${uploadJson.secure_url}#encKey=${keyHex}`
                  uploaded = true
                }
              }
            } catch (err) {
              console.warn('[publishLocalImages] Cloudinary upload failed, falling back to base64:', err)
            }
          }

          // Fallback: Inline base64 if Cloudinary is not used or fails
          if (!uploaded) {
            const reader = new FileReader()
            const base64 = await new Promise<string>((res) => {
              reader.onloadend = () => res(reader.result as string)
              reader.readAsDataURL(imageRecord.blob)
            })
            node.attrs.src = base64
          }
        }
      }
    }

    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        await traverse(child)
      }
    }
  }

  await traverse(clone)
  return clone
}
