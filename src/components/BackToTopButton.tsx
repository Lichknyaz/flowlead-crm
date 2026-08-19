import { ArrowUp } from 'lucide-react'
import { useEffect, useState } from 'react'
import { scrollToY } from '../utils/smoothScroll'

const visibilityOffset = 420

export function BackToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > visibilityOffset)

    updateVisibility()
    window.addEventListener('scroll', updateVisibility, { passive: true })
    return () => window.removeEventListener('scroll', updateVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="Return to top"
      onClick={() => scrollToY(0)}
    >
      <ArrowUp size={20} />
    </button>
  )
}
