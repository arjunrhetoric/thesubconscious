'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface WebcamPixelGridProps {
  gridCols?: number
  gridRows?: number
  maxElevation?: number
  motionSensitivity?: number
  elevationSmoothing?: number
  colorMode?: 'webcam' | 'monochrome' | 'gradient'
  backgroundColor?: string
  mirror?: boolean
  gapRatio?: number
  invertColors?: boolean
  darken?: number
  borderColor?: string
  borderOpacity?: number
  className?: string
  onWebcamReady?: () => void
  onWebcamError?: (err: any) => void
}

export function WebcamPixelGrid({
  gridCols = 60,
  gridRows = 40,
  maxElevation = 40,
  motionSensitivity = 0.25,
  elevationSmoothing = 0.2,
  colorMode = 'monochrome',
  backgroundColor = '#030303',
  mirror = true,
  gapRatio = 0.05,
  invertColors = false,
  darken = 0.6,
  borderColor = '#ffffff',
  borderOpacity = 0.06,
  className,
  onWebcamReady,
  onWebcamError,
}: WebcamPixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [hasWebcam, setHasWebcam] = useState(false)
  const mousePos = useRef<{ x: number; y: number }>({ x: -1000, y: -1000 })
  const elevationsRef = useRef<Float32Array>(new Float32Array(gridCols * gridRows))

  // Initialize webcam if colorMode is webcam
  useEffect(() => {
    if (colorMode !== 'webcam') return

    const video = document.createElement('video')
    video.autoplay = true
    video.playsInline = true
    video.muted = true
    videoRef.current = video

    navigator.mediaDevices
      ?.getUserMedia({ video: { width: 320, height: 240 } })
      .then((stream) => {
        video.srcObject = stream
        video.play()
        video.onloadedmetadata = () => {
          setHasWebcam(true)
          if (onWebcamReady) onWebcamReady()
        }
      })
      .catch((err) => {
        setHasWebcam(false)
        if (onWebcamError) onWebcamError(err)
      })

    return () => {
      if (video.srcObject) {
        const stream = video.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [colorMode, onWebcamReady, onWebcamError])

  // Mouse tracking
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      mousePos.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      }
    }

    const handleMouseLeave = () => {
      mousePos.current = { x: -1000, y: -1000 }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    let time = 0

    const offscreen = document.createElement('canvas')
    offscreen.width = gridCols
    offscreen.height = gridRows
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true })

    const render = () => {
      time += 0.03
      const width = canvas.width
      const height = canvas.height
      const cellW = width / gridCols
      const cellH = height / gridRows
      const gap = Math.min(cellW, cellH) * gapRatio

      // Clear background
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, width, height)

      let pixelData: Uint8ClampedArray | null = null

      if (hasWebcam && videoRef.current && offCtx) {
        try {
          if (mirror) {
            offCtx.save()
            offCtx.scale(-1, 1)
            offCtx.drawImage(videoRef.current, -gridCols, 0, gridCols, gridRows)
            offCtx.restore()
          } else {
            offCtx.drawImage(videoRef.current, 0, 0, gridCols, gridRows)
          }
          pixelData = offCtx.getImageData(0, 0, gridCols, gridRows).data
        } catch {}
      }

      const elevations = elevationsRef.current

      for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
          const index = r * gridCols + c
          let targetElevation = 0

          // If webcam active, use brightness
          if (pixelData) {
            const pIdx = index * 4
            const rVal = pixelData[pIdx]
            const gVal = pixelData[pIdx + 1]
            const bVal = pixelData[pIdx + 2]
            const brightness = (rVal + gVal + bVal) / 3 / 255
            targetElevation = (invertColors ? 1 - brightness : brightness) * maxElevation
          } else {
            // Ambient wave calculation
            const wave1 = Math.sin(c * 0.15 + time) * Math.cos(r * 0.15 + time)
            const wave2 = Math.sin((c + r) * 0.1 + time * 1.5)
            targetElevation = ((wave1 + wave2) * 0.5 + 0.5) * (maxElevation * 0.5)
          }

          // Mouse proximity boost
          const centerX = c * cellW + cellW / 2
          const centerY = r * cellH + cellH / 2
          const dx = mousePos.current.x - centerX
          const dy = mousePos.current.y - centerY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 180

          if (dist < maxDist) {
            const mouseFactor = (1 - dist / maxDist) * maxElevation * 0.8
            targetElevation += mouseFactor
          }

          // Smooth elevation transition
          elevations[index] += (targetElevation - elevations[index]) * elevationSmoothing
          const currentElev = elevations[index]
          const intensity = Math.min(1, Math.max(0, currentElev / maxElevation))

          // Draw tile
          const pad = gap / 2
          const x = c * cellW + pad
          const y = r * cellH + pad
          const w = cellW - gap
          const h = cellH - gap

          // Tile base color
          const alpha = 0.08 + intensity * (1 - darken) * 0.6
          const lum = Math.floor(intensity * 180 + 30)

          ctx.fillStyle = `rgba(${lum}, ${lum}, ${lum}, ${alpha})`
          ctx.fillRect(x, y, w, h)

          // Border stroke
          if (borderOpacity > 0) {
            ctx.strokeStyle = borderColor
            ctx.globalAlpha = borderOpacity + intensity * 0.15
            ctx.lineWidth = 1
            ctx.strokeRect(x, y, w, h)
            ctx.globalAlpha = 1.0
          }
        }
      }

      animationFrameId = requestAnimationFrame(render)
    }

    // Set canvas dimensions
    const resize = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight
    }

    resize()
    window.addEventListener('resize', resize)
    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      window.removeEventListener('resize', resize)
    }
  }, [
    gridCols,
    gridRows,
    maxElevation,
    elevationSmoothing,
    backgroundColor,
    gapRatio,
    invertColors,
    darken,
    borderColor,
    borderOpacity,
    hasWebcam,
    mirror,
  ])

  return (
    <canvas
      ref={canvasRef}
      className={cn('pointer-events-auto h-full w-full block', className)}
    />
  )
}
