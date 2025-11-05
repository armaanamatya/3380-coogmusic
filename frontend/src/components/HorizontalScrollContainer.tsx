import React, { useRef, useState, useEffect, type ReactNode } from 'react'

interface HorizontalScrollContainerProps {
  children: ReactNode
  onLoadMore?: () => void
  isLoading?: boolean
  hasMore?: boolean
  className?: string
}

export const HorizontalScrollContainer: React.FC<HorizontalScrollContainerProps> = ({
  children,
  onLoadMore,
  isLoading = false,
  hasMore = true,
  className = ""
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(false)

  const updateArrowVisibility = () => {
    if (!scrollContainerRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    
    // Only show arrows if content is scrollable
    const isScrollable = scrollWidth > clientWidth
    
    setShowLeftArrow(isScrollable && scrollLeft > 0)
    setShowRightArrow(isScrollable && scrollLeft < scrollWidth - clientWidth - 1)
  }

  const handleScroll = () => {
    updateArrowVisibility()
    
    if (!scrollContainerRef.current || !onLoadMore || !hasMore || isLoading) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
    const scrollPercentage = (scrollLeft + clientWidth) / scrollWidth

    // Trigger load more when 90% scrolled
    if (scrollPercentage > 0.9) {
      onLoadMore()
    }
  }

  const scrollLeft = () => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const cardWidth = 280 // Approximate card width including gap
    const scrollAmount = cardWidth * 3 // Scroll 3 cards at a time
    
    container.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    })
  }

  const scrollRight = () => {
    if (!scrollContainerRef.current) return
    
    const container = scrollContainerRef.current
    const cardWidth = 280 // Approximate card width including gap
    const scrollAmount = cardWidth * 3 // Scroll 3 cards at a time
    
    container.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    })
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    // Initial arrow visibility check with a small delay to ensure DOM is rendered
    const timeout = setTimeout(() => {
      updateArrowVisibility()
    }, 100)

    const handleScrollEvent = () => handleScroll()
    container.addEventListener('scroll', handleScrollEvent)

    // Check arrow visibility when children change
    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        updateArrowVisibility()
      }, 50)
    })
    resizeObserver.observe(container)

    return () => {
      clearTimeout(timeout)
      container.removeEventListener('scroll', handleScrollEvent)
      resizeObserver.disconnect()
    }
  }, [children, hasMore, isLoading])

  return (
    <div className={`relative ${className}`}>
      {/* Left Arrow */}
      {showLeftArrow && (
        <button
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl rounded-full p-3 hover:bg-gray-50 transition-all border border-gray-300 hover:shadow-2xl"
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Scrollable Container */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
        style={{
          scrollbarWidth: 'none', // Firefox
          msOverflowStyle: 'none', // IE and Edge
        }}
      >
        {children}
        
        {/* Loading indicator */}
        {isLoading && (
          <div className="flex-shrink-0 flex items-center justify-center w-64 h-64 bg-gray-50 rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
          </div>
        )}
      </div>

      {/* Right Arrow */}
      {showRightArrow && (
        <button
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white shadow-xl rounded-full p-3 hover:bg-gray-50 transition-all border border-gray-300 hover:shadow-2xl"
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Custom scrollbar hiding styles */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}