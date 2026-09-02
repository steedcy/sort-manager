import { useEffect, useRef, useState } from 'react'

export default function VirtualGrid({ items, renderItem, className = 'items-grid', estimatedItemHeight = 280, columns = 2 }) {
  const containerRef = useRef(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(800)
  const [containerOffsetTop, setContainerOffsetTop] = useState(200)

  useEffect(() => {
    const handleScroll = () => {
      setScrollTop(window.scrollY || document.documentElement.scrollTop || 0)
      setViewportHeight(window.innerHeight || 800)
      setContainerOffsetTop(containerRef.current?.offsetTop ?? 200)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  if (!items || items.length <= 30) {
    return (
      <div className={className}>
        {items.map(renderItem)}
      </div>
    )
  }

  const totalRows = Math.ceil(items.length / columns)
  const totalHeight = totalRows * estimatedItemHeight

  const relativeScrollTop = Math.max(0, scrollTop - containerOffsetTop)

  const startRow = Math.max(0, Math.floor(relativeScrollTop / estimatedItemHeight) - 2)
  const endRow = Math.min(totalRows, Math.ceil((relativeScrollTop + viewportHeight) / estimatedItemHeight) + 2)

  const startIndex = startRow * columns
  const endIndex = Math.min(items.length, endRow * columns)

  const visibleItems = items.slice(startIndex, endIndex)
  const paddingTop = startRow * estimatedItemHeight
  const paddingBottom = Math.max(0, (totalRows - endRow) * estimatedItemHeight)

  return (
    <div ref={containerRef} style={{ paddingTop: `${paddingTop}px`, paddingBottom: `${paddingBottom}px`, minHeight: `${totalHeight}px` }}>
      <div className={className}>
        {visibleItems.map(renderItem)}
      </div>
    </div>
  )
}
