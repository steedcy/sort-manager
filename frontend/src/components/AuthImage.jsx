import { useEffect, useState } from 'react'
import { fileApi } from '../api'

const requiresAuthentication = (src) => src?.startsWith('/api/') || src?.startsWith('/uploads/')

export default function AuthImage({ src, alt, fallback = null, ...props }) {
  const [resolvedImage, setResolvedImage] = useState(null)
  const [failedSrc, setFailedSrc] = useState(null)

  useEffect(() => {
    let active = true
    let nextObjectUrl = null
    if (!src || !requiresAuthentication(src)) {
      return () => { active = false }
    }

    fileApi.getBlob(src)
      .then((blob) => {
        if (!active) return
        nextObjectUrl = URL.createObjectURL(blob)
        setFailedSrc(null)
        setResolvedImage({ src, url: nextObjectUrl })
      })
      .catch(() => {
        if (active) setFailedSrc(src)
      })

    return () => {
      active = false
      if (nextObjectUrl) URL.revokeObjectURL(nextObjectUrl)
    }
  }, [src])

  const protectedImageUrl = resolvedImage?.src === src ? resolvedImage.url : null
  if (!src || failedSrc === src || (requiresAuthentication(src) && !protectedImageUrl)) return fallback
  return <img src={protectedImageUrl || src} alt={alt} {...props} />
}
