import { useState, useRef } from 'react'

interface ComparisonSliderProps {
  originalUrl: string
  protectedUrl: string
}

function ComparisonSlider({ originalUrl, protectedUrl }: ComparisonSliderProps) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const updatePosition = (clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width))
    setPosition((x / rect.width) * 100)
  }

  const onPointerDown = () => {
    dragging.current = true
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }

  const onPointerUp = () => {
    dragging.current = false
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-[4/3] rounded-[1rem] overflow-hidden shadow-2xl cursor-ew-resize select-none bg-surface-container"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      {/* Protected (full background) */}
      <img
        src={protectedUrl}
        alt="Protected"
        className="absolute inset-0 w-full h-full object-contain"
        draggable={false}
      />

      {/* Original (clipped to left of slider) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${position}%` }}
      >
        <img
          src={originalUrl}
          alt="Original"
          className="absolute inset-0 w-full h-full object-contain"
          style={{ width: containerRef.current?.offsetWidth || '100%' }}
          draggable={false}
        />
      </div>

      {/* Slider line + handle */}
      <div
        className="absolute inset-y-0 w-0.5 bg-white/60 backdrop-blur-sm z-10"
        style={{ left: `${position}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-xl">
          <span
            className="material-symbols-outlined text-primary text-xl"
            style={{
              transform: 'rotate(90deg)',
              fontVariationSettings: "'FILL' 0, 'wght' 400",
            }}
          >
            unfold_more
          </span>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-4 left-4 bg-white/70 backdrop-blur-xl px-3 py-1.5 rounded-lg font-body font-bold text-xs uppercase tracking-widest z-10">
        Original
      </div>
      <div className="absolute bottom-4 right-4 bg-white/70 backdrop-blur-xl px-3 py-1.5 rounded-lg font-body font-bold text-xs uppercase tracking-widest text-primary z-10">
        Protected
      </div>
    </div>
  )
}

export default ComparisonSlider
