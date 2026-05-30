'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX - 5 + 'px'
        cursorRef.current.style.top = e.clientY - 5 + 'px'
      }
    }
    document.addEventListener('mousemove', onMove)

    const interactiveEls = document.querySelectorAll('button, a, .faq-q, .demo-upload, .feature-card, .persona-card')
    const grow = () => { if (cursorRef.current) cursorRef.current.style.transform = 'scale(2.5)' }
    const shrink = () => { if (cursorRef.current) cursorRef.current.style.transform = 'scale(1)' }
    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', grow)
      el.addEventListener('mouseleave', shrink)
    })

    return () => { document.removeEventListener('mousemove', onMove) }
  }, [])

  return <div className="cursor" ref={cursorRef} />
}
