'use client'

import { useEffect, useState, useRef } from 'react'

export default function ScrollHeader({ children }: { children: React.ReactNode }) {
  const [isHidden, setIsHidden] = useState(false)
  const headerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let ticking = false

    const handleScroll = () => {
      if (!ticking) {
        ticking = true

        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY

          // Only change state if we cross the threshold by a significant amount
          if (currentScrollY > 150 && !isHidden) {
            setIsHidden(true)
          } else if (currentScrollY < 50 && isHidden) {
            setIsHidden(false)
          }

          ticking = false
        })
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isHidden])

  return (
    <div
      ref={headerRef}
      className='transition-transform duration-300 will-change-transform'
      style={{
        transform: isHidden ? 'translateY(-100%)' : 'translateY(0)',
      }}
    >
      {children}
    </div>
  )
}
