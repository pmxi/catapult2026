import { useState, useEffect, useRef } from 'react'

interface ProcessingAnimationProps {
  originalFiles: File[]
  targetFile: File
}

const STEP_DURATION = 2500

function ProcessingAnimation({
  originalFiles,
  targetFile,
}: ProcessingAnimationProps) {
  const [step, setStep] = useState(0)
  const [cycleCount, setCycleCount] = useState(0)
  const [fakePercent, setFakePercent] = useState(0)

  const urlsRef = useRef<string[]>([])
  const [originalUrl, setOriginalUrl] = useState('')
  const [targetUrl, setTargetUrl] = useState('')

  useEffect(() => {
    const oUrl = URL.createObjectURL(originalFiles[0])
    const tUrl = URL.createObjectURL(targetFile)
    urlsRef.current = [oUrl, tUrl]
    setOriginalUrl(oUrl)
    setTargetUrl(tUrl)

    return () => {
      urlsRef.current.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [originalFiles, targetFile])

  useEffect(() => {
    let current = 0
    let cycles = 0

    const interval = setInterval(() => {
      if (current < 3) {
        current++
      } else {
        current = 2
        cycles++
        setCycleCount(cycles)
      }
      setStep(current)
    }, STEP_DURATION)

    return () => clearInterval(interval)
  }, [])

  // Fake percentage ticker for comparing step
  useEffect(() => {
    if (step !== 3) return
    setFakePercent(0)
    const interval = setInterval(() => {
      setFakePercent((p) => {
        const next = p + Math.random() * 12
        return next > 97 ? Math.random() * 30 + 60 : next
      })
    }, 80)
    return () => clearInterval(interval)
  }, [step, cycleCount])

  const stepLabels = ['DETECTING', 'EXTRACTING', 'ENCODING', 'COMPARING']

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
                  : 'text-gray-600'
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      {/* Animation area */}
      <div className="relative h-56 flex items-center justify-center overflow-hidden">
        {/* Step 0: Detecting */}
        {step === 0 && (
          <div className="flex items-center gap-10 neo-fade-in">
            <div className="relative">
              <img
                src={originalUrl}
                alt="Original"
                className="h-40 w-40 object-cover rounded-lg brightness-75"
              />
              <div className="neo-detect-box" />
              <div className="neo-detect-scanline" />
            </div>
            <div className="neo-dots">
              <span />
              <span />
              <span />
            </div>
            <div className="relative">
              <img
                src={targetUrl}
                alt="Target"
                className="h-40 w-40 object-cover rounded-lg brightness-75"
              />
              <div className="neo-detect-box" />
              <div className="neo-detect-scanline" />
            </div>
          </div>
        )}

        {/* Step 1: Extracting */}
        {step === 1 && (
          <div className="flex items-center gap-8 neo-fade-in">
            <div className="relative h-40 w-40">
              <img
                src={originalUrl}
                alt="Original"
                className="h-full w-full object-cover rounded-lg opacity-20"
              />
              <div className="neo-crop-zoom">
                <img
                  src={originalUrl}
                  alt="Face crop"
                  className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                />
              </div>
            </div>
            <div className="neo-arrow-flow">
              <div className="neo-arrow-line" />
              <div className="neo-arrow-head" />
            </div>
            <div className="relative h-40 w-40">
              <img
                src={targetUrl}
                alt="Target"
                className="h-full w-full object-cover rounded-lg opacity-20"
              />
              <div className="neo-crop-zoom">
                <img
                  src={targetUrl}
                  alt="Face crop"
                  className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Encoding */}
        {step === 2 && (
          <div className="flex items-center gap-8 neo-fade-in">
            <div className="relative h-40 w-40 rounded-lg overflow-hidden">
              <img
                src={targetUrl}
                alt="Target face"
                className="h-full w-full object-cover object-[center_30%] scale-[1.8] neo-glitch"
              />
              {/* RGB split layers */}
              <div className="neo-rgb-r">
                <img
                  src={targetUrl}
                  alt=""
                  className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                />
              </div>
              <div className="neo-rgb-b">
                <img
                  src={targetUrl}
                  alt=""
                  className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                />
              </div>
              {/* Scanlines */}
              <div className="neo-scanlines" />
              {/* Mask overlay */}
              {cycleCount === 0 ? (
                <div className="neo-silhouette" />
              ) : (
                <div className="neo-blur-mask">
                  <img
                    src={targetUrl}
                    alt=""
                    className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
                  />
                </div>
              )}
            </div>
            <div className="flex flex-col items-center gap-3">
              <span className="neo-encode-label font-mono text-sm tracking-widest">
                {cycleCount === 0 ? 'MASKING' : 'PERTURBING'}
              </span>
              <div className="neo-progress-bar">
                <div className="neo-progress-fill" />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Comparing */}
        {step === 3 && (
          <div className="flex items-center gap-4 neo-fade-in">
            <div className="h-36 w-36 rounded-lg overflow-hidden neo-slide-in-left border neo-border-glow">
              <img
                src={originalUrl}
                alt="Original face"
                className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
              />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="neo-vs-badge">VS</span>
              <span className="neo-percent font-mono text-2xl font-bold">
                {fakePercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-36 w-36 rounded-lg overflow-hidden neo-slide-in-right border neo-border-glow">
              <img
                src={targetUrl}
                alt="Tweaked face"
                className="h-full w-full object-cover object-[center_30%] scale-[1.8]"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ProcessingAnimation
