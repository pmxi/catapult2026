import { useState, useEffect, useRef } from 'react'

interface ProcessingAnimationProps {
  originalFiles: File[]
  targetFile: File
  referenceFiles?: File[]
}

const MAX_VISIBLE = 5

function ProcessingAnimation({
  originalFiles,
  targetFile,
  referenceFiles = [],
}: ProcessingAnimationProps) {
  const [step, setStep] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fakePercent, setFakePercent] = useState(0)

  const urlsRef = useRef<string[]>([])
  const [originalUrls, setOriginalUrls] = useState<string[]>([])
  const [targetUrl, setTargetUrl] = useState('')
  const [referenceUrls, setReferenceUrls] = useState<string[]>([])

  // Persist positions across encoding↔comparing cycles
  const comparePairRef = useRef(0)
  const encodeIndexRef = useRef(0)

  // Create blob URLs on mount
  useEffect(() => {
    const oUrls = originalFiles.map((f) => URL.createObjectURL(f))
    const tUrl = URL.createObjectURL(targetFile)
    const rUrls = referenceFiles.map((f) => URL.createObjectURL(f))
    urlsRef.current = [...oUrls, tUrl, ...rUrls]
    setOriginalUrls(oUrls)
    setTargetUrl(tUrl)
    setReferenceUrls(rUrls)

    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [originalFiles, targetFile, referenceFiles])

  // Step progression with variable durations
  useEffect(() => {
    let current = 0
    let cycles = 0
    let timeoutId: ReturnType<typeof setTimeout>

    const getDuration = (s: number) => {
      switch (s) {
        case 0: return 2500   // detecting
        case 1: return 2500   // extracting
        case 2: return 3000   // encoding
        case 3: return 5000   // comparing — longer to cycle through pairs
        default: return 2500
      }
    }

    const advance = () => {
      if (current < 3) {
        current++
      } else {
        current = 2
        cycles++
        setCycleCount(cycles)
      }
      setStep(current)
      // Only reset index for early steps; encoding/comparing manage their own
      if (current <= 1) setCurrentIndex(0)

      timeoutId = setTimeout(advance, getDuration(current))
    }

    timeoutId = setTimeout(advance, getDuration(0))

    return () => clearTimeout(timeoutId)
  }, [])

  // Cycle through images within extracting/encoding steps
  useEffect(() => {
    if (step !== 1 && step !== 2) return
    const count = originalUrls.length
    if (count <= 1) return

    // Step 1 (extracting) always starts at 0; step 2 (encoding) picks up where it left off
    const startIdx = step === 1 ? 0 : encodeIndexRef.current % count
    setCurrentIndex(startIdx)

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % count
        if (step === 2) encodeIndexRef.current = next
        return next
      })
    }, 1500)

    return () => clearInterval(interval)
  }, [step, cycleCount, originalUrls.length])

  // Cycle through comparison pairs — picks up where it left off
  useEffect(() => {
    if (step !== 3) return
    setFakePercent(0)

    const refCount = referenceUrls.length
    const origCount = originalUrls.length
    const totalPairs = refCount > 0 ? refCount * origCount : origCount

    // Start from where we left off last cycle
    const startIdx = comparePairRef.current % totalPairs
    setCurrentIndex(startIdx)

    if (totalPairs <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => {
        const next = (prev + 1) % totalPairs
        comparePairRef.current = next
        return next
      })
    }, 1800)

    return () => clearInterval(interval)
  }, [step, cycleCount, originalUrls.length, referenceUrls.length])

  // Fake percentage ticker
  useEffect(() => {
    if (step !== 3) return
    const interval = setInterval(() => {
      setFakePercent((p) => {
        const next = p + Math.random() * 12
        return next > 97 ? Math.random() * 30 + 60 : next
      })
    }, 80)
    return () => clearInterval(interval)
  }, [step, currentIndex])

  const stepLabels = ['DETECTING', 'EXTRACTING', 'ENCODING', 'COMPARING']

  // For comparing step: which pair?
  const getComparisonPair = () => {
    const refCount = referenceUrls.length
    const origCount = originalUrls.length
    if (refCount > 0) {
      const refIdx = Math.floor(currentIndex / origCount) % refCount
      const origIdx = currentIndex % origCount
      return {
        leftUrl: referenceUrls[refIdx] || targetUrl,
        rightUrl: originalUrls[origIdx] || targetUrl,
        leftLabel: `Reference ${refIdx + 1}`,
        rightLabel: `Protected ${origIdx + 1}`,
        pairNum: currentIndex + 1,
        totalPairs: refCount * origCount,
      }
    }
    // No references — compare originals with themselves
    const idx = currentIndex % origCount
    return {
      leftUrl: originalUrls[idx] || targetUrl,
      rightUrl: originalUrls[idx] || targetUrl,
      leftLabel: `Original ${idx + 1}`,
      rightLabel: `Protected ${idx + 1}`,
      pairNum: idx + 1,
      totalPairs: origCount,
    }
  }

  const visibleOriginals = originalUrls.slice(0, MAX_VISIBLE)
  const overflowCount = originalUrls.length - MAX_VISIBLE
  const visibleRefs = referenceUrls.slice(0, MAX_VISIBLE)
  const refOverflow = referenceUrls.length - MAX_VISIBLE

  if (!targetUrl) return null

  return (
    <div className="mt-8 mb-8 neo-container rounded-2xl p-6">
      {/* Step indicators */}
      <div className="flex justify-center gap-2 mb-6">
        {stepLabels.map((label, i) => (
          <div
            key={i}
            className={`px-3 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-500 ${
              step === i
                ? 'neo-step-active'
                : step > i ||
                    (i === 2 && step === 3) ||
                    (i === 3 && step === 2 && cycleCount > 0)
                  ? 'neo-step-done'
                  : 'text-gray-400'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Animation area */}
      <div className="relative h-64 flex items-center justify-center overflow-hidden">
        {/* Step 0: Detecting */}
        {step === 0 && (
          <div className="neo-fade-in flex flex-col items-center gap-4">
            {/* Original images row */}
            <div className="flex items-center gap-3">
              {visibleOriginals.map((url, i) => (
                <div
                  key={i}
                  className="relative w-20 h-20 rounded-lg overflow-hidden shadow-sm border border-outline-variant/30"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  <img
                    src={url}
                    alt={`Original ${i + 1}`}
                    className="w-full h-full object-cover brightness-90"
                  />
                  <div
                    className="neo-detect-box"
                    style={{ animationDelay: `${i * 0.3}s` }}
                  />
                  <div
                    className="neo-detect-scanline"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                </div>
              ))}
              {overflowCount > 0 && (
                <div className="w-20 h-20 rounded-lg neo-overflow-badge">
                  +{overflowCount}
                </div>
              )}
            </div>

            {/* Reference images row */}
            {visibleRefs.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="neo-ref-label">REF</span>
                {visibleRefs.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-14 h-14 rounded-lg overflow-hidden shadow-sm border border-outline-variant/20"
                  >
                    <img
                      src={url}
                      alt={`Reference ${i + 1}`}
                      className="w-full h-full object-cover brightness-90 opacity-80"
                    />
                    <div
                      className="neo-detect-box"
                      style={{ animationDelay: `${(i + visibleOriginals.length) * 0.3}s` }}
                    />
                  </div>
                ))}
                {refOverflow > 0 && (
                  <div className="w-14 h-14 rounded-lg neo-overflow-badge text-xs">
                    +{refOverflow}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 1: Extracting */}
        {step === 1 && (
          <div className="neo-fade-in flex items-center gap-8">
            <div className="relative h-40 w-40">
              <img
                key={`extract-${currentIndex}`}
                src={originalUrls[currentIndex] || targetUrl}
                alt="Extracting"
                className="h-full w-full object-cover rounded-lg opacity-20"
              />
              <div className="neo-crop-zoom">
                <img
                  src={originalUrls[currentIndex] || targetUrl}
                  alt="Face crop"
                  className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                />
              </div>
              {originalUrls.length > 1 && (
                <div className="absolute top-2 right-2 neo-counter">
                  {currentIndex + 1}/{originalUrls.length}
                </div>
              )}
            </div>
            <div className="neo-arrow-flow">
              <div className="neo-arrow-line" />
              <div className="neo-arrow-head" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-primary/30 shadow-md">
                <img
                  src={originalUrls[currentIndex] || targetUrl}
                  alt="Extracted"
                  className="w-full h-full object-cover object-[center_30%] scale-[1.6]"
                />
              </div>
              <span className="text-xs text-on-surface-variant font-mono">
                extracted
              </span>
            </div>
          </div>
        )}

        {/* Step 2: Encoding */}
        {step === 2 && (
          <div className="neo-fade-in flex items-center gap-8">
            <div className="relative h-40 w-40 rounded-lg overflow-hidden neo-encode-panel">
              <img
                key={`encode-${currentIndex}-${cycleCount}`}
                src={originalUrls[currentIndex] || targetUrl}
                alt="Encoding"
                className="h-full w-full object-cover object-[center_30%] scale-[1.8] neo-glitch"
              />
              <div className="neo-rgb-r">
                <img
                  src={originalUrls[currentIndex] || targetUrl}
                  alt=""
                  className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                />
              </div>
              <div className="neo-rgb-b">
                <img
                  src={originalUrls[currentIndex] || targetUrl}
                  alt=""
                  className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                />
              </div>
              <div className="neo-scanlines" />
              {cycleCount === 0 ? (
                <div className="neo-silhouette" />
              ) : (
                <div className="neo-blur-mask">
                  <img
                    src={originalUrls[currentIndex] || targetUrl}
                    alt=""
                    className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                  />
                </div>
              )}
              {originalUrls.length > 1 && (
                <div className="absolute top-2 right-2 neo-counter z-20">
                  {currentIndex + 1}/{originalUrls.length}
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="neo-encode-label font-mono text-sm tracking-widest">
                {cycleCount === 0 ? 'MASKING' : 'PERTURBING'}
                {originalUrls.length > 1 && ` ${currentIndex + 1}/${originalUrls.length}`}
              </span>
              <div className="neo-progress-bar">
                <div className="neo-progress-fill" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Comparing */}
        {step === 3 && (() => {
          const pair = getComparisonPair()
          return (
            <div
              key={`compare-${currentIndex}`}
              className="neo-fade-in flex items-center gap-4"
            >
              <div className="flex flex-col items-center gap-1">
                <div className="h-32 w-32 rounded-lg overflow-hidden neo-slide-in-left border neo-border-glow">
                  <img
                    src={pair.leftUrl}
                    alt={pair.leftLabel}
                    className="h-full w-full object-cover object-[center_30%] scale-[1.4]"
                  />
                </div>
                <span className="text-xs text-on-surface-variant font-mono">
                  {pair.leftLabel}
                </span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <span className="neo-vs-badge">VS</span>
                <span className="neo-percent font-mono text-2xl font-bold">
                  {fakePercent.toFixed(1)}%
                </span>
                {pair.totalPairs > 1 && (
                  <span className="neo-counter mt-1">
                    {pair.pairNum}/{pair.totalPairs}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-32 w-32 rounded-lg overflow-hidden neo-slide-in-right border neo-border-glow">
                  <img
                    src={pair.rightUrl}
                    alt={pair.rightLabel}
                    className="h-full w-full object-cover object-[center_30%] scale-[1.4]"
                  />
                </div>
                <span className="text-xs text-on-surface-variant font-mono">
                  {pair.rightLabel}
                </span>
              </div>
            </div>
          )
        })()}
      </div>
    </div>
  )
}

export default ProcessingAnimation
