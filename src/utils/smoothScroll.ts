const duration = 420

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const easeInOutCubic = (progress: number) =>
  progress < 0.5 ? 4 * progress ** 3 : 1 - (-2 * progress + 2) ** 3 / 2

export function scrollToY(top: number) {
  const target = Math.max(0, top)

  if (prefersReducedMotion()) {
    window.scrollTo({ top: target, behavior: 'auto' })
    return
  }

  const start = window.scrollY
  const distance = target - start
  if (Math.abs(distance) < 1) return

  const startedAt = window.performance.now()
  const animate = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration)
    window.scrollTo(0, start + distance * easeInOutCubic(progress))
    if (progress < 1) window.requestAnimationFrame(animate)
  }

  window.requestAnimationFrame(animate)
}

export function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId)
  if (!section) return

  scrollToY(section.getBoundingClientRect().top + window.scrollY)
}
