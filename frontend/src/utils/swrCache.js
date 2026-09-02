import { useEffect, useRef, useState, useCallback } from 'react'

const memoryCache = new Map()
const STORAGE_PREFIX = 'sm_swr_'

function serializeKey(key) {
  if (typeof key === 'string') return key
  return JSON.stringify(key)
}

export function getSWRCache(key) {
  const skey = serializeKey(key)
  if (memoryCache.has(skey)) {
    return memoryCache.get(skey)
  }
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + skey)
    if (raw) {
      const parsed = JSON.parse(raw)
      memoryCache.set(skey, parsed)
      return parsed
    }
  } catch {
    // Ignore storage parse errors
  }
  return undefined
}

export function setSWRCache(key, data) {
  const skey = serializeKey(key)
  memoryCache.set(skey, data)
  try {
    sessionStorage.setItem(STORAGE_PREFIX + skey, JSON.stringify(data))
  } catch {
    // Ignore storage quota errors
  }
}

export function invalidateSWRCache(pattern = '') {
  const p = serializeKey(pattern)
  for (const k of memoryCache.keys()) {
    if (!p || k.includes(p)) {
      memoryCache.delete(k)
      try {
        sessionStorage.removeItem(STORAGE_PREFIX + k)
      } catch {
        // Ignore
      }
    }
  }
}

export function useSWR(key, fetcher) {
  const skey = serializeKey(key)
  const cachedData = getSWRCache(skey)
  
  const [data, setData] = useState(cachedData)
  const [loading, setLoading] = useState(cachedData === undefined)
  const [error, setError] = useState(null)
  
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  const revalidate = useCallback(async () => {
    if (!fetcherRef.current) return
    try {
      const res = await fetcherRef.current()
      const fetchedData = res?.data ?? res
      setSWRCache(skey, fetchedData)
      setData(fetchedData)
      setError(null)
      return fetchedData
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [skey])

  useEffect(() => {
    let isMounted = true
    if (fetcherRef.current) {
      fetcherRef.current()
        .then(res => {
          if (!isMounted) return
          const fetchedData = res?.data ?? res
          setSWRCache(skey, fetchedData)
          setData(fetchedData)
          setError(null)
        })
        .catch(err => {
          if (!isMounted) return
          setError(err)
        })
        .finally(() => {
          if (!isMounted) return
          setLoading(false)
        })
    }

    return () => {
      isMounted = false
    }
  }, [skey])

  const mutate = useCallback((newData, shouldRevalidate = true) => {
    if (typeof newData === 'function') {
      setData(prev => {
        const next = newData(prev)
        setSWRCache(skey, next)
        return next
      })
    } else {
      setSWRCache(skey, newData)
      setData(newData)
    }
    if (shouldRevalidate) {
      return revalidate()
    }
  }, [skey, revalidate])

  return { data, loading, error, mutate, revalidate }
}
