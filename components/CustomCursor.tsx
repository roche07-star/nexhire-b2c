'use client'

import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)
  const mouse = useRef({ x: 0, y: 0 })
  const ring = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current = { x: e.clientX, y: e.clientY }
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX - 5 + 'px'
        cursorRef.current.style.top = e.clientY - 5 + 'px'
      }
    }
    document.addEventListener('mousemove', onMove)

    let raf: number
    const animate = () => {
      ring.current.x += (mouse.current.x - ring.current.x) * 0.12
      ring.current.y += (mouse.current.y - ring.current.y) * 0.12
      if (ringRef.current) {
        ringRef.current.style.left = ring.current.x - 18 + 'px'
        ringRef.current.style.top = ring.current.y - 18 + 'px'
      }
      raf = requestAnimationFrame(animate)
    }
    animate()

    const interactiveEls = document.querySelectorAll('button, a, .faq-q, .demo-upload, .feature-card, .persona-card')
    const grow = () => { if (cursorRef.current) cursorRef.current.style.transform = 'scale(2.5)' }
    const shrink = () => { if (cursorRef.current) cursorRef.current.style.transform = 'scale(1)' }
    interactiveEls.forEach(el => {
      el.addEventListener('mouseenter', grow)
      el.addEventListener('mouseleave', shrink)
    })

    return () => {
      document.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <>
      <div className="cursor" ref={cursorRef} />
      <div className="cursor-ring" ref={ringRef} />
    </>
  )
}
