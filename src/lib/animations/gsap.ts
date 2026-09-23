import gsap from 'gsap'

/**
 * Counts up a numeric element smoothly with GSAP
 */
export function animateCounter(
  element: HTMLElement | null,
  targetValue: number,
  duration: number = 1.2
) {
  if (!element) return

  const obj = { val: 0 }
  gsap.to(obj, {
    val: targetValue,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.innerText = Math.round(obj.val).toLocaleString()
    },
  })
}

/**
 * Creates subtle continuous floating effect for hero badges/visuals
 */
export function createFloatAnimation(target: HTMLElement | string) {
  return gsap.to(target, {
    y: '-=8',
    duration: 2.5,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  })
}
